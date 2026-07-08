import { BusinessUnitRepository } from '@domain/business-unit/repositories/business-unit.repository';
import { CatalogService } from '@domain/catalog/services/catalog.service';
import { OrganizationRepository } from '@domain/organization/repositories/organization.repository';
import { UserRoleAssignmentRepository } from '@domain/user-role/repositories/user-role-assignment.repository';
import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk';
import {
  type ClientPlatform,
  composeRoleGrants,
  type FeatureUnlocks,
  type PermissionFeature,
  type PlatformBucket,
  type RevokedGrants,
  resolveUserFeatures,
  type VersionSnapshot,
} from '@vritti/api-sdk/catalog-resolver';
import type { BuType } from '@/db/schema';
import { PermissionSetCacheService } from '@/rbac/services/permission-set-cache.service';

type AssignmentGrants = { features: FeatureUnlocks; code: string; revoked: RevokedGrants | null };

export interface AssignedBU {
  id: string;
  name: string;
  code: string | null;
  type: BuType;
  timezone: string;
  currencyCode: string;
}

@Injectable()
export class UserPermissionsService {
  private readonly logger = new Logger(UserPermissionsService.name);

  constructor(
    private readonly userRoleAssignmentRepository: UserRoleAssignmentRepository,
    private readonly businessUnitRepository: BusinessUnitRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly catalogService: CatalogService,
    private readonly permissionSetCache: PermissionSetCacheService,
  ) {}

  // Resolves the API-enforceable enabled-permission set (granted ∧ not-locked) for a user at a BU on a platform
  async resolveEnabledPermissions(userId: string, buId: string, bucket: PlatformBucket = 'web'): Promise<Set<string>> {
    const cached = await this.permissionSetCache.get(userId, buId, bucket);
    if (cached) return cached;

    // getPermissions collapses ClientPlatform → bucket internally; 'android' stands in for the mobile bucket
    const { features } = await this.getPermissions(userId, buId, '', bucket === 'web' ? 'web' : 'android');

    const enabled = new Set<string>();
    for (const feature of features) {
      if (feature.locked) continue;
      const locked = new Set(feature.lockedPermissions.map((p) => p.code));
      for (const perm of feature.permissions) {
        if (!locked.has(perm)) enabled.add(`${feature.code}.${perm}`);
      }
    }

    await this.permissionSetCache.set(userId, buId, bucket, enabled);
    return enabled;
  }

  // Resolves the set of feature codes whose switch is on (present ∧ not plan/BU-locked) for a user at a BU
  async resolveAvailableFeatures(userId: string, buId: string, bucket: PlatformBucket = 'web'): Promise<Set<string>> {
    const { features } = await this.getPermissions(userId, buId, '', bucket === 'web' ? 'web' : 'android');
    const available = new Set<string>();
    for (const feature of features) {
      if (!feature.locked) available.add(feature.code);
    }
    return available;
  }

  // Returns distinct business units where the user has role assignments
  async getAssignedBusinessUnits(userId: string, orgId: string): Promise<AssignedBU[]> {
    const assignments = await this.userRoleAssignmentRepository.findByUser(userId);
    const buIds = [...new Set(assignments.map((a) => a.businessUnitId))];

    if (buIds.length === 0) return [];

    const allBUs = await this.businessUnitRepository.findByOrg(orgId);
    const buMap = new Map(allBUs.map((bu) => [bu.id, bu]));

    const result: AssignedBU[] = [];
    for (const id of buIds) {
      const bu = buMap.get(id);
      if (bu)
        result.push({
          id: bu.id,
          name: bu.name,
          code: bu.code,
          type: bu.type,
          timezone: bu.timezone,
          currencyCode: bu.currencyCode,
        });
    }
    return result;
  }

  // Resolves combined features + MF config for a user at a BU via api-sdk resolveUserFeatures; no snapshot/entitlement = zero features
  async getPermissions(
    userId: string,
    buId: string,
    _orgId: string,
    platform: ClientPlatform = 'web',
  ): Promise<{ features: PermissionFeature[] }> {
    const bu = await this.businessUnitRepository.findById(buId);
    if (!bu) throw new NotFoundException('Business unit not found.');

    // Get all role assignments for this user at this BU
    const assignments = await this.userRoleAssignmentRepository.findByUserAndBU(userId, buId);

    const snapshot = await this.catalogService.getActiveSnapshot();
    const org = await this.organizationRepository.findById(bu.organizationId);

    // Compose each role's effective grants first: base template (live from the snapshot) ∪ additions − revoked
    const effectiveGrants = assignments.map((a) =>
      this.composeAssignment(a, snapshot ?? undefined, org?.businessCode ?? undefined),
    );

    if (!snapshot || !org?.businessCode) {
      this.logger.warn(`No active catalog/entitlement — returning zero features for BU ${buId}`);
      return { features: [] };
    }

    const features = resolveUserFeatures({
      snapshot,
      businessCode: org.businessCode,
      planCode: org.planCode ?? undefined,
      buLocks: bu.featureLocks ?? undefined,
      roleFeatures: this.mergeRoleGrants(effectiveGrants),
      platform,
    });

    this.logger.log(`Resolved ${features.length} features for user ${userId} at BU ${buId} (platform=${platform})`);
    return { features };
  }

  // Composes one assignment's effective grants: template (from the active snapshot) ∪ additions − revoked
  private composeAssignment(
    assignment: AssignmentGrants,
    snapshot: VersionSnapshot | undefined,
    businessCode: string | undefined,
  ): FeatureUnlocks {
    const baseFeatures =
      snapshot && businessCode
        ? snapshot.businesses?.[businessCode]?.roleTemplates?.[assignment.code]?.features
        : undefined;
    return composeRoleGrants({
      baseFeatures,
      additions: assignment.features ?? {},
      revoked: assignment.revoked ?? undefined,
    });
  }

  // Merges the effective grants of all assignments additively per feature, per platform bucket
  private mergeRoleGrants(grantSets: FeatureUnlocks[]): FeatureUnlocks {
    const merged: FeatureUnlocks = {};
    for (const features of grantSets) {
      for (const [code, grant] of Object.entries(features)) {
        merged[code] ??= {};
        const entry = merged[code];
        if (grant.web !== undefined) entry.web = [...new Set([...(entry.web ?? []), ...grant.web])];
        if (grant.mobile !== undefined) entry.mobile = [...new Set([...(entry.mobile ?? []), ...grant.mobile])];
      }
    }
    return merged;
  }
}

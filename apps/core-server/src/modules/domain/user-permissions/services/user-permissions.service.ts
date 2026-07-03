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
  type RevokedGrants,
  resolveUserFeatures,
  type VersionSnapshot,
} from '@vritti/api-sdk/catalog-resolver';
import type { BuType } from '@/db/schema';

// Role grants joined per assignment at a BU — as returned by UserRoleAssignmentRepository.findByUserAndBU
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
  ) {}

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

  // Resolves combined features + MF config for a user at a specific BU:
  // active signed catalog snapshot ∧ org entitlement ∧ BU locks ∧ role grants via api-sdk resolveUserFeatures.
  // No active snapshot or entitlement = zero features (that IS the enforcement).
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

  // Composes one assignment's effective grants: template (from the active snapshot) ∪ additions − revoked.
  // A role's `code` IS its template link; missing template or legacy path (no snapshot) degrades gracefully.
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

  // Merges the effective grants of all assignments additively per feature, per platform bucket.
  // Undefined bucket = not a member there.
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

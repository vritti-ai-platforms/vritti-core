import { BusinessUnitRepository } from '@domain/business-unit/repositories/business-unit.repository';
import { CatalogService } from '@domain/catalog/services/catalog.service';
import { OrganizationRepository } from '@domain/organization/repositories/organization.repository';
import { UserRoleAssignmentRepository } from '@domain/user-role/repositories/user-role-assignment.repository';
import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk';
import {
  type ClientPlatform,
  composeRoleGrants,
  type PermissionFeature,
  type RevokedGrants,
  type RoleFeatureGrant,
  resolveUserFeatures,
  type VersionSnapshot,
} from '@vritti/api-sdk/catalog-resolver';

// Role grants joined per assignment at a BU — as returned by UserRoleAssignmentRepository.findByUserAndBU
type AssignmentGrants = { features: Record<string, string[]>; code: string; revoked: RevokedGrants | null };

export interface AssignedBU {
  id: string;
  name: string;
  code: string | null;
  type: string;
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
          type: bu.type as string,
          timezone: bu.timezone,
          currencyCode: bu.currencyCode,
        });
    }
    return result;
  }

  // Resolves combined features + MF config for a user at a specific BU:
  // active signed catalog snapshot ∧ org entitlement ∧ BU unlocks ∧ role grants via api-sdk resolveUserFeatures.
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
      buUnlocks: bu.featureUnlocks ?? undefined,
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
  ): Record<string, RoleFeatureGrant> {
    const baseFeatures =
      snapshot && businessCode
        ? snapshot.businesses?.[businessCode]?.roleTemplates?.find((t) => t.code === assignment.code)?.features
        : undefined;
    return composeRoleGrants({
      baseFeatures,
      additions: (assignment.features ?? {}) as Record<string, RoleFeatureGrant>,
      revoked: assignment.revoked ?? undefined,
    });
  }

  // Merges the effective grants of all assignments additively per feature, per platform bucket.
  // Legacy flat string[] grants apply to both buckets; undefined bucket = not a member there.
  private mergeRoleGrants(grantSets: Record<string, RoleFeatureGrant>[]): Record<string, RoleFeatureGrant> {
    const merged: Record<string, { web?: string[]; mobile?: string[] }> = {};
    for (const features of grantSets) {
      for (const [code, grant] of Object.entries(features)) {
        const web = Array.isArray(grant) ? grant : grant?.web;
        const mobile = Array.isArray(grant) ? grant : grant?.mobile;
        merged[code] ??= {};
        const entry = merged[code];
        if (web !== undefined) entry.web = [...new Set([...(entry.web ?? []), ...web])];
        if (mobile !== undefined) entry.mobile = [...new Set([...(entry.mobile ?? []), ...mobile])];
      }
    }
    return merged;
  }
}

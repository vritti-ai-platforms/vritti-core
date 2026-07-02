import { BusinessUnitRepository } from '@domain/business-unit/repositories/business-unit.repository';
import { CatalogService } from '@domain/catalog/services/catalog.service';
import { OrganizationRepository } from '@domain/organization/repositories/organization.repository';
import { UserRoleAssignmentRepository } from '@domain/user-role/repositories/user-role-assignment.repository';
import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk';
import {
  type ClientPlatform,
  type LockedPermission,
  type PermissionFeature,
  pickRouteForPlatform,
  type RoleFeatureGrant,
  resolveUserFeatures,
} from '@vritti/api-sdk/catalog-resolver';
import type { BusinessUnit } from '@/db/schema';

// Role grants joined per assignment at a BU — as returned by UserRoleAssignmentRepository.findByUserAndBU
type AssignmentGrants = { features: Record<string, string[]> };

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

  // Resolves combined features + MF config for a user at a specific BU.
  // Primary path: active signed catalog snapshot ∧ org entitlement ∧ BU unlocks ∧ role grants
  // via api-sdk resolveUserFeatures. Falls back to the legacy per-BU feature_catalog when no
  // active snapshot exists or the org has no entitlement yet (safe cutover — removed in Stage 4).
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

    if (snapshot && org?.businessCode) {
      const features = resolveUserFeatures({
        snapshot,
        businessCode: org.businessCode,
        planCode: org.planCode ?? undefined,
        buUnlocks: bu.featureUnlocks ?? undefined,
        roleFeatures: this.mergeRoleGrants(assignments),
        platform,
      });

      this.logger.log(`Resolved ${features.length} features for user ${userId} at BU ${buId} (platform=${platform})`);
      return { features };
    }

    return this.resolveFromLegacyCatalog(userId, bu, assignments, platform);
  }

  // Merges the role grants of all assignments additively per feature, per platform bucket.
  // Legacy flat string[] grants apply to both buckets; undefined bucket = not a member there.
  private mergeRoleGrants(assignments: AssignmentGrants[]): Record<string, RoleFeatureGrant> {
    const merged: Record<string, { web?: string[]; mobile?: string[] }> = {};
    for (const assignment of assignments) {
      if (!assignment.features) continue;

      const features = assignment.features as Record<string, { web?: string[]; mobile?: string[] } | string[]>;
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

  // LEGACY fallback: resolves against the per-BU feature_catalog pushed by the old sync (Stage 4 removes this)
  private resolveFromLegacyCatalog(
    userId: string,
    bu: BusinessUnit,
    assignments: AssignmentGrants[],
    platform: ClientPlatform,
  ): { features: PermissionFeature[] } {
    // Catalog is pushed from cloud and stored on the BU row — no runtime cloud dependency
    const catalog = bu.featureCatalog ?? [];
    const catalogMap = new Map(catalog.map((f) => [f.code, f]));

    // Role grants are stored per platform; resolve only the requesting surface's bucket.
    // web → 'web'; ios/android → 'mobile'. (x-platform still drives the per-OS route below.)
    const bucket: 'web' | 'mobile' = platform === 'web' ? 'web' : 'mobile';

    // Merge features from all assigned roles additively, taking only this platform's grants
    const mergedFeatures = new Map<string, Set<string>>();
    for (const assignment of assignments) {
      if (!assignment.features) continue;

      const features = assignment.features as Record<string, { web?: string[]; mobile?: string[] } | string[]>;
      for (const [code, grant] of Object.entries(features)) {
        // Tolerate the legacy flat shape (string[]) during re-provisioning
        const granted = Array.isArray(grant) ? grant : grant?.[bucket];
        // Membership is the gate: undefined = not a member on this platform; [] = member with no actions (view-only)
        if (granted === undefined) continue;
        if (!mergedFeatures.has(code)) mergedFeatures.set(code, new Set());
        for (const perm of granted) mergedFeatures.get(code)?.add(perm);
      }
    }

    // Cross-reference with feature catalog to build the response
    const features: PermissionFeature[] = [];
    for (const [code, permsSet] of mergedFeatures) {
      const catalogEntry = catalogMap.get(code);
      if (!catalogEntry) continue;

      const route = pickRouteForPlatform(catalogEntry, platform);
      // Feature isn't published to this platform — omit so client doesn't see an unloadable tile.
      if (!route) continue;

      // Plan/BU lock a subset of permissions; surface which GRANTED ones are locked + why + how to unlock (upsell)
      const permByCode = new Map((catalogEntry.permissions ?? []).map((p) => [p.code, p]));
      const grantedPerms = [...permsSet];
      const lockedPermissions: LockedPermission[] = grantedPerms
        .map((c) => permByCode.get(c))
        .filter((p): p is NonNullable<typeof p> => !!p?.locked)
        .map((p) => ({ code: p.code, reason: p.lockReason ?? null, unlockPlans: p.unlockPlans ?? [] }));

      features.push({
        code,
        name: catalogEntry.name,
        lucideIcon: catalogEntry.lucideIcon,
        sfSymbol: catalogEntry.sfSymbol,
        materialSymbol: catalogEntry.materialSymbol,
        permissions: grantedPerms,
        locked: catalogEntry.locked ?? false,
        lockReason: catalogEntry.lockReason ?? null,
        unlockPlans: catalogEntry.unlockPlans ?? [],
        lockedPermissions,
        route,
        appCode: catalogEntry.appCode,
        appName: catalogEntry.appName,
        appIcon: catalogEntry.appIcon,
        appSortOrder: catalogEntry.appSortOrder,
      });
    }

    this.logger.log(
      `Resolved ${features.length} features for user ${userId} at BU ${bu.id} via legacy catalog (platform=${platform})`,
    );
    return { features };
  }
}

import { BusinessUnitRepository } from '@domain/business-unit/repositories/business-unit.repository';
import { UserRoleAssignmentRepository } from '@domain/user-role/repositories/user-role-assignment.repository';
import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk';

export type ClientPlatform = 'web' | 'ios' | 'android';

export interface PermissionFeature {
  code: string;
  name: string;
  lucideIcon: string | null;
  sfSymbol: string;
  materialSymbol: string;
  permissions: string[];
  // Plan lock overlay (for upsell rendering): feature-level + the granted permissions that are plan-locked
  locked: boolean;
  lockedPermissions: string[];
  route: {
    remoteEntry: string;
    exposedModule: string;
    routePrefix: string;
  };
  appCode: string;
  appName: string;
  appIcon: string | null;
  appSortOrder: number;
}

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
  // platform picks which microfrontend block flows into PermissionFeature.route:
  //   'web'     → WEB block (remoteEntry + exposedModule + routePrefix)
  //   'ios'     → MOBILE block, remoteEntry = remoteEntryIos
  //   'android' → MOBILE block, remoteEntry = remoteEntryAndroid
  // Features missing the requested platform's block are filtered out.
  async getPermissions(
    userId: string,
    buId: string,
    _orgId: string,
    platform: ClientPlatform = 'web',
  ): Promise<{ features: PermissionFeature[] }> {
    const bu = await this.businessUnitRepository.findById(buId);
    if (!bu) throw new NotFoundException('Business unit not found.');

    // Catalog is pushed from cloud and stored on the BU row — no runtime cloud dependency
    const catalog = bu.featureCatalog ?? [];
    const catalogMap = new Map(catalog.map((f) => [f.code, f]));

    // Get all role assignments for this user at this BU
    const assignments = await this.userRoleAssignmentRepository.findByUserAndBU(userId, buId);

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
        const perms = Array.isArray(grant) ? grant : (grant?.[bucket] ?? []);
        if (perms.length === 0) continue;
        if (!mergedFeatures.has(code)) mergedFeatures.set(code, new Set());
        for (const perm of perms) mergedFeatures.get(code)?.add(perm);
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

      // The plan locks a subset of permissions; surface which granted ones are locked (for upsell)
      const lockedSet = new Set((catalogEntry.permissions ?? []).filter((p) => p.locked).map((p) => p.code));
      const grantedPerms = [...permsSet];

      features.push({
        code,
        name: catalogEntry.name,
        lucideIcon: catalogEntry.lucideIcon,
        sfSymbol: catalogEntry.sfSymbol,
        materialSymbol: catalogEntry.materialSymbol,
        permissions: grantedPerms,
        locked: catalogEntry.locked ?? false,
        lockedPermissions: grantedPerms.filter((c) => lockedSet.has(c)),
        route,
        appCode: catalogEntry.appCode,
        appName: catalogEntry.appName,
        appIcon: catalogEntry.appIcon,
        appSortOrder: catalogEntry.appSortOrder,
      });
    }

    this.logger.log(`Resolved ${features.length} features for user ${userId} at BU ${buId} (platform=${platform})`);
    return { features };
  }
}

// Selects the route block from a catalog entry for the requested platform.
// Returns null when the catalog entry doesn't publish to that platform.
function pickRouteForPlatform(
  entry: {
    web: {
      remoteEntry: string;
      exposedModule: string;
      routePrefix: string;
    } | null;
    mobile: {
      remoteEntryAndroid: string;
      remoteEntryIos: string;
      exposedModule: string;
      routePrefix: string;
    } | null;
  },
  platform: ClientPlatform,
): { remoteEntry: string; exposedModule: string; routePrefix: string } | null {
  if (platform === 'ios' || platform === 'android') {
    if (!entry.mobile) return null;
    return {
      remoteEntry: platform === 'ios' ? entry.mobile.remoteEntryIos : entry.mobile.remoteEntryAndroid,
      exposedModule: entry.mobile.exposedModule,
      routePrefix: entry.mobile.routePrefix,
    };
  }
  // Web
  if (!entry.web) return null;
  return {
    remoteEntry: entry.web.remoteEntry,
    exposedModule: entry.web.exposedModule,
    routePrefix: entry.web.routePrefix,
  };
}

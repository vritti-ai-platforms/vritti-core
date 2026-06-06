import { BusinessUnitRepository } from '@domain/business-unit/repositories/business-unit.repository';
import { ConfigCacheService } from '@domain/config-cache/services/config-cache.service';
import { UserRoleAssignmentRepository } from '@domain/user-role/repositories/user-role-assignment.repository';
import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk';

export interface PermissionFeature {
  code: string;
  name: string;
  icon: string | null;
  sfSymbol: string;
  materialSymbol: string;
  permissions: string[];
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
    private readonly configCacheService: ConfigCacheService,
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

  // Resolves combined features + MF config for a user at a specific BU
  async getPermissions(userId: string, buId: string, _orgId: string): Promise<{ features: PermissionFeature[] }> {
    const bu = await this.businessUnitRepository.findById(buId);
    if (!bu) throw new NotFoundException('Business unit not found.');

    const catalog = await this.configCacheService.getFeatureCatalog(_orgId, buId);
    const catalogMap = new Map(catalog.map((f) => [f.code, f]));

    // Get all role assignments for this user at this BU
    const assignments = await this.userRoleAssignmentRepository.findByUserAndBU(userId, buId);

    // Merge features from all assigned roles additively
    const mergedFeatures = new Map<string, Set<string>>();
    for (const assignment of assignments) {
      if (!assignment.features) continue;

      const features = assignment.features as Record<string, string[]>;
      for (const [code, perms] of Object.entries(features)) {
        if (!mergedFeatures.has(code)) {
          mergedFeatures.set(code, new Set());
        }
        for (const perm of perms) {
          mergedFeatures.get(code)?.add(perm);
        }
      }
    }

    // Cross-reference with feature catalog to build the response
    const features: PermissionFeature[] = [];
    for (const [code, permsSet] of mergedFeatures) {
      const catalogEntry = catalogMap.get(code);
      if (!catalogEntry) continue;

      features.push({
        code,
        name: catalogEntry.name,
        icon: catalogEntry.icon,
        sfSymbol: catalogEntry.sfSymbol,
        materialSymbol: catalogEntry.materialSymbol,
        permissions: [...permsSet],
        route: {
          remoteEntry: catalogEntry.remoteEntry,
          exposedModule: catalogEntry.exposedModule,
          routePrefix: catalogEntry.routePrefix,
        },
        appCode: catalogEntry.appCode,
        appName: catalogEntry.appName,
        appIcon: catalogEntry.appIcon,
        appSortOrder: catalogEntry.appSortOrder,
      });
    }

    this.logger.log(`Resolved ${features.length} features for user ${userId} at BU ${buId}`);
    return { features };
  }
}

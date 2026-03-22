import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk';
import type { FeatureCatalogEntry } from '@/db/schema';
import { BusinessUnitRepository } from '../../business-unit/repositories/business-unit.repository';
import { OrganizationRepository } from '../../organization/repositories/organization.repository';
import { UserRoleAssignmentRepository } from '../../user/repositories/user-role-assignment.repository';

interface PermissionFeature {
  code: string;
  name: string;
  icon: string | null;
  permissions: string[];
  route: {
    remoteEntry: string;
    exposedModule: string;
    routePrefix: string;
  };
}

interface AssignedBU {
  id: string;
  name: string;
  code: string | null;
  type: string;
}

@Injectable()
export class UserPermissionsService {
  private readonly logger = new Logger(UserPermissionsService.name);

  constructor(
    private readonly userRoleAssignmentRepository: UserRoleAssignmentRepository,
    private readonly organizationRepository: OrganizationRepository,
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
      if (bu) result.push({ id: bu.id, name: bu.name, code: bu.code, type: bu.type as string });
    }
    return result;
  }

  // Resolves combined features + MF config for a user at a specific BU
  async getPermissions(userId: string, buId: string, orgId: string): Promise<{ features: PermissionFeature[] }> {
    const org = await this.organizationRepository.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found.');

    const catalog = (org.featureCatalog ?? []) as FeatureCatalogEntry[];
    const catalogMap = new Map(catalog.map((f) => [f.code, f]));

    // Get all role assignments for this user at this BU
    const assignments = await this.userRoleAssignmentRepository.findByUserAndBU(userId, buId);

    if (assignments.length > 0) {
    }

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
          mergedFeatures.get(code)!.add(perm);
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
        permissions: [...permsSet],
        route: {
          remoteEntry: catalogEntry.remoteEntry,
          exposedModule: catalogEntry.exposedModule,
          routePrefix: catalogEntry.routePrefix,
        },
      });
    }

    this.logger.log(`Resolved ${features.length} features for user ${userId} at BU ${buId}`);
    return { features };
  }
}

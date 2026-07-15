import { CatalogService } from '@domain/catalog/services/catalog.service';
import { OrganizationRepository } from '@domain/organization/repositories/organization.repository';
import { RoleRepository } from '@domain/organization/repositories/role.repository';
import { SiteRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { AssignmentType, Role, Site, UserRoleAssignment } from '@/db/schema';
import { AUTH_STATUS_EVENTS, UserUpdatedEvent } from '@/modules/core-api/auth/root/events/auth-status.events';
import { templateAssignableAtSite } from '@/rbac/permission-dependencies';
import { PermissionSetCacheService } from '@/rbac/services/permission-set-cache.service';
import type { AssignRoleInternalDto } from '../dto/request/assign-role-internal.dto';
import {
  type AssignmentWithNames,
  UserRoleAssignmentRepository,
} from '../repositories/user-role-assignment.repository';

@Injectable()
export class UserRoleService {
  private readonly logger = new Logger(UserRoleService.name);

  constructor(
    private readonly userRoleAssignmentRepository: UserRoleAssignmentRepository,
    private readonly roleRepository: RoleRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly siteRepository: SiteRepository,
    private readonly catalogService: CatalogService,
    private readonly permissionSetCache: PermissionSetCacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Re-pushes fresh auth-state to the user's live SSE connections after their entitlements change
  private emitUserUpdated(userId: string): void {
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.USER_UPDATED, new UserUpdatedEvent(userId));
  }

  // Assigns (or replaces) a user's single role at a target: site, site group, legal entity, or org-wide
  async assignRole(userId: string, dto: AssignRoleInternalDto): Promise<SuccessResponseDto> {
    const targetCount = [dto.siteId, dto.siteGroupId, dto.legalEntityId].filter(Boolean).length;
    if (targetCount > 1) {
      throw new BadRequestException({
        label: 'Invalid Target',
        detail: 'Provide at most one of siteId, siteGroupId, or legalEntityId (none = org-wide).',
      });
    }

    const role = await this.roleRepository.findById(dto.roleId);
    if (!role) throw new NotFoundException('Role not found.');

    const target = {
      siteId: dto.siteId ?? null,
      siteGroupId: dto.siteGroupId ?? null,
      legalEntityId: dto.legalEntityId ?? null,
    };
    const targetLabel = await this.resolveTargetLabel(target);

    // SITE targets must match the template's site type; GROUP/LE/ORG targets are allowed (resolution intersects per site)
    if (target.siteId) {
      const site = await this.siteRepository.findById(target.siteId);
      if (site) await this.assertRoleAppliesToSite(role, site);
    }

    // One role per user per target — replace the existing assignment's role if there is one
    const existing = await this.userRoleAssignmentRepository.findByUserAndTarget(userId, target);
    if (existing) {
      if (existing.roleId === dto.roleId) {
        return { success: true, message: 'Role already assigned.' };
      }
      await this.userRoleAssignmentRepository.update(existing.id, { roleId: dto.roleId, updatedAt: new Date() });
      await this.permissionSetCache.invalidateByUser(userId);
      this.emitUserUpdated(userId);
      this.logger.log(`Updated role to "${role.name}" for user ${userId} at ${targetLabel}`);
      return { success: true, message: 'Role updated successfully.' };
    }

    await this.userRoleAssignmentRepository.create({
      userId,
      roleId: dto.roleId,
      ...target,
      assignmentType: (dto.assignmentType as AssignmentType) ?? 'DIRECT',
    });

    await this.permissionSetCache.invalidateByUser(userId);
    this.emitUserUpdated(userId);
    this.logger.log(`Assigned role "${role.name}" to user ${userId} at ${targetLabel}`);
    return { success: true, message: 'Role assigned successfully.' };
  }

  // Rejects assigning a role at a site unless its template is SITE-scoped with a matching site type; custom/unknown templates pass
  private async assertRoleAppliesToSite(role: Role, site: Site): Promise<void> {
    const [snapshot, org] = await Promise.all([
      this.catalogService.getActiveSnapshot(),
      this.organizationRepository.findById(role.organizationId),
    ]);
    const template = org?.businessCode
      ? snapshot?.businesses?.[org.businessCode]?.roleTemplates?.[role.code]
      : undefined;
    if (!templateAssignableAtSite(template, site.type)) {
      const reason =
        template && template.scope !== 'SITE'
          ? `is ${template.scope}-scoped and can only be assigned at that level`
          : `targets ${template?.siteType} sites`;
      throw new BadRequestException({
        label: 'Role Not Applicable',
        detail: `"${role.name}" ${reason}, so it cannot be assigned at "${site.name}" (${site.type}).`,
        errors: [{ field: 'roleId', message: 'Incompatible role scope' }],
      });
    }
  }

  // Lists all role assignments for a user with the role name
  async findRoleAssignments(userId: string): Promise<(UserRoleAssignment & { roleName: string })[]> {
    return this.userRoleAssignmentRepository.findByUser(userId);
  }

  // Lists all role assignments directly targeting a site with user and role names
  async findBySite(siteId: string): Promise<AssignmentWithNames[]> {
    return this.userRoleAssignmentRepository.findBySite(siteId);
  }

  // Lists all role assignments directly targeting a site group with user and role names
  async findBySiteGroup(siteGroupId: string): Promise<AssignmentWithNames[]> {
    return this.userRoleAssignmentRepository.findBySiteGroup(siteGroupId);
  }

  // Lists all role assignments directly targeting a legal entity with user and role names
  async findByLegalEntity(legalEntityId: string): Promise<AssignmentWithNames[]> {
    return this.userRoleAssignmentRepository.findByLegalEntity(legalEntityId);
  }

  // Lists all org-wide role assignments with user and role names
  async findOrgWide(orgId: string): Promise<AssignmentWithNames[]> {
    return this.userRoleAssignmentRepository.findOrgWide(orgId);
  }

  // Returns user ids to re-push when an org-scoped entity (org, legal entity, or site group) changes
  async findUserIdsForOrg(orgId: string): Promise<string[]> {
    return this.userRoleAssignmentRepository.findUserIdsByOrg(orgId);
  }

  // Removes a role assignment by ID
  async removeRoleAssignment(assignmentId: string): Promise<SuccessResponseDto> {
    const assignment = await this.userRoleAssignmentRepository.findById(assignmentId);
    if (!assignment) throw new NotFoundException('Role assignment not found.');

    await this.userRoleAssignmentRepository.delete(assignmentId);

    await this.permissionSetCache.invalidateByUser(assignment.userId);
    this.emitUserUpdated(assignment.userId);
    this.logger.log(`Removed role assignment ${assignmentId}`);
    return { success: true, message: 'Role assignment removed successfully.' };
  }

  // Validates the assignment target exists and returns a log label for it
  private async resolveTargetLabel(target: {
    siteId: string | null;
    siteGroupId: string | null;
    legalEntityId: string | null;
  }): Promise<string> {
    if (target.siteId) {
      const site = await this.siteRepository.findById(target.siteId);
      if (!site) throw new NotFoundException('Site not found.');
      return `site "${site.name}"`;
    }
    if (target.siteGroupId) {
      const group = await this.userRoleAssignmentRepository.findSiteGroupById(target.siteGroupId);
      if (!group) throw new NotFoundException('Site group not found.');
      return `site group "${group.name}"`;
    }
    if (target.legalEntityId) {
      const legalEntity = await this.userRoleAssignmentRepository.findLegalEntityById(target.legalEntityId);
      if (!legalEntity) throw new NotFoundException('Legal entity not found.');
      return `legal entity "${legalEntity.name}"`;
    }
    return 'the organization';
  }
}

import type { SiteGroupDto } from '@domain/site-group/dto/entity/site-group.dto';
import type { CreateSiteGroupInternalDto } from '@domain/site-group/dto/request/create-site-group-internal.dto';
import type { UpdateSiteGroupInternalDto } from '@domain/site-group/dto/request/update-site-group-internal.dto';
import { SiteGroupDomainService } from '@domain/site-group/services/site-group.service';
import type { AssignmentWithNames } from '@domain/user-role/repositories/user-role-assignment.repository';
import { UserRoleDomainService } from '@domain/user-role/services/user-role.service';
import { Injectable } from '@nestjs/common';
import type { SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import type { OrgStructureSelectQueryDto } from '../../dto/request/org-structure-select-query.dto';
import type { SetFeatureLocksInternalDto } from '../../dto/request/set-feature-locks-internal.dto';
import type { FeatureLocksResponseDto } from '../../dto/response/feature-locks-response.dto';

@Injectable()
export class SiteGroupService {
  constructor(
    private readonly siteGroupService: SiteGroupDomainService,
    private readonly userRoleService: UserRoleDomainService,
  ) {}

  // Returns site groups as select options with subtree exclusion
  findForSelect(query: OrgStructureSelectQueryDto): Promise<SelectQueryResult> {
    return this.siteGroupService.findForSelect(query, query.excludeId);
  }

  // Lists role assignments targeting a site group
  async findRoleAssignments(siteGroupId: string): Promise<AssignmentWithNames[]> {
    return this.userRoleService.findBySiteGroup(siteGroupId);
  }

  // Returns the site group's stored feature lock deny-list
  async getFeatureLocks(id: string): Promise<FeatureLocksResponseDto> {
    return { featureLocks: await this.siteGroupService.getFeatureLocks(id) };
  }

  // Replaces the site group's feature lock deny-list
  async setFeatureLocks(id: string, dto: SetFeatureLocksInternalDto): Promise<SuccessResponseDto> {
    return this.siteGroupService.setFeatureLocks(id, dto.featureLocks ?? null);
  }

  // Creates a new site group
  async create(orgId: string, dto: CreateSiteGroupInternalDto): Promise<SiteGroupDto> {
    return this.siteGroupService.create(orgId, dto);
  }

  // Lists all site groups for an organization
  async findByOrg(orgId: string): Promise<SiteGroupDto[]> {
    return this.siteGroupService.findByOrg(orgId);
  }

  // Returns a single site group by ID
  async findById(id: string): Promise<SiteGroupDto> {
    return this.siteGroupService.findById(id);
  }

  // Updates a site group
  async update(id: string, dto: UpdateSiteGroupInternalDto): Promise<SuccessResponseDto> {
    return this.siteGroupService.update(id, dto);
  }

  // Reorders a batch of sibling site groups
  async reorder(orgId: string, ids: string[]): Promise<SuccessResponseDto> {
    return this.siteGroupService.reorder(orgId, ids);
  }

  // Reparents a site group under a new parent (null = root)
  async reparent(id: string, parentId: string | null): Promise<SuccessResponseDto> {
    return this.siteGroupService.reparent(id, parentId);
  }

  // Deletes a site group
  async remove(id: string): Promise<SuccessResponseDto> {
    return this.siteGroupService.remove(id);
  }
}

import type { SiteGroupDto } from '@domain/site-group/dto/entity/site-group.dto';
import type { CreateSiteGroupInternalDto } from '@domain/site-group/dto/request/create-site-group-internal.dto';
import type { UpdateSiteGroupInternalDto } from '@domain/site-group/dto/request/update-site-group-internal.dto';
import { SiteGroupService } from '@domain/site-group/services/site-group.service';
import type { AssignmentWithNames } from '@domain/user-role/repositories/user-role-assignment.repository';
import { UserRoleService } from '@domain/user-role/services/user-role.service';
import { Injectable } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import type { SetFeatureLocksInternalDto } from '../../dto/request/set-feature-locks-internal.dto';
import type { FeatureLocksResponseDto } from '../../dto/response/feature-locks-response.dto';

@Injectable()
export class SiteGroupApiService {
  constructor(
    private readonly siteGroupService: SiteGroupService,
    private readonly userRoleService: UserRoleService,
  ) {}

  // Lists role assignments targeting a site group
  async findRoleAssignments(siteGroupId: string): Promise<AssignmentWithNames[]> {
    return this.userRoleService.findBySiteGroup(siteGroupId);
  }

  // Returns the site group's stored feature lock deny-list
  async getFeatureLocks(id: string): Promise<FeatureLocksResponseDto> {
    return { featureLocks: await this.siteGroupService.getFeatureLocks(id) };
  }

  // Replaces the site group's feature lock deny-list (null = inherit the full plan)
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

  // Deletes a site group
  async remove(id: string): Promise<SuccessResponseDto> {
    return this.siteGroupService.remove(id);
  }
}

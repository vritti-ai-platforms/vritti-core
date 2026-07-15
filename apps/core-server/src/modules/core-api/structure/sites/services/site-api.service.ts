import type { SiteDto } from '@domain/site/dto/entity/site.dto';
import type { CreateSiteInternalDto } from '@domain/site/dto/request/create-site-internal.dto';
import type { UpdateSiteInternalDto } from '@domain/site/dto/request/update-site-internal.dto';
import { SiteService } from '@domain/site/services/site.service';
import { UserRoleService } from '@domain/user-role/services/user-role.service';
import { Injectable } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import type { UserRoleAssignment } from '@/db/schema';
import type { SetFeatureLocksInternalDto } from '../../dto/request/set-feature-locks-internal.dto';

@Injectable()
export class SiteApiService {
  constructor(
    private readonly siteService: SiteService,
    private readonly userRoleService: UserRoleService,
  ) {}

  // Creates a new site
  async create(orgId: string, dto: CreateSiteInternalDto): Promise<SiteDto> {
    return this.siteService.create(orgId, dto);
  }

  // Lists all sites for an organization
  async findByOrg(orgId: string): Promise<SiteDto[]> {
    return this.siteService.findByOrg(orgId);
  }

  // Returns a single site by ID
  async findById(id: string): Promise<SiteDto> {
    return this.siteService.findById(id);
  }

  // Lists role assignments targeting a site
  async findRoleAssignments(
    siteId: string,
  ): Promise<(UserRoleAssignment & { userName: string; userEmail: string; roleName: string })[]> {
    return this.userRoleService.findBySite(siteId);
  }

  // Replaces the site's feature lock deny-list
  async setFeatureLocks(id: string, dto: SetFeatureLocksInternalDto): Promise<SuccessResponseDto> {
    return this.siteService.setFeatureLocks(id, dto.featureLocks ?? null);
  }

  // Reorders a batch of sites within a legal entity
  async reorder(orgId: string, ids: string[]): Promise<SuccessResponseDto> {
    return this.siteService.reorder(orgId, ids);
  }

  // Updates a site
  async update(id: string, dto: UpdateSiteInternalDto): Promise<SuccessResponseDto> {
    return this.siteService.update(id, dto);
  }

  // Deletes a site
  async remove(id: string): Promise<SuccessResponseDto> {
    return this.siteService.remove(id);
  }
}

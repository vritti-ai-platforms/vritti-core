import { SiteGroupDto } from '@domain/site-group/dto/entity/site-group.dto';
import { CreateSiteGroupInternalDto } from '@domain/site-group/dto/request/create-site-group-internal.dto';
import { ReorderSiteGroupsInternalDto } from '@domain/site-group/dto/request/reorder-site-groups-internal.dto';
import { ReparentSiteGroupInternalDto } from '@domain/site-group/dto/request/reparent-site-group-internal.dto';
import { UpdateSiteGroupInternalDto } from '@domain/site-group/dto/request/update-site-group-internal.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf } from '@vritti/api-sdk/auth';
import type { SelectQueryResult } from '@vritti/api-sdk/database';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';
import { OrgScopeInterceptor } from '@/security/interceptors/org-scope.interceptor';
import { OrgStructureSelectQueryDto } from '../dto/request/org-structure-select-query.dto';
import { SetFeatureLocksInternalDto } from '../dto/request/set-feature-locks-internal.dto';
import type { FeatureLocksResponseDto } from '../dto/response/feature-locks-response.dto';
import {
  ApiCreateSiteGroup,
  ApiDeleteSiteGroup,
  ApiGetSiteGroup,
  ApiGetSiteGroupLocks,
  ApiListSiteGroupRoleAssignments,
  ApiListSiteGroups,
  ApiReorderSiteGroups,
  ApiReparentSiteGroup,
  ApiSelectSiteGroups,
  ApiSetSiteGroupLocks,
  ApiUpdateSiteGroup,
} from './docs/site-group.docs';
import { SiteGroupService } from './services/site-group-api.service';

@ApiTags('Site Groups')
@Controller('site-groups/internal')
@Public()
@SkipCsrf()
@UseGuards(CloudSignatureGuard)
@UseInterceptors(OrgScopeInterceptor)
export class SiteGroupController {
  private readonly logger = new Logger(SiteGroupController.name);

  constructor(private readonly siteGroupApiService: SiteGroupService) {}

  // Creates a new site group for an organization
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateSiteGroup()
  async create(@Body() dto: CreateSiteGroupInternalDto): Promise<SiteGroupDto> {
    this.logger.log(`POST /site-groups/internal — "${dto.name}" for org ${dto.orgId}`);
    return this.siteGroupApiService.create(dto.orgId, dto);
  }

  // Lists all site groups for an organization
  @Get()
  @ApiListSiteGroups()
  async list(@Query('orgId') orgId: string): Promise<SiteGroupDto[]> {
    this.logger.log(`GET /site-groups/internal?orgId=${orgId}`);
    return this.siteGroupApiService.findByOrg(orgId);
  }

  // Returns site groups as select options with subtree exclusion
  @Get('select')
  @ApiSelectSiteGroups()
  async findForSelect(@Query() query: OrgStructureSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /site-groups/internal/select');
    return this.siteGroupApiService.findForSelect(query);
  }

  // Returns a single site group
  @Get(':id')
  @ApiGetSiteGroup()
  async getById(@Param('id') id: string): Promise<SiteGroupDto> {
    this.logger.log(`GET /site-groups/internal/${id}`);
    return this.siteGroupApiService.findById(id);
  }

  // Lists role assignments targeting a site group
  @Get(':id/role-assignments')
  @ApiListSiteGroupRoleAssignments()
  async listRoleAssignments(@Param('id') id: string) {
    this.logger.log(`GET /site-groups/internal/${id}/role-assignments`);
    return this.siteGroupApiService.findRoleAssignments(id);
  }

  // Returns the site group's feature lock deny-list
  @Get(':id/locks')
  @ApiGetSiteGroupLocks()
  async getLocks(@Param('id') id: string): Promise<FeatureLocksResponseDto> {
    this.logger.log(`GET /site-groups/internal/${id}/locks`);
    return this.siteGroupApiService.getFeatureLocks(id);
  }

  // Replaces the site group's feature lock deny-list
  @Put(':id/locks')
  @ApiSetSiteGroupLocks()
  async setLocks(@Param('id') id: string, @Body() dto: SetFeatureLocksInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /site-groups/internal/${id}/locks`);
    return this.siteGroupApiService.setFeatureLocks(id, dto);
  }

  // Reorders a batch of sibling site groups
  @Patch('reorder')
  @ApiReorderSiteGroups()
  async reorder(@Body() dto: ReorderSiteGroupsInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /site-groups/internal/reorder — ${dto.ids.length} group(s) for org ${dto.orgId}`);
    return this.siteGroupApiService.reorder(dto.orgId, dto.ids);
  }

  // Reparents a site group
  @Patch(':groupId/reparent')
  @ApiReparentSiteGroup()
  async reparent(
    @Param('groupId') groupId: string,
    @Body() dto: ReparentSiteGroupInternalDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /site-groups/internal/${groupId}/reparent — parent ${dto.parentId ?? 'root'}`);
    return this.siteGroupApiService.reparent(groupId, dto.parentId);
  }

  // Updates a site group
  @Patch(':id')
  @ApiUpdateSiteGroup()
  async update(@Param('id') id: string, @Body() dto: UpdateSiteGroupInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /site-groups/internal/${id}`);
    return this.siteGroupApiService.update(id, dto);
  }

  // Deletes a site group
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteSiteGroup()
  async remove(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /site-groups/internal/${id}`);
    return this.siteGroupApiService.remove(id);
  }
}

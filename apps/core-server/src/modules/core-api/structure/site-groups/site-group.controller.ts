import { SiteGroupDto } from '@domain/site-group/dto/entity/site-group.dto';
import { CreateSiteGroupInternalDto } from '@domain/site-group/dto/request/create-site-group-internal.dto';
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
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';
import { OrgScopeInterceptor } from '@/security/interceptors/org-scope.interceptor';
import { SetFeatureLocksInternalDto } from '../dto/request/set-feature-locks-internal.dto';
import type { FeatureLocksResponseDto } from '../dto/response/feature-locks-response.dto';
import {
  ApiCreateSiteGroup,
  ApiDeleteSiteGroup,
  ApiGetSiteGroup,
  ApiGetSiteGroupLocks,
  ApiListSiteGroupRoleAssignments,
  ApiListSiteGroups,
  ApiSetSiteGroupLocks,
  ApiUpdateSiteGroup,
} from './docs/site-group.docs';
import { SiteGroupApiService } from './services/site-group-api.service';

@ApiTags('Site Groups')
@Controller('site-groups/internal')
@Public()
@SkipCsrf()
@UseGuards(CloudSignatureGuard)
@UseInterceptors(OrgScopeInterceptor)
export class SiteGroupController {
  private readonly logger = new Logger(SiteGroupController.name);

  constructor(private readonly siteGroupApiService: SiteGroupApiService) {}

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

  // Replaces the site group's feature lock deny-list (null = inherit the full plan)
  @Put(':id/locks')
  @ApiSetSiteGroupLocks()
  async setLocks(@Param('id') id: string, @Body() dto: SetFeatureLocksInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /site-groups/internal/${id}/locks`);
    return this.siteGroupApiService.setFeatureLocks(id, dto);
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

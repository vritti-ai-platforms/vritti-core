import { SiteDto } from '@domain/site/dto/entity/site.dto';
import { CreateSiteInternalDto } from '@domain/site/dto/request/create-site-internal.dto';
import { ReorderSitesInternalDto } from '@domain/site/dto/request/reorder-sites-internal.dto';
import { UpdateSiteInternalDto } from '@domain/site/dto/request/update-site-internal.dto';
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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { SelectQueryResult } from '@vritti/api-sdk/select';
import { OrgId } from '@/security/decorators/org-id.decorator';
import { SetFeatureLocksInternalDto } from '../dto/request/set-feature-locks-internal.dto';
import {
  ApiCreateSite,
  ApiDeleteSite,
  ApiGetSite,
  ApiListSites,
  ApiReorderSites,
  ApiSelectSites,
  ApiSelectSiteTypes,
  ApiSetSiteLocks,
  ApiUpdateSite,
} from './docs/site.docs';
import { SiteSelectQueryDto } from './dto/request/site-select-query.dto';
import { SiteService } from './services/site-api.service';

@ApiTags('Sites')
@Controller('sites/internal')
@Require(AuthType.Cloud)
export class SiteController {
  private readonly logger = new Logger(SiteController.name);

  constructor(private readonly siteApiService: SiteService) {}

  // Creates a new site for an organization
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateSite()
  async create(@OrgId() orgId: string, @Body() dto: CreateSiteInternalDto): Promise<SiteDto> {
    this.logger.log(`POST /sites/internal — "${dto.name}" for org ${orgId}`);
    return this.siteApiService.create(orgId, dto);
  }

  // Lists all sites for an organization
  @Get()
  @ApiListSites()
  async list(@OrgId() orgId: string): Promise<SiteDto[]> {
    this.logger.log(`GET /sites/internal — org ${orgId}`);
    return this.siteApiService.findByOrg(orgId);
  }

  // Returns the organization's active sites as select options
  @Get('select')
  @ApiSelectSites()
  async findForSelect(@OrgId() orgId: string, @Query() query: SiteSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`GET /sites/internal/select — org ${orgId}`);
    return this.siteApiService.findForSelect(orgId, query);
  }

  // Returns the site types this organization actually has, as select options
  @Get('types')
  @ApiSelectSiteTypes()
  async findTypesForSelect(@OrgId() orgId: string): Promise<SelectQueryResult> {
    this.logger.log(`GET /sites/internal/types — org ${orgId}`);
    return this.siteApiService.findTypesForSelect(orgId);
  }

  // Returns a single site
  @Get(':id')
  @ApiGetSite()
  async getById(@Param('id') id: string): Promise<SiteDto> {
    this.logger.log(`GET /sites/internal/${id}`);
    return this.siteApiService.findById(id);
  }

  // Lists role assignments targeting a site
  @Get(':id/role-assignments')
  async listRoleAssignments(@Param('id') id: string) {
    this.logger.log(`GET /sites/internal/${id}/role-assignments`);
    return this.siteApiService.findRoleAssignments(id);
  }

  // Replaces the site's feature lock deny-list
  @Put(':id/locks')
  @ApiSetSiteLocks()
  async setLocks(@Param('id') id: string, @Body() dto: SetFeatureLocksInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /sites/internal/${id}/locks`);
    return this.siteApiService.setFeatureLocks(id, dto);
  }

  // Reorders a batch of sites within a legal entity
  @Patch('reorder')
  @ApiReorderSites()
  async reorder(@OrgId() orgId: string, @Body() dto: ReorderSitesInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /sites/internal/reorder — ${pluralize('site', dto.ids.length, true)} for org ${orgId}`);
    return this.siteApiService.reorder(orgId, dto.ids);
  }

  // Updates a site
  @Patch(':id')
  @ApiUpdateSite()
  async update(@Param('id') id: string, @Body() dto: UpdateSiteInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /sites/internal/${id}`);
    return this.siteApiService.update(id, dto);
  }

  // Deletes a site
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteSite()
  async remove(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /sites/internal/${id}`);
    return this.siteApiService.remove(id);
  }
}

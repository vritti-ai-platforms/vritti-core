import { RoleService, type RolesByScope } from '@domain/organization/services/role.service';
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
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import type { Role } from '@/db/schema';
import { OrgIdHeader } from '@/security/decorators/org-id-header.decorator';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';
import { OrgScopeInterceptor } from '@/security/interceptors/org-scope.interceptor';
import {
  ApiCreateRole,
  ApiDeleteRole,
  ApiListRoles,
  ApiProvisionRoles,
  ApiRolesForSite,
  ApiRolesForTarget,
  ApiSelectRoles,
  ApiUpdateRole,
} from '../docs/roles.docs';
import { CreateRoleInternalDto } from '../dto/request/create-role-internal.dto';
import { ProvisionRolesInternalDto } from '../dto/request/provision-roles-internal.dto';
import { SelectRolesInternalDto } from '../dto/request/select-roles-internal.dto';
import { UpdateRoleInternalDto } from '../dto/request/update-role-internal.dto';

@ApiTags('Organization Roles')
@Controller('organizations/internal/roles')
@Public()
@SkipCsrf()
@UseGuards(CloudSignatureGuard)
@UseInterceptors(OrgScopeInterceptor)
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly roleService: RoleService) {}

  // Bulk provisions roles and their feature mappings for an organization
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiProvisionRoles()
  async provision(@Body() dto: ProvisionRolesInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /api/organizations/internal/roles — orgId: ${dto.orgId}`);
    return this.roleService.provision(dto.orgId, dto.roles);
  }

  // Lists an organization's roles grouped by scope (SITE by site type)
  @Get()
  @ApiListRoles()
  async list(@Query('orgId') orgId: string): Promise<RolesByScope> {
    this.logger.log(`GET /api/organizations/internal/roles?orgId=${orgId}`);
    return this.roleService.findByOrgGrouped(orgId);
  }

  // Returns all roles for the given site's organization
  @Get('for-site')
  @ApiRolesForSite()
  async findForSite(@Query('siteId') siteId: string): Promise<Role[]> {
    this.logger.log(`GET /api/organizations/internal/roles/for-site?siteId=${siteId}`);
    return this.roleService.findForSite(siteId);
  }

  // Returns the org's roles assignable at a target (ORG, LE, SITE_GROUP, or SITE)
  @Get('for-target')
  @ApiRolesForTarget()
  async findForTarget(
    @OrgIdHeader() orgId: string,
    @Query('targetType') targetType: string,
    @Query('targetId') targetId?: string,
  ): Promise<Role[]> {
    this.logger.log(`GET /organizations/internal/roles/for-target?targetType=${targetType} — org ${orgId}`);
    return this.roleService.findForTarget(orgId, targetType, targetId);
  }

  // Returns the org's roles matching an exact scope as select options
  @Get('select')
  @ApiSelectRoles()
  async findForSelect(
    @OrgIdHeader() orgId: string,
    @Query() query: SelectRolesInternalDto,
  ): Promise<SelectQueryResult> {
    this.logger.log(`GET /organizations/internal/roles/select?scope=${query.scope} — org ${orgId}`);
    return this.roleService.findForSelect(orgId, query, query.scope, query.siteId);
  }

  // Creates a single role with features
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateRole()
  async create(@Body() dto: CreateRoleInternalDto): Promise<CreateResponseDto<Role>> {
    this.logger.log(`POST /api/organizations/internal/roles/create — "${dto.name}" for org ${dto.orgId}`);
    return this.roleService.create(dto.orgId, dto);
  }

  // Updates an existing role's metadata and features
  @Patch(':id')
  @ApiUpdateRole()
  async update(@Param('id') id: string, @Body() dto: UpdateRoleInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /api/organizations/internal/roles/${id}`);
    return this.roleService.update(id, dto);
  }

  // Deletes a role and its associated data
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteRole()
  async remove(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /api/organizations/internal/roles/${id}`);
    return this.roleService.remove(id);
  }
}

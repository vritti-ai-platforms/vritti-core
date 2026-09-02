import { CreateRoleInternalDto } from '@domain/organization/dto/request/create-role-internal.dto';
import { UpdateRoleInternalDto } from '@domain/organization/dto/request/update-role-internal.dto';
import { RoleDomainService, type RolesByScope } from '@domain/organization/services/role.service';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import type { Role } from '@/db/schema';
import { OrgId } from '@/security/decorators/org-id.decorator';
import {
  ApiCreateRole,
  ApiDeleteRole,
  ApiListRoles,
  ApiResetRole,
  ApiRolesForSite,
  ApiRolesForTarget,
  ApiSelectRoles,
  ApiUpdateRole,
} from '../docs/roles.docs';
import { SelectRolesInternalDto } from '../dto/request/select-roles-internal.dto';

@ApiTags('Organization Roles')
@Controller('organizations/internal/roles')
@Require(AuthType.Cloud)
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly roleService: RoleDomainService) {}

  // Lists an organization's roles grouped by scope (SITE by site type)
  @Get()
  @ApiListRoles()
  async list(@OrgId() orgId: string): Promise<RolesByScope> {
    this.logger.log(`GET /api/organizations/internal/roles — org ${orgId}`);
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
    @OrgId() orgId: string,
    @Query('targetType') targetType: string,
    @Query('targetId') targetId?: string,
  ): Promise<Role[]> {
    this.logger.log(`GET /organizations/internal/roles/for-target?targetType=${targetType} — org ${orgId}`);
    return this.roleService.findForTarget(orgId, targetType, targetId);
  }

  // Returns the org's roles matching an exact scope as select options
  @Get('select')
  @ApiSelectRoles()
  async findForSelect(@OrgId() orgId: string, @Query() query: SelectRolesInternalDto): Promise<SelectQueryResult> {
    this.logger.log(`GET /organizations/internal/roles/select?scope=${query.scope} — org ${orgId}`);
    return this.roleService.findForSelect(orgId, query, query.scope, query.siteId);
  }

  // Creates a single role with features
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateRole()
  async create(@OrgId() orgId: string, @Body() dto: CreateRoleInternalDto): Promise<CreateResponseDto<Role>> {
    this.logger.log(`POST /api/organizations/internal/roles/create — "${dto.name}" for org ${orgId}`);
    return this.roleService.create(orgId, dto);
  }

  // Updates an existing role's metadata and features
  @Patch(':id')
  @ApiUpdateRole()
  async update(@Param('id') id: string, @Body() dto: UpdateRoleInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /api/organizations/internal/roles/${id}`);
    return this.roleService.update(id, dto);
  }

  // Clears a role's deltas so it tracks its base template again
  @Post(':id/reset')
  @HttpCode(HttpStatus.OK)
  @ApiResetRole()
  async resetRole(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /api/organizations/internal/roles/${id}/reset`);
    return this.roleService.resetToTemplate(id);
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

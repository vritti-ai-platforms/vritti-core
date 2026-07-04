import { RoleService } from '@domain/organization/services/role.service';
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
import type { CreateResponseDto } from '@vritti/api-sdk';
import { Public, SkipCsrf, type SuccessResponseDto } from '@vritti/api-sdk';
import { CloudSignatureGuard } from '@/common/guards/cloud-signature.guard';
import { OrgScopeInterceptor } from '@/common/interceptors/org-scope.interceptor';
import type { Role } from '@/db/schema';
import {
  ApiCreateRole,
  ApiDeleteRole,
  ApiListRoles,
  ApiProvisionRoles,
  ApiRolesForBu,
  ApiUpdateRole,
} from '../docs/roles.docs';
import { CreateRoleInternalDto } from '../dto/request/create-role-internal.dto';
import { ProvisionRolesInternalDto } from '../dto/request/provision-roles-internal.dto';
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

  // Lists all roles for an organization
  @Get()
  @ApiListRoles()
  async list(@Query('orgId') orgId: string): Promise<Role[]> {
    this.logger.log(`GET /api/organizations/internal/roles?orgId=${orgId}`);
    return this.roleService.findByOrg(orgId);
  }

  // Returns all roles for the given business unit's organization
  @Get('for-bu')
  @ApiRolesForBu()
  async findForBu(@Query('buId') buId: string): Promise<Role[]> {
    this.logger.log(`GET /api/organizations/internal/roles/for-bu?buId=${buId}`);
    return this.roleService.findForBU(buId);
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

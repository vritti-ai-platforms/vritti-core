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
import { type SuccessResponseDto, Public, SkipCsrf } from '@vritti/api-sdk';
import type { Role } from '@/db/schema';
import { WebhookSecretGuard } from '@/common/guards/webhook-secret.guard';
import { WebhookSessionInterceptor } from '@/common/interceptors/webhook-session.interceptor';
import {
  ApiCreateRoleWebhook,
  ApiDeleteRoleWebhook,
  ApiListRolesWebhook,
  ApiProvisionRolesWebhook,
  ApiRolesForBuWebhook,
  ApiUpdateRoleWebhook,
} from '../docs/roles.docs';
import { CreateRoleWebhookDto } from '../dto/request/create-role-webhook.dto';
import { ProvisionRolesWebhookDto } from '../dto/request/provision-roles-webhook.dto';
import { UpdateRoleWebhookDto } from '../dto/request/update-role-webhook.dto';
import { RoleService } from '@domain/organization/services/role.service';

@ApiTags('Organization Roles')
@Controller('organizations/webhook/roles')
@Public()
@SkipCsrf()
@UseGuards(WebhookSecretGuard)
@UseInterceptors(WebhookSessionInterceptor)
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly roleService: RoleService) {}

  // Bulk provisions roles and their feature mappings for an organization
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiProvisionRolesWebhook()
  async provision(@Body() dto: ProvisionRolesWebhookDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /api/organizations/webhook/roles — orgId: ${dto.orgId}`);
    return this.roleService.provision(dto.orgId, dto.roles);
  }

  // Lists all roles for an organization
  @Get()
  @ApiListRolesWebhook()
  async list(@Query('orgId') orgId: string): Promise<Role[]> {
    this.logger.log(`GET /api/organizations/webhook/roles?orgId=${orgId}`);
    return this.roleService.findByOrg(orgId);
  }

  // Returns all roles for the given business unit's organization
  @Get('for-bu')
  @ApiRolesForBuWebhook()
  async findForBu(@Query('buId') buId: string): Promise<Role[]> {
    this.logger.log(`GET /api/organizations/webhook/roles/for-bu?buId=${buId}`);
    return this.roleService.findForBU(buId);
  }

  // Creates a single role with features
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateRoleWebhook()
  async create(@Body() dto: CreateRoleWebhookDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /api/organizations/webhook/roles/create — "${dto.name}" for org ${dto.orgId}`);
    return this.roleService.create(dto.orgId, dto);
  }

  // Updates an existing role's metadata and features
  @Patch(':id')
  @ApiUpdateRoleWebhook()
  async update(@Param('id') id: string, @Body() dto: UpdateRoleWebhookDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /api/organizations/webhook/roles/${id}`);
    return this.roleService.update(id, dto);
  }

  // Deletes a role and its associated data
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteRoleWebhook()
  async remove(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /api/organizations/webhook/roles/${id}`);
    return this.roleService.remove(id);
  }
}

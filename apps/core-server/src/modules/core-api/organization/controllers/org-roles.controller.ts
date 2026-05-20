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
import type { OrgRole } from '@/db/schema';
import { WebhookSecretGuard } from '@/common/guards/webhook-secret.guard';
import { WebhookSessionInterceptor } from '@/common/interceptors/webhook-session.interceptor';
import {
  ApiCompatibleRolesWebhook,
  ApiCreateRoleWebhook,
  ApiDeleteRoleWebhook,
  ApiListRolesWebhook,
  ApiProvisionRolesWebhook,
  ApiUpdateRoleWebhook,
} from '../docs/org-roles.docs';
import { CreateRoleWebhookDto } from '../dto/request/create-role-webhook.dto';
import { ProvisionRolesWebhookDto } from '../dto/request/provision-roles-webhook.dto';
import { UpdateRoleWebhookDto } from '../dto/request/update-role-webhook.dto';
import { OrgRoleService } from '@domain/organization/services/org-role.service';

@ApiTags('Organization Roles')
@Controller('organizations/webhook/roles')
@Public()
@SkipCsrf()
@UseGuards(WebhookSecretGuard)
@UseInterceptors(WebhookSessionInterceptor)
export class OrgRolesController {
  private readonly logger = new Logger(OrgRolesController.name);

  constructor(private readonly orgRoleService: OrgRoleService) {}

  // Bulk provisions roles and their feature mappings for an organization
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiProvisionRolesWebhook()
  async provision(@Body() dto: ProvisionRolesWebhookDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /api/organizations/webhook/roles — orgId: ${dto.orgId}`);
    return this.orgRoleService.provision(dto.orgId, dto.roles);
  }

  // Lists all roles for an organization
  @Get()
  @ApiListRolesWebhook()
  async list(@Query('orgId') orgId: string): Promise<OrgRole[]> {
    this.logger.log(`GET /api/organizations/webhook/roles?orgId=${orgId}`);
    return this.orgRoleService.findByOrg(orgId);
  }

  // Returns roles whose appCodes are compatible with the given business unit
  @Get('compatible')
  @ApiCompatibleRolesWebhook()
  async findCompatible(@Query('buId') buId: string): Promise<OrgRole[]> {
    this.logger.log(`GET /api/organizations/webhook/roles/compatible?buId=${buId}`);
    return this.orgRoleService.findCompatibleWithBU(buId);
  }

  // Creates a single role with features
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateRoleWebhook()
  async create(@Body() dto: CreateRoleWebhookDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /api/organizations/webhook/roles/create — "${dto.name}" for org ${dto.orgId}`);
    return this.orgRoleService.create(dto.orgId, dto);
  }

  // Updates an existing role's metadata and features
  @Patch(':id')
  @ApiUpdateRoleWebhook()
  async update(@Param('id') id: string, @Body() dto: UpdateRoleWebhookDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /api/organizations/webhook/roles/${id}`);
    return this.orgRoleService.update(id, dto);
  }

  // Deletes a role and its associated data
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteRoleWebhook()
  async remove(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /api/organizations/webhook/roles/${id}`);
    return this.orgRoleService.remove(id);
  }
}

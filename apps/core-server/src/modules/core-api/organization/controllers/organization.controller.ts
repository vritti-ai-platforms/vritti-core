import { OrganizationDto } from '@domain/organization/dto/entity/organization.dto';
import { CreateOrganizationInternalDto } from '@domain/organization/dto/request/create-organization-internal.dto';
import { ReceiveEntitlementInternalDto } from '@domain/organization/dto/request/receive-entitlement-internal.dto';
import { UpdateOrganizationInternalDto } from '@domain/organization/dto/request/update-organization-internal.dto';
import { OrganizationDomainService } from '@domain/organization/services/organization.service';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require, SkipCsrf } from '@vritti/api-sdk/auth';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { OrgId } from '@/security/decorators/org-id.decorator';
import { SetFeatureLocksInternalDto } from '../../structure/dto/request/set-feature-locks-internal.dto';
import type { FeatureLocksResponseDto } from '../../structure/dto/response/feature-locks-response.dto';
import {
  ApiCreateOrganization,
  ApiGetOrganizationLocks,
  ApiReceiveEntitlement,
  ApiSetOrganizationLocks,
} from '../docs/organization.docs';

@ApiTags('Organizations')
@Controller('organizations')
@SkipCsrf()
export class OrganizationController {
  private readonly logger = new Logger(OrganizationController.name);

  constructor(private readonly organizationService: OrganizationDomainService) {}

  // Receives organization creation from cloud-server via the internal API
  @Post('internal')
  @Require(AuthType.Cloud)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateOrganization()
  async createFromCloud(@Body() dto: CreateOrganizationInternalDto): Promise<OrganizationDto> {
    this.logger.log('POST /api/organizations/internal');
    return this.organizationService.createFromCloud(dto);
  }

  // Returns the organization's feature lock deny-list (org resolved from the signed x-org-id header)
  @Get('internal/locks')
  @Require(AuthType.Cloud)
  @ApiGetOrganizationLocks()
  async getLocks(@OrgId() orgId: string): Promise<FeatureLocksResponseDto> {
    this.logger.log(`GET /organizations/internal/locks — org ${orgId}`);
    return { featureLocks: await this.organizationService.getFeatureLocks(orgId) };
  }

  // Replaces the organization's feature lock deny-list (org resolved from the signed x-org-id header)
  @Put('internal/locks')
  @Require(AuthType.Cloud)
  @ApiSetOrganizationLocks()
  async setLocks(@OrgId() orgId: string, @Body() dto: SetFeatureLocksInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /organizations/internal/locks — org ${orgId}`);
    return this.organizationService.setFeatureLocks(orgId, dto.featureLocks ?? null);
  }

  // Receives organization update from cloud-server via the internal API
  @Patch('internal/:id')
  @Require(AuthType.Cloud)
  @HttpCode(HttpStatus.OK)
  async updateFromCloud(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationInternalDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /organizations/internal/${id}`);
    return this.organizationService.updateFromCloud(id, dto);
  }

  // Receives the organization's signed plan entitlement from cloud-server via the internal API
  @Patch('internal/:orgId/entitlement')
  @Require(AuthType.Cloud)
  @HttpCode(HttpStatus.OK)
  @ApiReceiveEntitlement()
  async receiveEntitlement(
    @Param('orgId') orgId: string,
    @Body() dto: ReceiveEntitlementInternalDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /organizations/internal/${orgId}/entitlement`);
    return this.organizationService.receiveEntitlement(orgId, dto);
  }

  // Receives organization deletion from cloud-server via the internal API
  @Delete('internal/:id')
  @Require(AuthType.Cloud)
  @HttpCode(HttpStatus.OK)
  async deleteFromCloud(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /api/organizations/internal/${id}`);
    return this.organizationService.deleteFromCloud(id);
  }
}

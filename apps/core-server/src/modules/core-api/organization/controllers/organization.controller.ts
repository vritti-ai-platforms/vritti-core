import { OrganizationService } from '@domain/organization/services/organization.service';
import { Body, Controller, Delete, HttpCode, HttpStatus, Logger, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf, type SuccessResponseDto } from '@vritti/api-sdk';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';
import { ApiCreateOrganization, ApiReceiveEntitlement } from '../docs/organization.docs';
import { OrganizationDto } from '../dto/entity/organization.dto';
import { CreateOrganizationInternalDto } from '../dto/request/create-organization-internal.dto';
import { ReceiveEntitlementInternalDto } from '../dto/request/receive-entitlement-internal.dto';
import { UpdateOrganizationInternalDto } from '../dto/request/update-organization-internal.dto';

@ApiTags('Organizations')
@Controller('organizations')
@SkipCsrf()
export class OrganizationController {
  private readonly logger = new Logger(OrganizationController.name);

  constructor(private readonly organizationService: OrganizationService) {}

  // Receives organization creation from cloud-server via the internal API
  @Post('internal')
  @Public()
  @UseGuards(CloudSignatureGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateOrganization()
  async createFromCloud(@Body() dto: CreateOrganizationInternalDto): Promise<OrganizationDto> {
    this.logger.log('POST /api/organizations/internal');
    return this.organizationService.createFromCloud(dto);
  }

  // Receives organization update from cloud-server via the internal API
  @Patch('internal/:id')
  @Public()
  @UseGuards(CloudSignatureGuard)
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
  @Public()
  @UseGuards(CloudSignatureGuard)
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
  @Public()
  @UseGuards(CloudSignatureGuard)
  @HttpCode(HttpStatus.OK)
  async deleteFromCloud(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /api/organizations/internal/${id}`);
    return this.organizationService.deleteFromCloud(id);
  }
}

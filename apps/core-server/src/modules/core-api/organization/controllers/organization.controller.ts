import { Body, Controller, Delete, HttpCode, HttpStatus, Logger, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type SuccessResponseDto, Public, SkipCsrf } from '@vritti/api-sdk';
import { WebhookSecretGuard } from '@/common/guards/webhook-secret.guard';
import { ApiCreateOrganizationWebhook } from '../docs/organization.docs';
import { OrganizationDto } from '../dto/entity/organization.dto';
import { CreateOrganizationWebhookDto } from '../dto/request/create-organization-webhook.dto';
import { UpdateOrganizationWebhookDto } from '../dto/request/update-organization-webhook.dto';
import { OrganizationService } from '@domain/organization/services/organization.service';

@ApiTags('Organizations')
@Controller('organizations')
@SkipCsrf()
export class OrganizationController {
  private readonly logger = new Logger(OrganizationController.name);

  constructor(private readonly organizationService: OrganizationService) {}

  // Receives organization creation from cloud-server via webhook
  @Post('webhook')
  @Public()
  @UseGuards(WebhookSecretGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateOrganizationWebhook()
  async createFromWebhook(@Body() dto: CreateOrganizationWebhookDto): Promise<OrganizationDto> {
    this.logger.log('POST /api/organizations/webhook');
    return this.organizationService.createFromWebhook(dto);
  }

  // Receives organization update from cloud-server via webhook
  @Patch('webhook/:id')
  @Public()
  @UseGuards(WebhookSecretGuard)
  @HttpCode(HttpStatus.OK)
  async updateFromWebhook(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationWebhookDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /api/organizations/webhook/${id}`);
    return this.organizationService.updateFromWebhook(id, dto);
  }

  // Receives organization deletion from cloud-server via webhook
  @Delete('webhook/:id')
  @Public()
  @UseGuards(WebhookSecretGuard)
  @HttpCode(HttpStatus.OK)
  async deleteFromWebhook(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /api/organizations/webhook/${id}`);
    return this.organizationService.deleteFromWebhook(id);
  }
}

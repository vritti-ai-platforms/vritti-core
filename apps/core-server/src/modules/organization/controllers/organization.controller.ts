import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf } from '@vritti/api-sdk';
import { ApiCreateOrganizationWebhook } from '../docs/organization.docs';
import { OrganizationDto } from '../dto/entity/organization.dto';
import { CreateOrganizationWebhookDto } from '../dto/request/create-organization-webhook.dto';
import { WebhookSecretGuard } from '../../../common/guards/webhook-secret.guard';
import { OrganizationService } from '../services/organization.service';

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
}

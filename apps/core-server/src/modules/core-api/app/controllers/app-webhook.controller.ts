import type { AppWebhookEndpointDto } from '@domain/app-webhook/dto/entity/app-webhook-endpoint.dto';
import { UpsertAppWebhookEndpointInternalDto } from '@domain/app-webhook/dto/request/upsert-app-webhook-endpoint-internal.dto';
import type { WebhookDeliveriesPageResponseDto } from '@domain/app-webhook/dto/response/webhook-deliveries-page-response.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require, SkipCsrf } from '@vritti/api-sdk/auth';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OrgId } from '@/security/decorators/org-id.decorator';
import {
  ApiDeleteAppWebhookEndpoint,
  ApiFindForTableWebhookDeliveries,
  ApiGetAppWebhookEndpoint,
  ApiGetWebhookPublicKey,
  ApiRedeliverWebhook,
  ApiSendAppWebhookTest,
  ApiUpsertAppWebhookEndpoint,
} from '../docs/app-webhook.docs';
import { GetWebhookDeliveriesInternalDto } from '../dto/request/get-webhook-deliveries-internal.dto';
import type { WebhookDeliveryRefResponseDto } from '../dto/response/webhook-delivery-ref-response.dto';
import type { WebhookPublicKeyResponseDto } from '../dto/response/webhook-public-key-response.dto';
import { AppWebhookService } from '../services/app-webhook.service';

// The cloud-facing webhook settings of one app — signed cloud auth, scoped by the organization header
@ApiTags('Apps')
@Controller('apps/internal/:appId')
@Require(AuthType.Cloud)
@SkipCsrf()
export class AppWebhookController {
  private readonly logger = new Logger(AppWebhookController.name);

  constructor(private readonly appWebhookService: AppWebhookService) {}

  @Get('webhook-endpoint')
  @ApiGetAppWebhookEndpoint()
  findEndpoint(
    @OrgId() orgId: string,
    @Param('appId', ParseUUIDPipe) appId: string,
  ): Promise<AppWebhookEndpointDto | null> {
    this.logger.log(`GET /apps/internal/${appId}/webhook-endpoint`);
    return this.appWebhookService.findEndpoint(orgId, appId);
  }

  @Put('webhook-endpoint')
  @ApiUpsertAppWebhookEndpoint()
  upsertEndpoint(
    @OrgId() orgId: string,
    @Param('appId', ParseUUIDPipe) appId: string,
    @Body() dto: UpsertAppWebhookEndpointInternalDto,
  ): Promise<AppWebhookEndpointDto> {
    this.logger.log(`PUT /apps/internal/${appId}/webhook-endpoint`);
    return this.appWebhookService.upsertEndpoint(orgId, appId, dto);
  }

  @Delete('webhook-endpoint')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteAppWebhookEndpoint()
  deleteEndpoint(@OrgId() orgId: string, @Param('appId', ParseUUIDPipe) appId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /apps/internal/${appId}/webhook-endpoint`);
    return this.appWebhookService.deleteEndpoint(orgId, appId);
  }

  @Post('webhook-endpoint/test')
  @HttpCode(HttpStatus.OK)
  @ApiSendAppWebhookTest()
  sendTest(
    @OrgId() orgId: string,
    @Param('appId', ParseUUIDPipe) appId: string,
  ): Promise<WebhookDeliveryRefResponseDto> {
    this.logger.log(`POST /apps/internal/${appId}/webhook-endpoint/test`);
    return this.appWebhookService.sendTest(orgId, appId);
  }

  @Get('webhook-deliveries/table')
  @ApiFindForTableWebhookDeliveries()
  findDeliveriesForTable(
    @OrgId() orgId: string,
    @Param('appId', ParseUUIDPipe) appId: string,
    @Query() query: GetWebhookDeliveriesInternalDto,
  ): Promise<WebhookDeliveriesPageResponseDto> {
    this.logger.log(`GET /apps/internal/${appId}/webhook-deliveries/table`);
    return this.appWebhookService.findDeliveriesForTable(orgId, appId, query);
  }

  @Post('webhook-deliveries/:deliveryId/redeliver')
  @HttpCode(HttpStatus.OK)
  @ApiRedeliverWebhook()
  redeliver(
    @OrgId() orgId: string,
    @Param('appId', ParseUUIDPipe) appId: string,
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
  ): Promise<WebhookDeliveryRefResponseDto> {
    this.logger.log(`POST /apps/internal/${appId}/webhook-deliveries/${deliveryId}/redeliver`);
    return this.appWebhookService.redeliver(orgId, appId, deliveryId);
  }

  @Get('webhook-public-key')
  @ApiGetWebhookPublicKey()
  findPublicKey(
    @OrgId() orgId: string,
    @Param('appId', ParseUUIDPipe) appId: string,
  ): Promise<WebhookPublicKeyResponseDto> {
    this.logger.log(`GET /apps/internal/${appId}/webhook-public-key`);
    return this.appWebhookService.findPublicKey(orgId, appId);
  }
}

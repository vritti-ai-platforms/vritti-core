import type { PaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/entity/payment-gateway-config.dto';
import { CreatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-payment-gateway-config.dto';
import { CreatePlatformPaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-platform-payment-gateway-config.dto';
import { UpdatePlatformPaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/update-platform-payment-gateway-config.dto';
import { VerificationPaymentRequestDto } from '@domain/payment-gateway-config/dto/request/verification-payment-request.dto';
import type { PaymentGatewayConfigVerificationResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-config-verification-response.dto';
import type { PaymentGatewayConfigsPageResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-configs-page-response.dto';
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
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { PaymentGatewayOptionDto } from '@/modules/payments-gateway/gateways/dto/response/payment-gateway-option.dto';
import { OrgId } from '@/security/decorators';
import {
  ApiCreatePaymentGatewayConfigInternal,
  ApiCreatePlatformPaymentGatewayConfigInternal,
  ApiDeletePaymentGatewayConfigInternal,
  ApiDeletePlatformPaymentGatewayConfigInternal,
  ApiFindForTablePaymentGatewayConfigsInternal,
  ApiFindForTablePlatformPaymentGatewayConfigsInternal,
  ApiGetPaymentGatewayConfigInternal,
  ApiGetWebhookCheckInternal,
  ApiListPaymentGatewayConfigsInternal,
  ApiListPaymentGatewaysInternal,
  ApiListPlatformPaymentGatewayConfigsInternal,
  ApiStartWebhookCheckInternal,
  ApiUpdatePlatformPaymentGatewayConfigInternal,
  ApiVerifyPaymentGatewayConfigInternal,
  ApiVerifyPlatformPaymentGatewayConfigInternal,
} from './docs/payment-gateway-config-internal.docs';
import { GetPaymentGatewayConfigsInternalDto } from './dto/request/get-payment-gateway-configs-internal.dto';
import type {
  WebhookCheckStartedResponseDto,
  WebhookCheckStatusResponseDto,
} from './dto/response/webhook-check-response.dto';
import { PaymentGatewayConfigService } from './services/payment-gateway-config-api.service';

@ApiTags('Structure - Payment Gateway Configs (internal)')
@Require(AuthType.Cloud)
@Controller('payment-gateway-configs/internal')
export class PaymentGatewayConfigInternalController {
  private readonly logger = new Logger(PaymentGatewayConfigInternalController.name);

  constructor(private readonly paymentGatewayConfigService: PaymentGatewayConfigService) {}

  // The organization's own gateways and Vritti's read-only, for pickers
  @Get()
  @ApiListPaymentGatewayConfigsInternal()
  list(@OrgId() orgId: string): Promise<PaymentGatewayConfigDto[]> {
    this.logger.log(`GET /payment-gateway-configs/internal — org ${orgId}`);
    return this.paymentGatewayConfigService.list();
  }

  // Resolves one table page from the view state cloud holds and sends serialized
  @Get('table')
  @ApiFindForTablePaymentGatewayConfigsInternal()
  findForTable(
    @OrgId() orgId: string,
    @Query() query: GetPaymentGatewayConfigsInternalDto,
  ): Promise<PaymentGatewayConfigsPageResponseDto> {
    this.logger.log(`GET /payment-gateway-configs/internal/table — org ${orgId}`);
    return this.paymentGatewayConfigService.findForTableWithQuery('organization', query);
  }

  // The gateways payments-service can charge through, for the cloud UI to intersect with the catalog
  @Get('gateways')
  @ApiListPaymentGatewaysInternal()
  listGateways(): Promise<PaymentGatewayOptionDto[]> {
    this.logger.log('GET /payment-gateway-configs/internal/gateways');
    return this.paymentGatewayConfigService.listGateways();
  }

  // ---- Platform gateways — Vritti's accounts on this deployment, managed only from cloud admin ----

  // Resolves one page of the platform rows from the view state cloud holds
  @Get('platform/table')
  @ApiFindForTablePlatformPaymentGatewayConfigsInternal()
  findPlatformForTable(
    @Query() query: GetPaymentGatewayConfigsInternalDto,
  ): Promise<PaymentGatewayConfigsPageResponseDto> {
    this.logger.log('GET /payment-gateway-configs/internal/platform/table');
    return this.paymentGatewayConfigService.findForTableWithQuery('platform', query);
  }

  // Lists Vritti's gateways on this deployment
  @Get('platform')
  @ApiListPlatformPaymentGatewayConfigsInternal()
  listPlatform(): Promise<PaymentGatewayConfigDto[]> {
    this.logger.log('GET /payment-gateway-configs/internal/platform');
    return this.paymentGatewayConfigService.listPlatform();
  }

  // Sets up one of Vritti's gateways on this deployment
  @Post('platform')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatePlatformPaymentGatewayConfigInternal()
  createPlatform(
    @Body() dto: CreatePlatformPaymentGatewayConfigDto,
  ): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    this.logger.log(`POST /payment-gateway-configs/internal/platform — ${dto.gatewayCode}`);
    return this.paymentGatewayConfigService.createPlatform(dto);
  }

  // Updates a platform row's credentials or fee
  @Patch('platform/:id')
  @ApiUpdatePlatformPaymentGatewayConfigInternal()
  updatePlatform(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlatformPaymentGatewayConfigDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /payment-gateway-configs/internal/platform/${id}`);
    return this.paymentGatewayConfigService.updatePlatform(id, dto);
  }

  // Has the provider check a platform row's credentials
  @Post('platform/:id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiVerifyPlatformPaymentGatewayConfigInternal()
  verifyPlatform(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentGatewayConfigVerificationResponseDto> {
    this.logger.log(`POST /payment-gateway-configs/internal/platform/${id}/verify`);
    return this.paymentGatewayConfigService.verifyPlatform(id);
  }

  // Removes a platform row
  @Delete('platform/:id')
  @HttpCode(HttpStatus.OK)
  @ApiDeletePlatformPaymentGatewayConfigInternal()
  deletePlatform(@Param('id', ParseUUIDPipe) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /payment-gateway-configs/internal/platform/${id}`);
    return this.paymentGatewayConfigService.deletePlatform(id);
  }

  // ---- The organization's own gateways ----

  // Connects one of the organization's own gateways
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatePaymentGatewayConfigInternal()
  create(
    @OrgId() orgId: string,
    @Body() dto: CreatePaymentGatewayConfigDto,
  ): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    this.logger.log(`POST /payment-gateway-configs/internal — ${dto.gatewayCode} for org ${orgId}`);
    return this.paymentGatewayConfigService.create(orgId, dto);
  }

  // Returns one gateway the organization can see
  @Get(':id')
  @ApiGetPaymentGatewayConfigInternal()
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentGatewayConfigDto> {
    this.logger.log(`GET /payment-gateway-configs/internal/${id}`);
    return this.paymentGatewayConfigService.findById(id);
  }

  // Has the provider check an own gateway's credentials
  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiVerifyPaymentGatewayConfigInternal()
  verify(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentGatewayConfigVerificationResponseDto> {
    this.logger.log(`POST /payment-gateway-configs/internal/${id}/verify`);
    return this.paymentGatewayConfigService.verify(id);
  }

  // Opens the ₹10 verification payment whose signed webhook makes the gateway ACTIVE
  @Post(':id/webhook-check')
  @ApiStartWebhookCheckInternal()
  startWebhookCheck(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerificationPaymentRequestDto,
  ): Promise<WebhookCheckStartedResponseDto> {
    this.logger.log(`POST /payment-gateway-configs/internal/${id}/webhook-check`);
    return this.paymentGatewayConfigService.startWebhookCheck(orgId, id, dto);
  }

  // Where a verification payment stands, for the dialog waiting on its outcome
  @Get(':id/webhook-check/:paymentIntentId')
  @ApiGetWebhookCheckInternal()
  findWebhookCheck(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('paymentIntentId', ParseUUIDPipe) paymentIntentId: string,
  ): Promise<WebhookCheckStatusResponseDto> {
    return this.paymentGatewayConfigService.findWebhookCheck(id, paymentIntentId);
  }

  // Removes one of the organization's own gateways
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeletePaymentGatewayConfigInternal()
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /payment-gateway-configs/internal/${id}`);
    return this.paymentGatewayConfigService.delete(id);
  }
}

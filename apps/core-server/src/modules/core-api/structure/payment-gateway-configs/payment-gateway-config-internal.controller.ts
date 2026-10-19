import type { PaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/entity/payment-gateway-config.dto';
import { CreatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-payment-gateway-config.dto';
import { CreatePlatformPaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-platform-payment-gateway-config.dto';
import { UpdatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/update-payment-gateway-config.dto';
import { UpdatePlatformPaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/update-platform-payment-gateway-config.dto';
import type { PaymentGatewayConfigVerificationResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-config-verification-response.dto';
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
  ApiGetPaymentGatewayConfigInternal,
  ApiListPaymentGatewayConfigsInternal,
  ApiListPaymentGatewaysInternal,
  ApiListPlatformPaymentGatewayConfigsInternal,
  ApiUpdatePaymentGatewayConfigInternal,
  ApiUpdatePlatformPaymentGatewayConfigInternal,
  ApiVerifyPaymentGatewayConfigInternal,
  ApiVerifyPlatformPaymentGatewayConfigInternal,
} from './docs/payment-gateway-config-internal.docs';
import { PaymentGatewayConfigService } from './services/payment-gateway-config-api.service';

// The cloud-facing surface for collectors. The organization routes read the org from the signed x-org-id header;
// the platform routes are called by cloud admin with no org at all, which is what confines them to the PLATFORM rows
@ApiTags('Structure - Payment Gateway Configs (internal)')
@Require(AuthType.Cloud)
@Controller('payment-gateway-configs/internal')
export class PaymentGatewayConfigInternalController {
  private readonly logger = new Logger(PaymentGatewayConfigInternalController.name);

  constructor(private readonly paymentGatewayConfigService: PaymentGatewayConfigService) {}

  // The organization's own gateways, then Vritti's read-only
  @Get()
  @ApiListPaymentGatewayConfigsInternal()
  list(@OrgId() orgId: string): Promise<PaymentGatewayConfigDto[]> {
    this.logger.log(`GET /payment-gateway-configs/internal — org ${orgId}`);
    return this.paymentGatewayConfigService.list(orgId);
  }

  // The gateways payments-service can charge through, for the cloud UI to intersect with the catalog
  @Get('gateways')
  @ApiListPaymentGatewaysInternal()
  listGateways(): Promise<PaymentGatewayOptionDto[]> {
    this.logger.log('GET /payment-gateway-configs/internal/gateways');
    return this.paymentGatewayConfigService.listGateways();
  }

  // ---- Platform gateways — Vritti's accounts on this deployment, managed only from cloud admin ----

  @Get('platform')
  @ApiListPlatformPaymentGatewayConfigsInternal()
  listPlatform(): Promise<PaymentGatewayConfigDto[]> {
    this.logger.log('GET /payment-gateway-configs/internal/platform');
    return this.paymentGatewayConfigService.listPlatform();
  }

  @Post('platform')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatePlatformPaymentGatewayConfigInternal()
  createPlatform(
    @Body() dto: CreatePlatformPaymentGatewayConfigDto,
  ): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    this.logger.log(`POST /payment-gateway-configs/internal/platform — ${dto.gatewayCode}`);
    return this.paymentGatewayConfigService.createPlatform(dto);
  }

  @Patch('platform/:id')
  @ApiUpdatePlatformPaymentGatewayConfigInternal()
  updatePlatform(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlatformPaymentGatewayConfigDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /payment-gateway-configs/internal/platform/${id}`);
    return this.paymentGatewayConfigService.updatePlatform(id, dto);
  }

  @Post('platform/:id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiVerifyPlatformPaymentGatewayConfigInternal()
  verifyPlatform(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentGatewayConfigVerificationResponseDto> {
    this.logger.log(`POST /payment-gateway-configs/internal/platform/${id}/verify`);
    return this.paymentGatewayConfigService.verifyPlatform(id);
  }

  @Delete('platform/:id')
  @HttpCode(HttpStatus.OK)
  @ApiDeletePlatformPaymentGatewayConfigInternal()
  deletePlatform(@Param('id', ParseUUIDPipe) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /payment-gateway-configs/internal/platform/${id}`);
    return this.paymentGatewayConfigService.deletePlatform(id);
  }

  // ---- The organization's own gateways ----

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

  @Get(':id')
  @ApiGetPaymentGatewayConfigInternal()
  findById(@OrgId() orgId: string, @Param('id', ParseUUIDPipe) id: string): Promise<PaymentGatewayConfigDto> {
    this.logger.log(`GET /payment-gateway-configs/internal/${id}`);
    return this.paymentGatewayConfigService.findById(orgId, id);
  }

  @Patch(':id')
  @ApiUpdatePaymentGatewayConfigInternal()
  update(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentGatewayConfigDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /payment-gateway-configs/internal/${id}`);
    return this.paymentGatewayConfigService.update(orgId, id, dto);
  }

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiVerifyPaymentGatewayConfigInternal()
  verify(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaymentGatewayConfigVerificationResponseDto> {
    this.logger.log(`POST /payment-gateway-configs/internal/${id}/verify`);
    return this.paymentGatewayConfigService.verify(orgId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeletePaymentGatewayConfigInternal()
  delete(@OrgId() orgId: string, @Param('id', ParseUUIDPipe) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /payment-gateway-configs/internal/${id}`);
    return this.paymentGatewayConfigService.delete(orgId, id);
  }
}

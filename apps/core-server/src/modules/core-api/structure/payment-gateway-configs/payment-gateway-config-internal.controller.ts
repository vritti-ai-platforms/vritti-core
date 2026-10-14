import type { PaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/entity/payment-gateway-config.dto';
import { CreatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-payment-gateway-config.dto';
import { UpdatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/update-payment-gateway-config.dto';
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
  ApiDeletePaymentGatewayConfigInternal,
  ApiFindForTablePaymentGatewayConfigsInternal,
  ApiGetPaymentGatewayConfigInternal,
  ApiListPaymentGatewayConfigsByBankAccountInternal,
  ApiListPaymentGatewayConfigsInternal,
  ApiListPaymentGatewaysInternal,
  ApiUpdatePaymentGatewayConfigInternal,
  ApiVerifyPaymentGatewayConfigInternal,
} from './docs/payment-gateway-config-internal.docs';
import { GetPaymentGatewayConfigsInternalDto } from './dto/request/get-payment-gateway-configs-internal.dto';
import { PaymentGatewayConfigScopeQueryDto } from './dto/request/payment-gateway-config-scope-query.dto';
import { PaymentGatewayConfigService } from './services/payment-gateway-config-api.service';

// The cloud-facing surface. Signed cloud auth rather than a session, because cloud-server calls this
// on behalf of an operator setting up a legal entity — there is no RBAC context to gate on.
@ApiTags('Structure - Payment Gateway Configs (internal)')
@Require(AuthType.Cloud)
@Controller('payment-gateway-configs/internal')
export class PaymentGatewayConfigInternalController {
  private readonly logger = new Logger(PaymentGatewayConfigInternalController.name);

  constructor(private readonly paymentGatewayConfigService: PaymentGatewayConfigService) {}

  // Resolves one table page from the view state cloud holds and sends serialized
  @Get('table')
  @ApiFindForTablePaymentGatewayConfigsInternal()
  findForTable(
    @OrgId() orgId: string,
    @Query() query: GetPaymentGatewayConfigsInternalDto,
  ): Promise<PaymentGatewayConfigsPageResponseDto> {
    this.logger.log(`GET /payment-gateway-configs/internal/table — org ${orgId}`);
    return this.paymentGatewayConfigService.findForTableWithQuery(orgId, query);
  }

  // The gateways payments-service can charge through, for the cloud UI to intersect with the catalog
  @Get('gateways')
  @ApiListPaymentGatewaysInternal()
  listGateways(): Promise<PaymentGatewayOptionDto[]> {
    this.logger.log('GET /payment-gateway-configs/internal/gateways');
    return this.paymentGatewayConfigService.listGateways();
  }

  // Lists a legal entity's configs
  @Get('legal-entity/:legalEntityId')
  @ApiListPaymentGatewayConfigsInternal()
  list(
    @OrgId() orgId: string,
    @Param('legalEntityId', ParseUUIDPipe) legalEntityId: string,
  ): Promise<PaymentGatewayConfigDto[]> {
    this.logger.log(`GET /payment-gateway-configs/internal/legal-entity/${legalEntityId} — org ${orgId}`);
    return this.paymentGatewayConfigService.listByLegalEntity(orgId, legalEntityId);
  }

  // Lists the configs that settle into one bank account
  @Get('bank-account/:bankAccountId')
  @ApiListPaymentGatewayConfigsByBankAccountInternal()
  listByBankAccount(
    @OrgId() orgId: string,
    @Param('bankAccountId', ParseUUIDPipe) bankAccountId: string,
  ): Promise<PaymentGatewayConfigDto[]> {
    this.logger.log(`GET /payment-gateway-configs/internal/bank-account/${bankAccountId} — org ${orgId}`);
    return this.paymentGatewayConfigService.listByBankAccount(orgId, bankAccountId);
  }

  // Creates a config for a legal entity of the organization
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatePaymentGatewayConfigInternal()
  create(
    @OrgId() orgId: string,
    @Body() dto: CreatePaymentGatewayConfigDto,
  ): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    this.logger.log(
      `POST /payment-gateway-configs/internal — ${dto.gatewayCode} for legal entity ${dto.legalEntityId}`,
    );
    return this.paymentGatewayConfigService.create(orgId, dto);
  }

  // Returns a single config
  @Get(':id')
  @ApiGetPaymentGatewayConfigInternal()
  findById(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() scope: PaymentGatewayConfigScopeQueryDto,
  ): Promise<PaymentGatewayConfigDto> {
    this.logger.log(`GET /payment-gateway-configs/internal/${id}`);
    return this.paymentGatewayConfigService.findById(orgId, id, scope);
  }

  // Updates a config
  @Patch(':id')
  @ApiUpdatePaymentGatewayConfigInternal()
  update(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() scope: PaymentGatewayConfigScopeQueryDto,
    @Body() dto: UpdatePaymentGatewayConfigDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /payment-gateway-configs/internal/${id}`);
    return this.paymentGatewayConfigService.update(orgId, id, dto, scope);
  }

  // Has the provider check a config's stored credentials
  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiVerifyPaymentGatewayConfigInternal()
  verify(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() scope: PaymentGatewayConfigScopeQueryDto,
  ): Promise<PaymentGatewayConfigVerificationResponseDto> {
    this.logger.log(`POST /payment-gateway-configs/internal/${id}/verify`);
    return this.paymentGatewayConfigService.verify(orgId, id, scope);
  }

  // Deletes a config
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeletePaymentGatewayConfigInternal()
  delete(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() scope: PaymentGatewayConfigScopeQueryDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /payment-gateway-configs/internal/${id}`);
    return this.paymentGatewayConfigService.delete(orgId, id, scope);
  }
}

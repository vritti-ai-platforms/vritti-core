import type { PaymentLinkedAccountDto } from '@domain/payment-linked-account/dto/entity/payment-linked-account.dto';
import { RegisterPaymentLinkedAccountDto } from '@domain/payment-linked-account/dto/request/register-payment-linked-account.dto';
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
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OrgId } from '@/security/decorators';
import {
  ApiDeletePaymentLinkedAccountInternal,
  ApiListPaymentLinkedAccountsInternal,
  ApiRefreshPaymentLinkedAccountInternal,
  ApiRegisterPaymentLinkedAccountInternal,
} from './docs/payment-linked-account-internal.docs';
import { ListPaymentLinkedAccountsInternalQueryDto } from './dto/request/list-payment-linked-accounts-internal-query.dto';
import { PaymentLinkedAccountScopeQueryDto } from './dto/request/payment-linked-account-scope-query.dto';
import { PaymentLinkedAccountService } from './services/payment-linked-account-api.service';

// The cloud-facing surface. Signed cloud auth rather than a session, because cloud-server calls this on behalf of
// an operator wiring up split payments — there is no RBAC context to gate on.
@ApiTags('Structure - Payment Linked Accounts (internal)')
@Require(AuthType.Cloud)
@Controller('payment-linked-accounts/internal')
export class PaymentLinkedAccountInternalController {
  private readonly logger = new Logger(PaymentLinkedAccountInternalController.name);

  constructor(private readonly paymentLinkedAccountService: PaymentLinkedAccountService) {}

  // Lists a collector's linked accounts
  @Get()
  @ApiListPaymentLinkedAccountsInternal()
  list(
    @OrgId() orgId: string,
    @Query() query: ListPaymentLinkedAccountsInternalQueryDto,
  ): Promise<PaymentLinkedAccountDto[]> {
    this.logger.log(`GET /payment-linked-accounts/internal — collector ${query.collectorConfigId}`);
    return this.paymentLinkedAccountService.listByCollector(orgId, query.collectorConfigId, {
      legalEntityId: query.legalEntityId,
    });
  }

  // Registers a bank account as a linked account of a collector
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiRegisterPaymentLinkedAccountInternal()
  register(
    @OrgId() orgId: string,
    @Query() scope: PaymentLinkedAccountScopeQueryDto,
    @Body() dto: RegisterPaymentLinkedAccountDto,
  ): Promise<CreateResponseDto<PaymentLinkedAccountDto>> {
    this.logger.log(
      `POST /payment-linked-accounts/internal — bank account ${dto.bankAccountId} on collector ${dto.collectorConfigId}`,
    );
    return this.paymentLinkedAccountService.register(orgId, scope, dto);
  }

  // Refreshes a linked account's status from the gateway
  @Post(':id/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiRefreshPaymentLinkedAccountInternal()
  refresh(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() scope: PaymentLinkedAccountScopeQueryDto,
  ): Promise<CreateResponseDto<PaymentLinkedAccountDto>> {
    this.logger.log(`POST /payment-linked-accounts/internal/${id}/refresh`);
    return this.paymentLinkedAccountService.refresh(orgId, id, scope);
  }

  // Removes a linked account record
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeletePaymentLinkedAccountInternal()
  delete(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() scope: PaymentLinkedAccountScopeQueryDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /payment-linked-accounts/internal/${id}`);
    return this.paymentLinkedAccountService.delete(orgId, id, scope);
  }
}

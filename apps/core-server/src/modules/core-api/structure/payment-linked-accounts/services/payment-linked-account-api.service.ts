import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import type { PaymentLinkedAccountDto } from '@domain/payment-linked-account/dto/entity/payment-linked-account.dto';
import type { RegisterPaymentLinkedAccountDto } from '@domain/payment-linked-account/dto/request/register-payment-linked-account.dto';
import type { PaymentLinkedAccountScope } from '@domain/payment-linked-account/payment-linked-account-scope';
import { PaymentLinkedAccountDomainService } from '@domain/payment-linked-account/services/payment-linked-account.service';
import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import {
  type CreateLinkedAccountResult,
  PaymentLinkedAccountsGatewayService,
} from '@/modules/payments-gateway/linked-accounts/services/payment-linked-accounts-gateway.service';

@Injectable()
export class PaymentLinkedAccountService {
  constructor(
    private readonly linkedAccountService: PaymentLinkedAccountDomainService,
    private readonly gatewayConfigService: PaymentGatewayConfigDomainService,
    private readonly linkedAccountsGatewayService: PaymentLinkedAccountsGatewayService,
  ) {}

  // Lists a collector's linked accounts within the caller's scope
  async listByCollector(
    orgId: string,
    collectorConfigId: string,
    scope: PaymentLinkedAccountScope,
  ): Promise<PaymentLinkedAccountDto[]> {
    return this.linkedAccountService.listByCollector(orgId, collectorConfigId, scope);
  }

  // Reserves a linked account, opens it at the collector's gateway, and records the outcome.
  async register(
    orgId: string,
    scope: PaymentLinkedAccountScope,
    dto: RegisterPaymentLinkedAccountDto,
  ): Promise<CreateResponseDto<PaymentLinkedAccountDto>> {
    const reservation = await this.linkedAccountService.reserve(orgId, scope, dto);

    let result: CreateLinkedAccountResult;
    try {
      const { gatewayCode, credentials } = await this.gatewayConfigService.getDecryptedCredentials(
        orgId,
        reservation.collectorConfigId,
      );
      result = await this.linkedAccountsGatewayService.createLinkedAccount({
        gatewayCode,
        credentials,
        account: {
          referenceId: reservation.id,
          email: dto.email,
          phone: dto.phone,
          legalBusinessName: dto.legalBusinessName,
          businessType: dto.businessType,
          contactName: dto.contactName,
          category: dto.category,
          subcategory: dto.subcategory,
          address: {
            street1: dto.address.street1,
            ...(dto.address.street2 && { street2: dto.address.street2 }),
            city: dto.address.city,
            state: dto.address.state,
            postalCode: dto.address.postalCode,
            country: dto.address.country,
          },
          ...(dto.pan && { pan: dto.pan }),
          ...(dto.gst && { gst: dto.gst }),
          bank: reservation.bank,
        },
        ...(reservation.resume && { resume: reservation.resume }),
      });
    } catch (error) {
      await this.linkedAccountService.markFailed(reservation.id, problemDetail(error));
      throw error;
    }

    // The account exists at the provider but its setup stopped part-way: keep what it created and report the failure.
    if (result.setupError) {
      await this.linkedAccountService.markPartial(reservation.id, result, result.setupError.detail);
      throw new BadRequestException({
        label: result.setupError.label,
        detail: `${result.setupError.detail} The account was created at the gateway; register this bank account again to finish its setup.`,
      });
    }

    const data = await this.linkedAccountService.markRegistered(reservation.id, result);
    return {
      success: true,
      message: `Linked account for "${reservation.bank.beneficiaryName}" registered successfully.`,
      data,
    };
  }

  // Pulls a linked account's activation status from the collector's gateway and records it
  async refresh(
    orgId: string,
    id: string,
    scope: PaymentLinkedAccountScope,
  ): Promise<CreateResponseDto<PaymentLinkedAccountDto>> {
    const account = await this.linkedAccountService.findInScope(orgId, id, scope);
    if (!account.providerAccountId) {
      throw new BadRequestException({
        label: 'Not Registered',
        detail: 'This linked account was never created at the gateway. Remove it and register the bank account again.',
      });
    }

    const { gatewayCode, credentials } = await this.gatewayConfigService.getDecryptedCredentials(
      orgId,
      account.collectorConfigId,
    );
    const { status } = await this.linkedAccountsGatewayService.fetchLinkedAccountStatus({
      gatewayCode,
      credentials,
      providerAccountId: account.providerAccountId,
      providerData: account.providerData,
    });
    const data = await this.linkedAccountService.applyStatus(id, status);
    return {
      success: true,
      message: `Linked account status is ${data.status.toLowerCase().replaceAll('_', ' ')}.`,
      data,
    };
  }

  // Removes the local linked-account record within the caller's scope
  async delete(orgId: string, id: string, scope: PaymentLinkedAccountScope): Promise<SuccessResponseDto> {
    return this.linkedAccountService.delete(orgId, id, scope);
  }
}

// Pulls the RFC 9457 detail out of a NATS rejection or thrown error for storage on the failed row
function problemDetail(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const { detail, message } = error as { detail?: unknown; message?: unknown };
    if (typeof detail === 'string' && detail) return detail;
    if (typeof message === 'string' && message) return message;
  }
  return 'The gateway could not create the linked account.';
}

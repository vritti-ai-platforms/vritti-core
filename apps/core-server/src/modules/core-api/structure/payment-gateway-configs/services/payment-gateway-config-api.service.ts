import type { PaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/entity/payment-gateway-config.dto';
import type { CreatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-payment-gateway-config.dto';
import type { CreatePlatformPaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-platform-payment-gateway-config.dto';
import type { UpdatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/update-payment-gateway-config.dto';
import type { UpdatePlatformPaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/update-platform-payment-gateway-config.dto';
import type { PaymentGatewayConfigVerificationResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-config-verification-response.dto';
import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { PaymentLinkedAccountDomainRepository } from '@domain/payment-linked-account/repositories/payment-linked-account.repository';
import { Injectable } from '@nestjs/common';
import { ConflictException, ForbiddenException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PaymentGatewayConfigKindValues } from '@/db/schema';
import type { PaymentGatewayOptionDto } from '@/modules/payments-gateway/gateways/dto/response/payment-gateway-option.dto';
import { PaymentGatewaysGatewayService } from '@/modules/payments-gateway/gateways/services/payment-gateways-gateway.service';

const PG_FOREIGN_KEY_VIOLATION = '23503';

@Injectable()
export class PaymentGatewayConfigService {
  constructor(
    private readonly gatewayConfigService: PaymentGatewayConfigDomainService,
    private readonly linkedAccountRepository: PaymentLinkedAccountDomainRepository,
    private readonly paymentGatewaysGatewayService: PaymentGatewaysGatewayService,
  ) {}

  // The gateways payments-service can charge through, for the UI to intersect with the catalog
  async listGateways(): Promise<PaymentGatewayOptionDto[]> {
    return this.paymentGatewaysGatewayService.listGateways();
  }

  // ---- The organization's own gateways ----

  async list(orgId: string): Promise<PaymentGatewayConfigDto[]> {
    return this.gatewayConfigService.list(orgId);
  }

  async create(orgId: string, dto: CreatePaymentGatewayConfigDto): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    return this.gatewayConfigService.create(orgId, dto);
  }

  async findById(orgId: string, id: string): Promise<PaymentGatewayConfigDto> {
    return this.gatewayConfigService.findById(orgId, id);
  }

  // A change of gateway is refused while linked accounts were registered under the old one, since their provider
  // ids only exist at that gateway
  async update(orgId: string, id: string, dto: UpdatePaymentGatewayConfigDto): Promise<SuccessResponseDto> {
    const existing = await this.requireOwn(orgId, id);
    if (dto.gatewayCode !== undefined && dto.gatewayCode !== existing.gatewayCode) {
      await this.assertNoLinkedAccounts(id);
    }
    return this.gatewayConfigService.update(orgId, id, dto);
  }

  async delete(orgId: string, id: string): Promise<SuccessResponseDto> {
    await this.requireOwn(orgId, id);
    await this.assertNoLinkedAccounts(id);
    return this.deleteGuarded(orgId, id);
  }

  async verify(orgId: string, id: string): Promise<PaymentGatewayConfigVerificationResponseDto> {
    await this.requireOwn(orgId, id);
    return this.paymentGatewaysGatewayService.verifyConfig(orgId, id);
  }

  // ---- Platform gateways — Vritti's accounts on this deployment. Called with no organization scope ----

  async listPlatform(): Promise<PaymentGatewayConfigDto[]> {
    return this.gatewayConfigService.listPlatform();
  }

  async createPlatform(
    dto: CreatePlatformPaymentGatewayConfigDto,
  ): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    return this.gatewayConfigService.createPlatform(dto);
  }

  // Linked accounts under a platform row belong to organizations and are invisible without an org context, so a
  // change of gateway is refused outright
  async updatePlatform(id: string, dto: UpdatePlatformPaymentGatewayConfigDto): Promise<SuccessResponseDto> {
    const existing = await this.gatewayConfigService.findById(null, id);
    if (dto.gatewayCode !== undefined && dto.gatewayCode !== existing.gatewayCode) {
      throw new ConflictException({
        label: 'Gateway Cannot Change',
        detail:
          'Payout accounts registered under this gateway only exist at that gateway. Remove this row and set up a new one to switch.',
        errors: [{ field: 'gatewayCode', message: 'Cannot change once set up' }],
      });
    }
    return this.gatewayConfigService.updatePlatform(id, dto);
  }

  async verifyPlatform(id: string): Promise<PaymentGatewayConfigVerificationResponseDto> {
    await this.gatewayConfigService.findById(null, id);
    return this.paymentGatewaysGatewayService.verifyConfig(null, id);
  }

  // The database refuses while any organization's linked accounts reference the row
  async deletePlatform(id: string): Promise<SuccessResponseDto> {
    return this.deleteGuarded(null, id);
  }

  // Loads a row the organization may act on: its own, never one of Vritti's. The domain service guards the same
  // way; checking here keeps a forbidden verify from reaching the provider first
  private async requireOwn(orgId: string, id: string): Promise<PaymentGatewayConfigDto> {
    const config = await this.gatewayConfigService.findById(orgId, id);
    if (config.kind !== PaymentGatewayConfigKindValues.ORG) {
      throw new ForbiddenException({
        label: 'Managed By Vritti',
        detail: "Vritti's gateways cannot be changed, verified or removed from here.",
      });
    }
    return config;
  }

  // Linked accounts are registered at the gateway behind a config; removing or re-pointing the config would orphan them
  private async assertNoLinkedAccounts(id: string): Promise<void> {
    const count = await this.linkedAccountRepository.countByCollector(id);
    if (count === 0) return;
    throw gatewayInUse(count);
  }

  // Deletes, turning the foreign-key refusal into the same 409 — the backstop for linked accounts the caller cannot
  // see, which is every organization's under a platform row
  private async deleteGuarded(scope: string | null, id: string): Promise<SuccessResponseDto> {
    try {
      return await this.gatewayConfigService.delete(scope, id);
    } catch (error: unknown) {
      if (isForeignKeyViolation(error)) throw gatewayInUse();
      throw error;
    }
  }
}

function gatewayInUse(count?: number): ConflictException {
  return new ConflictException({
    label: 'Gateway In Use',
    detail:
      count === undefined
        ? 'Linked accounts are registered under this gateway. Remove them first.'
        : `${pluralize('linked account', count, true)} ${count === 1 ? 'is' : 'are'} registered under this gateway. Remove them first.`,
  });
}

// True for a Postgres foreign-key violation, however deep the driver wrapped it
function isForeignKeyViolation(error: unknown, depth = 0): boolean {
  if (!error || typeof error !== 'object' || depth > 5) return false;
  const candidate = error as { code?: unknown; cause?: unknown };
  if (candidate.code === PG_FOREIGN_KEY_VIOLATION) return true;
  return isForeignKeyViolation(candidate.cause, depth + 1);
}

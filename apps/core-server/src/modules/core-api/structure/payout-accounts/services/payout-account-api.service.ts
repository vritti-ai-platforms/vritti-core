import { BankAccountDomainRepository } from '@domain/bank-account/repositories/bank-account.repository';
import type { PaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/entity/payment-gateway-config.dto';
import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import type { PayoutAccountDto } from '@domain/payout-account/dto/entity/payout-account.dto';
import type { CreatePayoutAccountDto } from '@domain/payout-account/dto/request/create-payout-account.dto';
import type { UpdatePayoutAccountDto } from '@domain/payout-account/dto/request/update-payout-account.dto';
import { PayoutAccountDomainService } from '@domain/payout-account/services/payout-account.service';
import { PayoutChannelDomainService } from '@domain/payout-channel/services/payout-channel.service';
import { Injectable } from '@nestjs/common';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PaymentGatewayConfigKindValues } from '@/db/schema';
import { PaymentGatewaysGatewayService } from '@/modules/payments-gateway/gateways/services/payment-gateways-gateway.service';

const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

// Payout accounts of a bank account: one per gateway account. Checks the bank account and gateway, and compares the
// entered id with the gateway's main account to decide whether a payment's share stays there or is transferred out
@Injectable()
export class PayoutAccountService {
  constructor(
    private readonly payoutAccountService: PayoutAccountDomainService,
    private readonly payoutChannelService: PayoutChannelDomainService,
    private readonly gatewayConfigService: PaymentGatewayConfigDomainService,
    private readonly paymentGatewaysGatewayService: PaymentGatewaysGatewayService,
    private readonly bankAccountRepository: BankAccountDomainRepository,
  ) {}

  // A bank account's payout accounts, or every one of a legal entity for the payout channel picker
  async list(orgId: string, filter: { bankAccountId?: string; legalEntityId?: string }): Promise<PayoutAccountDto[]> {
    if (filter.bankAccountId) {
      await this.requireBankAccount(orgId, filter.bankAccountId);
      return this.payoutAccountService.listForBankAccount(orgId, filter.bankAccountId);
    }
    if (filter.legalEntityId) return this.payoutAccountService.listForLegalEntity(orgId, filter.legalEntityId);
    throw new BadRequestException({
      label: 'Filter Required',
      detail: 'List payout accounts of a bank account or of a legal entity.',
      errors: [{ field: 'bankAccountId', message: 'Send bankAccountId or legalEntityId' }],
    });
  }

  async create(orgId: string, dto: CreatePayoutAccountDto): Promise<CreateResponseDto<PayoutAccountDto>> {
    const bankAccount = await this.requireBankAccount(orgId, dto.bankAccountId);
    const config = await this.requireGatewayConfig(orgId, dto.paymentGatewayConfigId);
    const isMainAccount = await this.classifyAccount(config, dto.gatewayAccountId);

    try {
      return await this.payoutAccountService.create(orgId, bankAccount.legalEntityId, dto, isMainAccount);
    } catch (error: unknown) {
      if (hasPgCode(error, PG_UNIQUE_VIOLATION)) throw gatewayAccountInUse();
      throw error;
    }
  }

  // A new gateway account id is classified again against the gateway's main account
  async update(orgId: string, id: string, dto: UpdatePayoutAccountDto): Promise<SuccessResponseDto> {
    const existing = await this.payoutAccountService.requireById(orgId, id);
    let isMainAccount: boolean | undefined;
    if (dto.gatewayAccountId !== undefined && dto.gatewayAccountId !== existing.gatewayAccountId) {
      const config = await this.gatewayConfigService.findById(orgId, existing.paymentGatewayConfigId);
      isMainAccount = await this.classifyAccount(config, dto.gatewayAccountId);
    }
    try {
      return await this.payoutAccountService.update(orgId, id, dto, isMainAccount);
    } catch (error: unknown) {
      if (hasPgCode(error, PG_UNIQUE_VIOLATION)) throw gatewayAccountInUse();
      throw error;
    }
  }

  // Refused while payout channels use the account; the foreign key backs the check
  async delete(orgId: string, id: string): Promise<SuccessResponseDto> {
    await this.payoutAccountService.requireById(orgId, id);
    const inUse = await this.payoutChannelService.countForPayoutAccount(id);
    if (inUse > 0) throw payoutAccountInUse(inUse);
    try {
      return await this.payoutAccountService.delete(orgId, id);
    } catch (error: unknown) {
      if (hasPgCode(error, PG_FOREIGN_KEY_VIOLATION)) throw payoutAccountInUse();
      throw error;
    }
  }

  // Whether the entered account is the gateway's main account — the share then stays there — or a linked account
  // the share is transferred to. A gateway that cannot split only pays into its main account, and Vritti's main
  // account is never an organization's payout account
  private async classifyAccount(config: PaymentGatewayConfigDto, gatewayAccountId: string): Promise<boolean> {
    const isMainAccount = gatewayAccountId === config.gatewayAccountId;

    if (!isMainAccount && !(await this.paymentGatewaysGatewayService.supportsSplit(config.gatewayCode))) {
      throw new BadRequestException({
        label: 'Split Not Supported',
        detail: `"${config.label}" cannot split payments, so it only pays into its main account ${config.gatewayAccountId}.`,
        errors: [{ field: 'gatewayAccountId', message: `Must be ${config.gatewayAccountId}` }],
      });
    }
    if (isMainAccount && config.kind === PaymentGatewayConfigKindValues.PLATFORM) {
      throw new BadRequestException({
        label: "Vritti's Main Account",
        detail:
          "This is Vritti's own account, so payments would stay with Vritti. Enter the linked account (acc_…) created for this legal entity under Vritti's Route.",
        errors: [{ field: 'gatewayAccountId', message: "Enter the legal entity's linked account" }],
      });
    }
    return isMainAccount;
  }

  // Hides a bank account of another organization behind the same 404 as a missing one
  private async requireBankAccount(orgId: string, bankAccountId: string) {
    const bankAccount = await this.bankAccountRepository.findById(bankAccountId);
    if (!bankAccount || bankAccount.organizationId !== orgId) throw new NotFoundException('Bank account not found.');
    return bankAccount;
  }

  // The gateway must be the organization's own or one of Vritti's; the domain answers 404 for anything else
  private async requireGatewayConfig(orgId: string, configId: string): Promise<PaymentGatewayConfigDto> {
    try {
      return await this.gatewayConfigService.findById(orgId, configId);
    } catch (error: unknown) {
      if (!(error instanceof NotFoundException)) throw error;
      throw new BadRequestException({
        label: 'Invalid Payment Gateway',
        detail: 'The payment gateway does not exist or is not available to this organization.',
        errors: [{ field: 'paymentGatewayConfigId', message: 'Unknown payment gateway' }],
      });
    }
  }
}

function gatewayAccountInUse(): ConflictException {
  return new ConflictException({
    label: 'Gateway Account In Use',
    detail: 'This gateway account is already a payout account. Use that one in the payout channels instead.',
    errors: [{ field: 'gatewayAccountId', message: 'Already a payout account' }],
  });
}

function payoutAccountInUse(count?: number): ConflictException {
  return new ConflictException({
    label: 'Payout Account In Use',
    detail:
      count === undefined
        ? 'Payout channels use this payout account. Remove or change them first.'
        : `${pluralize('payout channel', count, true)} ${count === 1 ? 'uses' : 'use'} this payout account. Remove or change ${count === 1 ? 'it' : 'them'} first.`,
  });
}

// True for a Postgres error with the given code, however deep the driver wrapped it
function hasPgCode(error: unknown, code: string, depth = 0): boolean {
  if (!error || typeof error !== 'object' || depth > 5) return false;
  const candidate = error as { code?: unknown; cause?: unknown };
  if (candidate.code === code) return true;
  return hasPgCode(candidate.cause, code, depth + 1);
}

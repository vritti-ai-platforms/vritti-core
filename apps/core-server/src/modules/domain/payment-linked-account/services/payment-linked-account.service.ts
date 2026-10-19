import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import {
  type PaymentLinkedAccount,
  type PaymentLinkedAccountStatus,
  PaymentLinkedAccountStatusValues,
} from '@/db/schema';
import { PaymentLinkedAccountDto } from '../dto/entity/payment-linked-account.dto';
import type { RegisterPaymentLinkedAccountDto } from '../dto/request/register-payment-linked-account.dto';
import type { PaymentLinkedAccountScope } from '../payment-linked-account-scope';
import {
  PaymentLinkedAccountDomainRepository,
  type PaymentLinkedAccountWithScope,
} from '../repositories/payment-linked-account.repository';

export interface PaymentLinkedAccountReservation {
  id: string;
  collectorConfigId: string;
  bank: { accountNumber: string; ifscCode: string; beneficiaryName: string };
  resume: { providerAccountId: string; providerData: Record<string, string> } | null;
}

export interface PaymentLinkedAccountProviderResult {
  providerAccountId: string;
  providerData: Record<string, string>;
  status: PaymentLinkedAccountStatus;
  transfersAllowedAt: string | null;
}

@Injectable()
export class PaymentLinkedAccountDomainService {
  private readonly logger = new Logger(PaymentLinkedAccountDomainService.name);

  constructor(
    private readonly linkedAccountRepository: PaymentLinkedAccountDomainRepository,
    private readonly gatewayConfigService: PaymentGatewayConfigDomainService,
  ) {}

  // Lists a collector's linked accounts, provided the collector belongs to the organization
  async listByCollector(
    orgId: string,
    collectorConfigId: string,
    _scope: PaymentLinkedAccountScope,
  ): Promise<PaymentLinkedAccountDto[]> {
    await this.gatewayConfigService.findById(orgId, collectorConfigId);
    const rows = await this.linkedAccountRepository.findByCollector(orgId, collectorConfigId);
    return rows.map(toDto);
  }

  // Validates a registration and records it as PENDING, returning what the provider call needs.
  async reserve(
    orgId: string,
    _scope: PaymentLinkedAccountScope,
    dto: Pick<RegisterPaymentLinkedAccountDto, 'collectorConfigId' | 'bankAccountId'>,
  ): Promise<PaymentLinkedAccountReservation> {
    await this.gatewayConfigService.findById(orgId, dto.collectorConfigId);

    const bankAccount = await this.linkedAccountRepository.findBankAccountInOrg(orgId, dto.bankAccountId);
    if (!bankAccount) {
      throw new BadRequestException({
        label: 'Invalid Bank Account',
        detail: 'The bank account does not exist in this organization.',
        errors: [{ field: 'bankAccountId', message: 'Unknown bank account' }],
      });
    }

    const bank = {
      accountNumber: bankAccount.accountNumber,
      ifscCode: bankAccount.ifscCode,
      beneficiaryName: bankAccount.accountHolderName.trim(),
    };
    assertBankAcceptedByGateway(bank);

    const existing = await this.linkedAccountRepository.findByCollectorAndBankAccount(
      dto.collectorConfigId,
      dto.bankAccountId,
    );

    if (existing?.status === PaymentLinkedAccountStatusValues.FAILED && existing.providerAccountId) {
      await this.linkedAccountRepository.update(existing.id, {
        status: PaymentLinkedAccountStatusValues.PENDING,
        lastError: null,
      });
      this.logger.log(`Resuming linked account ${existing.id} at the provider as ${existing.providerAccountId}`);
      return {
        id: existing.id,
        collectorConfigId: existing.collectorConfigId,
        bank,
        resume: { providerAccountId: existing.providerAccountId, providerData: existing.providerData },
      };
    }
    if (existing?.status === PaymentLinkedAccountStatusValues.FAILED) {
      await this.linkedAccountRepository.update(existing.id, {
        status: PaymentLinkedAccountStatusValues.PENDING,
        lastError: null,
      });
      this.logger.log(`Retrying failed linked account ${existing.id} under the same reference`);
      return { id: existing.id, collectorConfigId: existing.collectorConfigId, bank, resume: null };
    }
    if (existing) throw alreadyRegistered();

    let row: PaymentLinkedAccount;
    try {
      row = await this.linkedAccountRepository.create({
        organizationId: orgId,
        collectorConfigId: dto.collectorConfigId,
        bankAccountId: dto.bankAccountId,
        status: PaymentLinkedAccountStatusValues.PENDING,
      });
    } catch (error: unknown) {
      // Two registrations of the same pair raced past the lookup above; the unique pair lets only one insert win
      if (isUniqueViolation(error)) throw alreadyRegistered();
      throw error;
    }

    this.logger.log(
      `Reserved linked account ${row.id} for bank account ${dto.bankAccountId} on collector ${dto.collectorConfigId}`,
    );
    return { id: row.id, collectorConfigId: row.collectorConfigId, bank, resume: null };
  }

  // Records the provider's id, opaque references and status of a created linked account, and when transfers open
  async markRegistered(id: string, result: PaymentLinkedAccountProviderResult): Promise<PaymentLinkedAccountDto> {
    await this.linkedAccountRepository.update(id, {
      providerAccountId: result.providerAccountId,
      providerData: result.providerData,
      status: result.status,
      transfersAllowedAt: result.transfersAllowedAt ? new Date(result.transfersAllowedAt) : new Date(),
      lastError: null,
    });

    this.logger.log(`Registered linked account ${id} as ${result.providerAccountId} (${result.status})`);
    return this.loadDto(id);
  }

  // Records a setup the provider only partly completed: the account and references it did create are kept, so
  // registering the same bank account again resumes from the failed step instead of opening a second account
  async markPartial(
    id: string,
    result: Pick<PaymentLinkedAccountProviderResult, 'providerAccountId' | 'providerData'>,
    lastError: string,
  ): Promise<void> {
    await this.linkedAccountRepository.update(id, {
      providerAccountId: result.providerAccountId,
      providerData: result.providerData,
      status: PaymentLinkedAccountStatusValues.FAILED,
      lastError,
    });
    this.logger.warn(`Linked account ${id} is partly set up as ${result.providerAccountId}: ${lastError}`);
  }

  // Records a failed provider registration so it can be retried
  async markFailed(id: string, lastError: string): Promise<void> {
    await this.linkedAccountRepository.update(id, { status: PaymentLinkedAccountStatusValues.FAILED, lastError });
    this.logger.warn(`Linked account ${id} failed to register: ${lastError}`);
  }

  // Returns a linked account row for a provider call, provided its collector sits in the caller's scope
  async findInScope(orgId: string, id: string, scope: PaymentLinkedAccountScope): Promise<PaymentLinkedAccount> {
    return (await this.requireInScope(orgId, id, scope)).account;
  }

  // Records the provider's latest status for a linked account and clears the last error
  async applyStatus(id: string, status: PaymentLinkedAccountStatus): Promise<PaymentLinkedAccountDto> {
    await this.linkedAccountRepository.update(id, { status, lastError: null });

    this.logger.log(`Refreshed linked account ${id} status to ${status}`);
    return this.loadDto(id);
  }

  // Deletes the local linked-account record; the provider account itself is left in place
  async delete(orgId: string, id: string, scope: PaymentLinkedAccountScope): Promise<SuccessResponseDto> {
    await this.requireInScope(orgId, id, scope);
    await this.linkedAccountRepository.delete(id);

    this.logger.log(`Deleted linked account ${id}`);
    return { success: true, message: 'Linked account removed successfully.' };
  }

  // Finds the linked account a collector can split a payment to for a bank account, once activated and past the cooling
  // period
  async findActivatedForBankAccount(
    orgId: string,
    collectorConfigId: string,
    bankAccountId: string,
  ): Promise<PaymentLinkedAccount | null> {
    const row = await this.linkedAccountRepository.findTransferable(
      orgId,
      collectorConfigId,
      bankAccountId,
      new Date(),
    );
    return row ?? null;
  }

  // Loads a linked account as a DTO after a write
  private async loadDto(id: string): Promise<PaymentLinkedAccountDto> {
    const row = await this.linkedAccountRepository.findWithScopeById(id);
    if (!row) throw new NotFoundException('Linked account not found.');
    return toDto(row);
  }

  // Loads a linked account, hiding rows outside the organization behind a 404. Collectors are org-level now, so
  // the caller's legal entity no longer narrows what it may see
  private async requireInScope(
    orgId: string,
    id: string,
    _scope: PaymentLinkedAccountScope,
  ): Promise<PaymentLinkedAccountWithScope> {
    const row = await this.linkedAccountRepository.findWithScopeById(id);
    if (!row || row.account.organizationId !== orgId) {
      throw new NotFoundException('Linked account not found.');
    }
    return row;
  }
}

function alreadyRegistered(): ConflictException {
  return new ConflictException({
    label: 'Already Registered',
    detail: 'This bank account is already linked to the gateway config. Refresh or remove that linked account instead.',
    errors: [{ field: 'bankAccountId', message: 'Already linked' }],
  });
}

// Refuses a bank account payments-service would reject as a linked account's settlement account
function assertBankAcceptedByGateway(bank: PaymentLinkedAccountReservation['bank']): void {
  const problems: string[] = [];
  if (!/^\d{6,20}$/.test(bank.accountNumber)) problems.push('its account number must be 6 to 20 digits');
  if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(bank.ifscCode)) problems.push('its IFSC code is not valid');
  if (bank.beneficiaryName.length === 0 || bank.beneficiaryName.length > 120) {
    problems.push('its account holder name must be 1 to 120 characters');
  }
  if (problems.length === 0) return;
  throw new BadRequestException({
    label: 'Bank Account Not Supported',
    detail: `This bank account cannot settle split payments: ${problems.join(', ')}. Update the bank account and try again.`,
    errors: [{ field: 'bankAccountId', message: 'Not accepted by the payment gateway' }],
  });
}

// True for a Postgres unique violation, however deep the driver wrapped it
function isUniqueViolation(error: unknown, depth = 0): boolean {
  if (!error || typeof error !== 'object' || depth > 5) return false;
  const candidate = error as { code?: unknown; cause?: unknown };
  if (candidate.code === '23505') return true;
  return isUniqueViolation(candidate.cause, depth + 1);
}

// Maps a joined row to its DTO
function toDto(row: PaymentLinkedAccountWithScope): PaymentLinkedAccountDto {
  return PaymentLinkedAccountDto.from(row.account, row.recipientLegalEntityId);
}

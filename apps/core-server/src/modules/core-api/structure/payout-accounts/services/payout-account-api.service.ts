import { BankAccountDomainRepository } from '@domain/bank-account/repositories/bank-account.repository';
import type { PaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/entity/payment-gateway-config.dto';
import { looksUpPayoutAccount } from '@domain/payment-gateway-config/gateway-credential-fields';
import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import type { PayoutAccountDto } from '@domain/payout-account/dto/entity/payout-account.dto';
import type { CreatePayoutAccountDto } from '@domain/payout-account/dto/request/create-payout-account.dto';
import type { UpdatePayoutAccountDto } from '@domain/payout-account/dto/request/update-payout-account.dto';
import type { PayoutAccountsPageResponseDto } from '@domain/payout-account/dto/response/payout-accounts-page-response.dto';
import { PayoutAccountDomainService } from '@domain/payout-account/services/payout-account.service';
import { Injectable } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PaymentGatewayConfigKindValues } from '@/db/schema';
import { PaymentGatewaysGatewayService } from '@/modules/payments-gateway/gateways/services/payment-gateways-gateway.service';
import { parseTableQueryParam } from '@/utils/parse-table-query';
import type { GetPayoutAccountsInternalDto } from '../dto/request/get-payout-accounts-internal.dto';

@Injectable()
export class PayoutAccountService {
  constructor(
    private readonly payoutAccountService: PayoutAccountDomainService,
    private readonly gatewayConfigService: PaymentGatewayConfigDomainService,
    private readonly paymentGatewaysGatewayService: PaymentGatewaysGatewayService,
    private readonly bankAccountRepository: BankAccountDomainRepository,
  ) {}

  // Lists every payout account of a legal entity for the payout channel picker
  async list(legalEntityId: string): Promise<PayoutAccountDto[]> {
    return this.payoutAccountService.listForLegalEntity(legalEntityId);
  }

  // Resolves a table page from the view state cloud serializes, with the bank account pinned as a filter
  async findForTableWithQuery(query: GetPayoutAccountsInternalDto): Promise<PayoutAccountsPageResponseDto> {
    return this.payoutAccountService.findForTable({
      filters: parseTableQueryParam<TableViewState['filters']>(query.filters, 'filters', []),
      search: parseTableQueryParam<TableViewState['search'] | null>(query.search, 'search', null),
      sort: parseTableQueryParam<TableViewState['sort']>(query.sort, 'sort', []),
      pagination: { limit: query.limit ?? 20, offset: query.offset ?? 0 },
    } as TableViewState);
  }

  // Adds a payout account to a bank account after checking the bank and gateway and classifying the account. A gateway
  // that cannot look an account up (Easebuzz) stores it as entered; a wrong one fails when a payment is split to it
  async create(orgId: string, dto: CreatePayoutAccountDto): Promise<CreateResponseDto<PayoutAccountDto>> {
    const bankAccount = await this.requireBankAccount(dto.bankAccountId);
    const config = await this.requireGatewayConfig(dto.paymentGatewayConfigId);
    const isMainAccount = await this.classifyAccount(config, dto.gatewayAccountId);
    if (!isMainAccount && looksUpPayoutAccount(config.gatewayCode)) {
      await this.assertLinkedAccount(config, dto.gatewayAccountId);
    }
    return this.payoutAccountService.create(
      orgId,
      { legalEntityId: bankAccount.legalEntityId, gatewayCode: config.gatewayCode },
      dto,
      isMainAccount,
    );
  }

  // Changes the gateway account id, classifying a new one again against the gateway's main account
  async update(id: string, dto: UpdatePayoutAccountDto): Promise<SuccessResponseDto> {
    const existing = await this.payoutAccountService.requireById(id);
    let isMainAccount: boolean | undefined;
    if (dto.gatewayAccountId !== undefined && dto.gatewayAccountId !== existing.gatewayAccountId) {
      const config = await this.gatewayConfigService.findById('organization', existing.paymentGatewayConfigId);
      isMainAccount = await this.classifyAccount(config, dto.gatewayAccountId);
      if (!isMainAccount && looksUpPayoutAccount(config.gatewayCode)) {
        await this.assertLinkedAccount(config, dto.gatewayAccountId);
      }
    }
    return this.payoutAccountService.update(existing, dto, isMainAccount);
  }

  // Removes a payout account; the guard read carries how many payout channels still use it
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.payoutAccountService.requireById(id);
    return this.payoutAccountService.delete(existing);
  }

  // Decides whether the share stays in the gateway's main account or is transferred to a linked one
  private async classifyAccount(config: PaymentGatewayConfigDto, gatewayAccountId: string): Promise<boolean> {
    const isMainAccount = gatewayAccountId === config.gatewayAccountId;

    if (!isMainAccount && !(await this.paymentGatewaysGatewayService.supportsSplit(config.gatewayCode))) {
      throw new BadRequestException({
        label: 'Split Not Supported',
        detail: `${config.gatewayCode} cannot split payments, so it only pays into its main account ${config.gatewayAccountId}.`,
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

  // Refuses a linked account the gateway does not know under the config's keys, or one it has suspended
  private async assertLinkedAccount(config: PaymentGatewayConfigDto, gatewayAccountId: string): Promise<void> {
    const account = await this.paymentGatewaysGatewayService.lookupLinkedAccount(config.id, gatewayAccountId);
    const gateway = config.gatewayCode;
    if (!account) {
      throw new BadRequestException({
        label: 'Linked Account Not Found',
        detail: `${gateway} has no linked account ${gatewayAccountId} under this gateway's keys. Check the id in the ${gateway} dashboard.`,
        errors: [{ field: 'gatewayAccountId', message: `Not found at ${gateway}` }],
      });
    }
    if (account.status === 'SUSPENDED') {
      throw new BadRequestException({
        label: 'Linked Account Suspended',
        detail: `${gateway} has suspended or blocked ${gatewayAccountId}, so payments cannot be split to it.`,
        errors: [{ field: 'gatewayAccountId', message: `Suspended at ${gateway}` }],
      });
    }
    // The gateway holds the account back until the merchant fixes something on it — for Cashfree a vendor whose bank
    // details failed validation. A share split to it would stay in the main account, so it is refused until fixed
    if (account.status === 'ACTION_REQUIRED') {
      throw new BadRequestException({
        label: 'Linked Account Needs Action',
        detail: `${gateway} cannot pay ${gatewayAccountId} until its details are fixed, for example bank details that failed validation. Fix it in the ${gateway} dashboard, then save again.`,
        errors: [{ field: 'gatewayAccountId', message: `Needs action at ${gateway}` }],
      });
    }
  }

  // Loads the bank account; RLS hides another organization's, so it reads the same as a missing one
  private async requireBankAccount(bankAccountId: string) {
    const bankAccount = await this.bankAccountRepository.findById(bankAccountId);
    if (!bankAccount) throw new NotFoundException('Bank account not found.');
    return bankAccount;
  }

  // Loads the gateway as a field error, since an unknown one is a bad reference rather than a missing page
  private async requireGatewayConfig(configId: string): Promise<PaymentGatewayConfigDto> {
    try {
      return await this.gatewayConfigService.findById('organization', configId);
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

import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type PayoutAccount, paymentGatewayConfigs, payoutAccounts } from '@/db/schema';
import { PayoutAccountDto } from '../dto/entity/payout-account.dto';
import type { CreatePayoutAccountDto } from '../dto/request/create-payout-account.dto';
import type { UpdatePayoutAccountDto } from '../dto/request/update-payout-account.dto';
import type { PayoutAccountsPageResponseDto } from '../dto/response/payout-accounts-page-response.dto';
import { type PayoutAccountDetail, PayoutAccountDomainRepository } from '../repositories/payout-account.repository';

@Injectable()
export class PayoutAccountDomainService {
  private readonly logger = new Logger(PayoutAccountDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    bankAccountId: { column: payoutAccounts.bankAccountId, type: 'string' },
    legalEntityId: { column: payoutAccounts.legalEntityId, type: 'string' },
    gatewayAccountId: { column: payoutAccounts.gatewayAccountId, type: 'string' },
    isMainAccount: { column: payoutAccounts.isMainAccount, type: 'boolean' },
    gatewayCode: { column: payoutAccounts.gatewayCode, type: 'string' },
    kind: { column: paymentGatewayConfigs.kind, type: 'string' },
    createdAt: { column: payoutAccounts.createdAt, type: 'string' },
  };

  constructor(private readonly payoutAccountRepository: PayoutAccountDomainRepository) {}

  // Lists every payout account of a legal entity for the payout channel picker
  async listForLegalEntity(legalEntityId: string): Promise<PayoutAccountDto[]> {
    const rows = await this.payoutAccountRepository.findByLegalEntity(legalEntityId);
    return rows.map((row) => PayoutAccountDto.from(row));
  }

  // Returns a page of payout accounts for the data table; the caller pins it to its bank account with a filter
  async findForTable(state: TableViewState): Promise<PayoutAccountsPageResponseDto> {
    const { filters, search, sort, pagination } = state;
    const fieldMap = PayoutAccountDomainService.FIELD_MAP;
    const { result, count } = await this.payoutAccountRepository.findForTable({
      where: and(FilterProcessor.buildWhere(filters, fieldMap), FilterProcessor.buildSearch(search, fieldMap)),
      orderBy: FilterProcessor.buildOrderBy(sort, fieldMap),
      limit: pagination.limit,
      offset: pagination.offset,
    });

    this.logger.log(`Fetched payout accounts table (${count} results)`);
    return { result: result.map((row) => PayoutAccountDto.from(row)), count };
  }

  // Loads the one row a write guards on; RLS hides other organizations' rows, so a miss is a 404
  async requireById(id: string): Promise<PayoutAccountDetail> {
    const row = await this.payoutAccountRepository.findDetailById(id);
    if (!row) throw new NotFoundException('Payout account not found.');
    return row;
  }

  // Stores a checked payout account of the bank account's legal entity, with its config's gateway code
  async create(
    orgId: string,
    target: { legalEntityId: string; gatewayCode: string },
    dto: CreatePayoutAccountDto,
    isMainAccount: boolean,
  ): Promise<CreateResponseDto<PayoutAccountDto>> {
    const candidate = {
      bankAccountId: dto.bankAccountId,
      paymentGatewayConfigId: dto.paymentGatewayConfigId,
      gatewayCode: target.gatewayCode,
      gatewayAccountId: dto.gatewayAccountId,
    };
    await this.assertNoConflicts(candidate);
    const created = await this.payoutAccountRepository.create({
      organizationId: orgId,
      legalEntityId: target.legalEntityId,
      ...candidate,
      isMainAccount,
    });
    const row = await this.requireById(created.id);

    this.logger.log(`Created payout account ${row.id} on bank account ${row.bankAccountId}`);
    return { success: true, message: 'Payout account added successfully.', data: PayoutAccountDto.from(row) };
  }

  // Changes the guarded row's gateway account id, with the main-account flag the caller worked out again
  async update(
    existing: PayoutAccountDetail,
    dto: UpdatePayoutAccountDto,
    isMainAccount?: boolean,
  ): Promise<SuccessResponseDto> {
    if (dto.gatewayAccountId !== undefined) {
      await this.assertNoConflicts({ ...existing, gatewayAccountId: dto.gatewayAccountId }, existing.id);
    }
    await this.payoutAccountRepository.update(existing.id, {
      ...(dto.gatewayAccountId !== undefined && { gatewayAccountId: dto.gatewayAccountId }),
      ...(isMainAccount !== undefined && { isMainAccount }),
    });

    this.logger.log(`Updated payout account ${existing.id}`);
    return { success: true, message: 'Payout account updated successfully.' };
  }

  // Removes the guarded row, refused while any payout channel has it switched on
  async delete(existing: PayoutAccountDetail): Promise<SuccessResponseDto> {
    if (existing.payoutChannelCount > 0) {
      const count = existing.payoutChannelCount;
      throw new ConflictException({
        label: 'Payout Account In Use',
        detail: `This payout account is switched on in ${pluralize('payout', count, true)}. Switch it off in the Payouts tab first.`,
      });
    }
    await this.payoutAccountRepository.delete(existing.id);

    this.logger.log(`Deleted payout account ${existing.id}`);
    return { success: true, message: 'Payout account removed successfully.' };
  }

  // Refuses a gateway account already used, or a gateway the bank account already pays out through, on each field
  private async assertNoConflicts(
    candidate: Pick<PayoutAccount, 'bankAccountId' | 'paymentGatewayConfigId' | 'gatewayCode' | 'gatewayAccountId'>,
    excludeId?: string,
  ): Promise<void> {
    const { gatewayCodeTaken, gatewayAccountHolder } = await this.payoutAccountRepository.findConflicts(
      candidate,
      excludeId,
    );
    if (gatewayCodeTaken) {
      throw new ConflictException({
        label: 'Gateway Already Used',
        detail: `This bank account already pays out through ${candidate.gatewayCode}. Change that payout account instead.`,
        errors: [{ field: 'paymentGatewayConfigId', message: 'Gateway already used on this bank account' }],
      });
    }
    if (gatewayAccountHolder) {
      const bank = `${gatewayAccountHolder.bankName} ••${gatewayAccountHolder.accountNumberLast4}`;
      throw new ConflictException({
        label: 'Gateway Account In Use',
        detail: `This account id is added on another bank account: ${bank} of ${gatewayAccountHolder.legalEntityName}.`,
        errors: [{ field: 'gatewayAccountId', message: `Added on ${bank} (${gatewayAccountHolder.legalEntityName})` }],
      });
    }
  }
}

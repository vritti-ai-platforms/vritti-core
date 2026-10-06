import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and, eq } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type BankAccount, bankAccounts } from '@/db/schema';
import { BankAccountDto } from '../dto/entity/bank-account.dto';
import type { CreateBankAccountDto } from '../dto/request/create-bank-account.dto';
import type { UpdateBankAccountDto } from '../dto/request/update-bank-account.dto';
import type { BankAccountsPageResponseDto } from '../dto/response/bank-accounts-page-response.dto';
import { BankAccountDomainRepository } from '../repositories/bank-account.repository';

@Injectable()
export class BankAccountDomainService {
  private readonly logger = new Logger(BankAccountDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    accountHolderName: { column: bankAccounts.accountHolderName, type: 'string' },
    bankName: { column: bankAccounts.bankName, type: 'string' },
    accountNumber: { column: bankAccounts.accountNumber, type: 'string' },
    label: { column: bankAccounts.label, type: 'string' },
    legalEntityId: { column: bankAccounts.legalEntityId, type: 'string' },
    ifscCode: { column: bankAccounts.ifscCode, type: 'string' },
    createdAt: { column: bankAccounts.createdAt, type: 'string' },
  };

  constructor(private readonly bankAccountRepository: BankAccountDomainRepository) {}

  // Returns a page of the organization's bank accounts for the data table
  async findForTable(orgId: string, state: TableViewState): Promise<BankAccountsPageResponseDto> {
    const { filters, search, sort, pagination } = state;
    const where = and(
      eq(bankAccounts.organizationId, orgId),
      FilterProcessor.buildWhere(filters, BankAccountDomainService.FIELD_MAP),
      FilterProcessor.buildSearch(search, BankAccountDomainService.FIELD_MAP),
    );
    const orderBy = FilterProcessor.buildOrderBy(sort, BankAccountDomainService.FIELD_MAP);

    const { result, count } = await this.bankAccountRepository.findForTable({
      where,
      orderBy,
      limit: pagination.limit,
      offset: pagination.offset,
    });

    this.logger.log(`Fetched bank accounts table for org ${orgId} (${count} results)`);
    return { result: result.map(BankAccountDto.from), count };
  }

  // Lists a legal entity's bank accounts
  async listByLegalEntity(orgId: string, legalEntityId: string): Promise<BankAccountDto[]> {
    const rows = await this.bankAccountRepository.findByLegalEntity(orgId, legalEntityId);
    return rows.map(BankAccountDto.from);
  }

  // Returns a single bank account
  async findById(orgId: string, id: string): Promise<BankAccountDto> {
    return BankAccountDto.from(await this.requireInOrg(orgId, id));
  }

  // Creates a bank account after checking the number is new to the legal entity
  async create(orgId: string, dto: CreateBankAccountDto): Promise<CreateResponseDto<BankAccountDto>> {
    await this.assertNotDuplicate(dto.legalEntityId, dto.accountNumber, dto.ifscCode);

    const row = await this.bankAccountRepository.create({
      organizationId: orgId,
      legalEntityId: dto.legalEntityId,
      label: dto.label ?? null,
      accountHolderName: dto.accountHolderName,
      accountNumber: dto.accountNumber,
      ifscCode: dto.ifscCode,
      bankName: dto.bankName,
      branchName: dto.branchName ?? null,
    });

    this.logger.log(`Created bank account ${row.id} for legal entity ${dto.legalEntityId}`);
    return {
      success: true,
      message: `Bank account "${displayName(row)}" created successfully.`,
      data: BankAccountDto.from(row),
    };
  }

  // Updates a bank account, re-checking uniqueness when the number or branch changes
  async update(orgId: string, id: string, dto: UpdateBankAccountDto): Promise<SuccessResponseDto> {
    const existing = await this.requireInOrg(orgId, id);

    const accountNumber = dto.accountNumber ?? existing.accountNumber;
    const ifscCode = dto.ifscCode ?? existing.ifscCode;
    if (accountNumber !== existing.accountNumber || ifscCode !== existing.ifscCode) {
      await this.assertNotDuplicate(existing.legalEntityId, accountNumber, ifscCode);
    }

    const row = await this.bankAccountRepository.update(id, {
      ...(dto.label !== undefined && { label: dto.label }),
      ...(dto.accountHolderName !== undefined && { accountHolderName: dto.accountHolderName }),
      ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber }),
      ...(dto.ifscCode !== undefined && { ifscCode: dto.ifscCode }),
      ...(dto.bankName !== undefined && { bankName: dto.bankName }),
      ...(dto.branchName !== undefined && { branchName: dto.branchName }),
    });

    this.logger.log(`Updated bank account ${id}`);
    return { success: true, message: `Bank account "${displayName(row)}" updated successfully.` };
  }

  // Deletes a bank account
  async delete(orgId: string, id: string): Promise<SuccessResponseDto> {
    const existing = await this.requireInOrg(orgId, id);
    await this.bankAccountRepository.delete(id);

    this.logger.log(`Deleted bank account ${id}`);
    return { success: true, message: `Bank account "${displayName(existing)}" deleted successfully.` };
  }

  // Loads the account, hiding rows that belong to another organization behind the same 404
  private async requireInOrg(orgId: string, id: string): Promise<BankAccount> {
    const row = await this.bankAccountRepository.findById(id);
    if (!row || row.organizationId !== orgId) throw new NotFoundException('Bank account not found.');
    return row;
  }

  // Rejects a number the legal entity already holds at the same branch
  private async assertNotDuplicate(legalEntityId: string, accountNumber: string, ifscCode: string): Promise<void> {
    const duplicate = await this.bankAccountRepository.findDuplicate(legalEntityId, accountNumber, ifscCode);
    if (duplicate) {
      throw new ConflictException({
        label: 'Duplicate Account',
        detail: `Account ${maskAccountNumber(accountNumber)} at ${ifscCode} is already on file for this legal entity.`,
        errors: [{ field: 'accountNumber', message: 'This account already exists for the legal entity' }],
      });
    }
  }
}

// Shows the label when set, otherwise the masked account number
function displayName(row: Pick<BankAccount, 'label' | 'accountNumber'>): string {
  return row.label ?? maskAccountNumber(row.accountNumber);
}

// Keeps only the last four characters of an account number
function maskAccountNumber(accountNumber: string): string {
  return `****${accountNumber.slice(-4)}`;
}

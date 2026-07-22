import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { partyBankAccounts } from '@/db/schema';
import { PartyBankAccountDto } from '../dto/entity/party-bank-account.dto';
import type { CreateCompanyBankAccountDto } from '../dto/request/create-company-bank-account.dto';
import type { UpdateCompanyBankAccountDto } from '../dto/request/update-company-bank-account.dto';
import { PartyBankAccountsDomainRepository } from '../repositories/party-bank-accounts.repository';

@Injectable()
export class PartyBankAccountsDomainService {
  private readonly logger = new Logger(PartyBankAccountsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    accountName: { column: partyBankAccounts.accountName, type: 'string' },
    accountNumber: { column: partyBankAccounts.accountNumber, type: 'string' },
    bankName: { column: partyBankAccounts.bankName, type: 'string' },
    ifscCode: { column: partyBankAccounts.ifscCode, type: 'string' },
    upiId: { column: partyBankAccounts.upiId, type: 'string' },
    isPrimary: { column: partyBankAccounts.isPrimary, type: 'boolean' },
    isActive: { column: partyBankAccounts.isActive, type: 'boolean' },
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: PartyBankAccountsDomainRepository,
  ) {}

  // Returns paginated bank accounts of a party for the data table
  async findForTable(
    partyId: string,
    state: TableViewState,
  ): Promise<{ result: PartyBankAccountDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartyBankAccountsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartyBankAccountsDomainService.FIELD_MAP);
    const where = and(eq(partyBankAccounts.partyId, partyId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartyBankAccountsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(partyBankAccounts.isPrimary), asc(partyBankAccounts.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(PartyBankAccountDto.from), count };
  }

  // Returns paginated active bank account options of a party for select dropdowns
  findForSelect(query: SelectOptionsQueryDto, partyId: string): Promise<SelectQueryResult> {
    return this.repository.findOptionsForSelect(partyId, query);
  }

  // Creates a bank account for a party, clearing any existing primary when this one is primary
  async create(
    partyId: string,
    data: Omit<CreateCompanyBankAccountDto, 'companyId'>,
  ): Promise<CreateResponseDto<PartyBankAccountDto>> {
    const partyExists = await this.repository.partyExists(partyId);
    if (!partyExists) throw new NotFoundException('Party not found.');

    const existing = await this.repository.findByPartyAndAccountNumber(partyId, data.accountNumber);
    if (existing) {
      throw new ConflictException({
        label: 'Account Exists',
        detail: 'A bank account with this number is already on record for this company.',
      });
    }

    const isPrimary = data.isPrimary ?? false;
    const isActive = data.isActive ?? true;
    if (isPrimary && !isActive) {
      throw new ConflictException({
        label: 'Invalid State',
        detail: 'A primary account must be active — an inactive account cannot be the primary payee.',
      });
    }

    const entity = await this.database.runInTransaction(async () => {
      if (isPrimary) {
        await this.repository.clearPrimaryForParty(partyId);
      }
      return this.repository.create({
        partyId,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode ?? null,
        upiId: data.upiId ?? null,
        bankName: data.bankName ?? null,
        isPrimary,
        isActive,
      });
    });

    this.logger.log(`Created bank account "${data.accountName}" for party ${partyId}`);
    return { success: true, message: 'Bank account added successfully.', data: PartyBankAccountDto.from(entity) };
  }

  // Updates a bank account, enforcing at most one primary per party via clear-then-set
  async update(id: string, data: Omit<UpdateCompanyBankAccountDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Bank account not found.');

    if (data.accountNumber !== undefined && data.accountNumber !== existing.accountNumber) {
      const duplicate = await this.repository.findByPartyAndAccountNumber(existing.partyId, data.accountNumber);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException({
          label: 'Account Exists',
          detail: 'A bank account with this number is already on record for this company.',
        });
      }
    }

    // A primary account must stay active — blocks retiring the current primary payee or promoting an inactive account
    const nextPrimary = data.isPrimary ?? existing.isPrimary;
    const nextActive = data.isActive ?? existing.isActive;
    if (nextPrimary && !nextActive) {
      throw new ConflictException({
        label: 'Primary In Use',
        detail: 'The primary account must stay active. Set another account as primary before retiring this one.',
      });
    }

    if (Object.keys(data).length > 0) {
      await this.database.runInTransaction(async () => {
        if (data.isPrimary === true) {
          await this.repository.clearPrimaryForParty(existing.partyId, id);
        }
        await this.repository.update(id, data);
      });
    }

    this.logger.log(`Updated bank account: ${id}`);
    return { success: true, message: 'Bank account updated successfully.' };
  }

  // Deletes a bank account by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Bank account not found.');
    await this.repository.delete(id);
    this.logger.log(`Deleted bank account: ${id}`);
    return { success: true, message: 'Bank account removed successfully.' };
  }
}

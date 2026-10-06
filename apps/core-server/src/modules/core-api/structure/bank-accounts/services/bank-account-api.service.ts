import type { BankAccountDto } from '@domain/bank-account/dto/entity/bank-account.dto';
import type { CreateBankAccountDto } from '@domain/bank-account/dto/request/create-bank-account.dto';
import type { UpdateBankAccountDto } from '@domain/bank-account/dto/request/update-bank-account.dto';
import type { BankAccountsPageResponseDto } from '@domain/bank-account/dto/response/bank-accounts-page-response.dto';
import type { BankAccountsTableResponseDto } from '@domain/bank-account/dto/response/bank-accounts-table-response.dto';
import { BankAccountDomainService } from '@domain/bank-account/services/bank-account.service';
import { LegalEntityDomainRepository } from '@domain/legal-entity/repositories/legal-entity.repository';
import { Injectable } from '@nestjs/common';
import { DataTableStateService, type TableViewState } from '@vritti/api-sdk/data-table';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { CreateLeBankAccountDto } from '../dto/request/create-le-bank-account.dto';
import type { GetBankAccountsInternalDto } from '../dto/request/get-bank-accounts-internal.dto';

// Must equal the frontend useDataTable({ slug }) exactly, or the user's saved view is lost
const TABLE_SLUG = 'le-bank-accounts';

@Injectable()
export class BankAccountService {
  constructor(
    private readonly bankAccountService: BankAccountDomainService,
    private readonly legalEntityRepository: LegalEntityDomainRepository,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Cloud's data table: it holds the view state and sends it serialized, core resolves the page
  async findForTableWithQuery(orgId: string, query: GetBankAccountsInternalDto): Promise<BankAccountsPageResponseDto> {
    return this.findForTableWithState(orgId, {
      filters: query.filters ? JSON.parse(query.filters) : [],
      search: query.search ? JSON.parse(query.search) : null,
      sort: query.sort ? JSON.parse(query.sort) : [],
      pagination: { limit: query.limit ?? 20, offset: query.offset ?? 0 },
    } as TableViewState);
  }

  // Resolves a page for a caller that owns its own view state
  async findForTableWithState(orgId: string, state: TableViewState): Promise<BankAccountsPageResponseDto> {
    return this.bankAccountService.findForTable(orgId, state);
  }

  // The workspace table: the user's saved view, pinned to the legal entity in context
  async findForTable(
    userId: string,
    orgId: string,
    legalEntityId: string | undefined,
  ): Promise<BankAccountsTableResponseDto> {
    const contextLegalEntityId = this.requireLegalEntity(legalEntityId);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, TABLE_SLUG);

    // The pin stays out of the returned state so it never shows up as a user-removable filter chip
    const scoped: TableViewState = {
      ...state,
      filters: [...state.filters, { field: 'legalEntityId', operator: 'equals', value: contextLegalEntityId }],
    };
    const { result, count } = await this.bankAccountService.findForTable(orgId, scoped);
    return { result, count, state, activeViewId };
  }

  // Lists the bank accounts of one legal entity
  async listByLegalEntity(orgId: string, legalEntityId: string | undefined): Promise<BankAccountDto[]> {
    return this.bankAccountService.listByLegalEntity(orgId, this.requireLegalEntity(legalEntityId));
  }

  // Creates a bank account for a named legal entity after confirming it belongs to the organization
  async create(orgId: string, dto: CreateBankAccountDto): Promise<CreateResponseDto<BankAccountDto>> {
    await this.assertLegalEntityInOrg(orgId, dto.legalEntityId);
    return this.bankAccountService.create(orgId, dto);
  }

  // Creates a bank account for the legal entity in context
  async createForContext(
    orgId: string,
    legalEntityId: string | undefined,
    dto: CreateLeBankAccountDto,
  ): Promise<CreateResponseDto<BankAccountDto>> {
    return this.bankAccountService.create(orgId, { ...dto, legalEntityId: this.requireLegalEntity(legalEntityId) });
  }

  // Returns a single bank account
  async findById(orgId: string, id: string): Promise<BankAccountDto> {
    return this.bankAccountService.findById(orgId, id);
  }

  // Updates a bank account
  async update(orgId: string, id: string, dto: UpdateBankAccountDto): Promise<SuccessResponseDto> {
    return this.bankAccountService.update(orgId, id, dto);
  }

  // Deletes a bank account
  async delete(orgId: string, id: string): Promise<SuccessResponseDto> {
    return this.bankAccountService.delete(orgId, id);
  }

  // Rejects a legal entity that does not exist or belongs to another organization
  private async assertLegalEntityInOrg(orgId: string, legalEntityId: string): Promise<void> {
    const legalEntity = await this.legalEntityRepository.findById(legalEntityId);
    if (!legalEntity || legalEntity.organizationId !== orgId) {
      throw new BadRequestException({
        label: 'Invalid Legal Entity',
        detail: 'The legal entity does not exist or belongs to a different organization.',
        errors: [{ field: 'legalEntityId', message: 'Unknown legal entity' }],
      });
    }
  }

  // The tenant surface reads the entity from the x-le-id header; without one there is nothing to scope to
  private requireLegalEntity(legalEntityId: string | undefined): string {
    if (!legalEntityId) throw new BadRequestException('A legal entity context is required.');
    return legalEntityId;
  }
}

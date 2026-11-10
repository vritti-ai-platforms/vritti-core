import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterOperators, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, arrayOverlaps, asc, not, sql } from '@vritti/api-sdk/drizzle-orm';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import { parties, supplierItems, suppliers } from '@/db/schema';
import { SupplierDetailDto, SupplierDto } from '../dto/entity/supplier.dto';
import type { ChangeSupplierCurrencyDto } from '../dto/request/change-supplier-currency.dto';
import type { CreateSupplierDto } from '../dto/request/create-supplier.dto';
import type { UpdateSupplierDto } from '../dto/request/update-supplier.dto';
import { SuppliersDomainRepository } from '../repositories/suppliers.repository';

@Injectable()
export class SuppliersDomainService {
  private readonly logger = new Logger(SuppliersDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    partyName: { column: parties.displayName, type: 'string' },
    code: { column: suppliers.code, type: 'string' },
  };

  private static readonly FILTER_FIELD_MAP: FieldMap = {
    name: { column: parties.displayName, type: 'string' },
    partyName: { column: parties.displayName, type: 'string' },
    code: { column: suppliers.code, type: 'string' },
    purchasingBlocked: { column: suppliers.purchasingBlocked, type: 'boolean' },
    paymentBlocked: { column: suppliers.paymentBlocked, type: 'boolean' },
    isActive: { column: suppliers.isActive, type: 'boolean' },
    defaultPaymentTermId: { column: suppliers.defaultPaymentTermId, type: 'string' },
    currency: {
      multiExpression: (values, operator) =>
        operator === FilterOperators.IS_NOT_ANY_OF
          ? not(arrayOverlaps(suppliers.currencyCodes, values))
          : arrayOverlaps(suppliers.currencyCodes, values),
      type: 'string',
    },
    inventoryItemId: {
      expression: (value, operator) =>
        operator === FilterOperators.NOT_EQUALS
          ? sql`NOT EXISTS (SELECT 1 FROM ${supplierItems} WHERE ${supplierItems.supplierId} = ${suppliers.id} AND ${supplierItems.inventoryItemId} = ${String(value)})`
          : sql`EXISTS (SELECT 1 FROM ${supplierItems} WHERE ${supplierItems.supplierId} = ${suppliers.id} AND ${supplierItems.inventoryItemId} = ${String(value)})`,
      type: 'string',
    },
  };

  constructor(private readonly repository: SuppliersDomainRepository) {}

  // Returns paginated suppliers for the data table with the joined party name
  async findForTable(state: TableState): Promise<{ result: SupplierDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, SuppliersDomainService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SuppliersDomainService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...SuppliersDomainService.SEARCH_FIELD_MAP,
      ...SuppliersDomainService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllWithParty({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [asc(parties.displayName)],
      limit,
      offset,
    });

    return { result: rows.map((row) => SupplierDto.from(row)), count };
  }

  // Returns paginated supplier options; activeOnly drops inactive suppliers and inventoryItemId keeps those supplying the item
  findForSelect(
    query: SelectOptionsQueryDto,
    options?: { activeOnly?: boolean; inventoryItemId?: string },
  ): Promise<SelectQueryResult> {
    return this.repository.findForSelect(
      {
        value: query.valueKey || 'id',
        label: query.labelKey || 'displayName',
        description: query.descriptionKey,
        additionalKeys: query.additionalKeys,
        groupIdKey: query.groupIdKey,
        search: query.search,
        searchKeys: ['displayName', 'code'],
        limit: query.limit,
        offset: query.offset,
        values: query.values,
        excludeIds: query.excludeIds,
        orderByKey: query.orderByKey || 'displayName',
        orderDirection: query.orderDirection || 'asc',
      },
      options,
    );
  }

  // Creates a new supplier referencing an existing party for its identity
  async create(data: CreateSupplierDto): Promise<CreateResponseDto<SupplierDto>> {
    await this.repository.assertDefaultPaymentTermUsable(data.defaultPaymentTermId);
    await this.repository.assertPartyFree(data.partyId);
    const entity = await this.repository.create({
      partyId: data.partyId,
      code: data.code,
      currencyCode: data.currencyCode,
      currencyCodes: data.currencyCodes,
      defaultPaymentTermId: data.defaultPaymentTermId,
      notes: data.notes ?? null,
      purchasingBlocked: data.purchasingBlocked,
      paymentBlocked: data.paymentBlocked,
      isActive: data.isActive,
    });

    const withParty = await this.repository.findWithPartyOrThrow(entity.id);
    this.logger.log(`Created supplier: ${entity.code}`);
    return {
      success: true,
      message: `Supplier "${withParty.partyName}" created.`,
      data: SupplierDto.from(withParty),
    };
  }

  // Returns supplier detail with party name, registrations, licenses, and its enrollment and item counts
  async findById(id: string): Promise<SupplierDetailDto> {
    return SupplierDetailDto.fromDetail(await this.repository.findDetailOrThrow(id));
  }

  // Updates a supplier's commercial terms and block flags
  async update(id: string, data: Omit<UpdateSupplierDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findByIdOrThrow(id);

    if (Object.keys(data).length > 0) {
      await this.repository.update(id, data);
    }

    this.logger.log(`Updated supplier: ${existing.code} (${existing.id})`);
    return { success: true, message: 'Supplier updated successfully.' };
  }

  // Sets a supplier's currencies and default; prices are never converted, so a currency in use cannot be dropped
  async changeCurrency(id: string, data: Omit<ChangeSupplierCurrencyDto, 'id'>): Promise<SuccessResponseDto> {
    const supplier = await this.repository.findByIdOrThrow(id);
    const { currencyCodes } = data;
    const dropped = supplier.currencyCodes.filter((code) => !currencyCodes.includes(code));
    await this.repository.assertCurrenciesUnused(id, dropped);

    await this.repository.update(id, { currencyCode: data.currencyCode, currencyCodes });
    this.logger.log(`Set supplier ${id} currencies to ${currencyCodes.join(', ')} (default ${data.currencyCode})`);
    return { success: true, message: `Supplier currencies set to ${currencyCodes.join(', ')}.` };
  }

  // Sets the payment term new site enrollments of a supplier start from
  async setDefaultPaymentTerm(id: string, defaultPaymentTermId: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findWithPartyOrThrow(id);
    await this.repository.assertDefaultPaymentTermUsable(defaultPaymentTermId);
    await this.repository.update(id, { defaultPaymentTermId });
    return { success: true, message: `Default payment term of "${existing.partyName}" updated.` };
  }

  // Sets the default payment term of several suppliers at once
  async bulkSetDefaultPaymentTerm(ids: string[], defaultPaymentTermId: string): Promise<SuccessResponseDto> {
    await this.repository.assertDefaultPaymentTermUsable(defaultPaymentTermId);
    const updated = await this.repository.bulkSetDefaultPaymentTerm([...new Set(ids)], defaultPaymentTermId);
    return { success: true, message: `Default payment term updated for ${pluralize('supplier', updated, true)}.` };
  }

  // Blocks or unblocks new purchase orders and goods receipts from a supplier at every site
  async setPurchasingBlocked(id: string, purchasingBlocked: boolean): Promise<SuccessResponseDto> {
    const existing = await this.repository.findWithPartyOrThrow(id);
    await this.repository.update(id, { purchasingBlocked });
    return {
      success: true,
      message: `Purchasing ${purchasingBlocked ? 'blocked' : 'unblocked'} for "${existing.partyName}".`,
    };
  }

  // Blocks or unblocks payments to a supplier
  async setPaymentBlocked(id: string, paymentBlocked: boolean): Promise<SuccessResponseDto> {
    const existing = await this.repository.findWithPartyOrThrow(id);
    await this.repository.update(id, { paymentBlocked });
    return {
      success: true,
      message: `Payments ${paymentBlocked ? 'blocked' : 'unblocked'} for "${existing.partyName}".`,
    };
  }

  // Activates or deactivates a supplier
  async setActive(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    const existing = await this.repository.findWithPartyOrThrow(id);
    await this.repository.update(id, { isActive });
    return {
      success: true,
      message: `Supplier "${existing.partyName}" ${isActive ? 'activated' : 'deactivated'}.`,
    };
  }

  // Activates or deactivates several suppliers at once
  async bulkSetActive(ids: string[], isActive: boolean): Promise<SuccessResponseDto> {
    const updated = await this.repository.bulkSetActive([...new Set(ids)], isActive);
    return {
      success: true,
      message: `${pluralize('supplier', updated, true)} ${isActive ? 'activated' : 'deactivated'}.`,
    };
  }

  // Deletes a supplier that nothing references
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findWithPartyOrThrow(id);
    await this.repository.assertNotReferenced(existing);
    await this.repository.delete(id);
    this.logger.log(`Deleted supplier: ${existing.code} (${id})`);
    return { success: true, message: `Supplier "${existing.partyName}" deleted successfully.` };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterOperators, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and, arrayOverlaps, desc, eq, isNotNull, isNull, not, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import { parties, paymentTerms, supplierItems, supplierSites, suppliers } from '@/db/schema';
import {
  type SiteEnrollmentStatus,
  SiteEnrollmentStatusValues,
  SiteSupplierListRowDto,
} from '../dto/entity/site-supplier-list-row.dto';
import { SupplierDetailDto, SupplierDto } from '../dto/entity/supplier.dto';
import { SupplierAtSiteDto } from '../dto/entity/supplier-at-site.dto';
import type { CreateSupplierDto } from '../dto/request/create-supplier.dto';
import type { UpdateSupplierDto } from '../dto/request/update-supplier.dto';
import { type PricedItemAtSite, SuppliersDomainRepository } from '../repositories/suppliers.repository';

@Injectable()
export class SuppliersDomainService {
  private readonly logger = new Logger(SuppliersDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: parties.displayName, type: 'string' },
    partyName: { column: parties.displayName, type: 'string' },
    code: { column: suppliers.code, type: 'string' },
    purchasingBlocked: { column: suppliers.purchasingBlocked, type: 'boolean' },
    paymentBlocked: { column: suppliers.paymentBlocked, type: 'boolean' },
    isActive: { column: suppliers.isActive, type: 'boolean' },
    paymentTermId: { column: suppliers.defaultPaymentTermId, type: 'string' },
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

  private static readonly AT_SITE_FIELD_MAP: FieldMap = {
    partyName: { column: parties.displayName, type: 'string' },
    code: { column: suppliers.code, type: 'string' },
    currencyCode: { column: suppliers.currencyCode, type: 'string' },
    purchasingBlocked: { column: suppliers.purchasingBlocked, type: 'boolean' },
    paymentTermName: { column: paymentTerms.name, type: 'string' },
    enrollmentStatus: {
      type: 'string',
      expression: (value, operator) => {
        const enrolled = (value === SiteEnrollmentStatusValues.ENROLLED) !== (operator === FilterOperators.NOT_EQUALS);
        return enrolled ? isNotNull(supplierSites.id) : isNull(supplierSites.id);
      },
    },
  };

  constructor(private readonly repository: SuppliersDomainRepository) {}

  async findForSiteTable(
    legalEntityId: string,
    siteId: string,
    state: TableViewState,
  ): Promise<{ result: SiteSupplierListRowDto[]; count: number }> {
    const fieldMap = SuppliersDomainService.AT_SITE_FIELD_MAP;
    const where = and(
      eq(suppliers.isActive, true),
      FilterProcessor.buildWhere(state.filters, fieldMap),
      FilterProcessor.buildSearch(state.search, fieldMap),
    );
    const { limit = 20, offset = 0 } = state.pagination;
    const { result, count } = await this.repository.findForSiteList(legalEntityId, siteId, {
      where: where || undefined,
      orderBy: FilterProcessor.buildOrderBy(state.sort, fieldMap),
      limit,
      offset,
    });
    return { result: result.map(SiteSupplierListRowDto.from), count };
  }

  async findAtSite(legalEntityId: string, siteId: string, supplierId: string): Promise<SupplierAtSiteDto> {
    const { result } = await this.repository.findAtSite(legalEntityId, siteId, {
      where: eq(suppliers.id, supplierId),
      limit: 1,
    });
    if (!result[0]) throw new NotFoundException('Supplier not found.');
    return SupplierAtSiteDto.from(result[0]);
  }

  // Returns paginated suppliers for the data table with the joined party name
  async findForTable(state: TableViewState): Promise<{ result: SupplierDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, SuppliersDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SuppliersDomainService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SuppliersDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllWithParty({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(suppliers.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map((row) => SupplierDto.from(row, row.partyName)), count };
  }

  // Returns paginated supplier options; a site adds each supplier's enrollment status there and can filter on it
  findForSelect(
    query: SelectOptionsQueryDto,
    options?: { siteId?: string; enrollmentStatus?: SiteEnrollmentStatus; pricedItem?: PricedItemAtSite },
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
    await this.assertDefaultPaymentTerm(data.defaultPaymentTermId);
    let entity: Awaited<ReturnType<SuppliersDomainRepository['create']>>;
    try {
      entity = await this.repository.create({
        partyId: data.partyId,
        code: data.code,
        currencyCode: data.currencyCode,
        currencyCodes: [...new Set([data.currencyCode, ...(data.currencyCodes ?? [])])],
        defaultPaymentTermId: data.defaultPaymentTermId ?? null,
        notes: data.notes ?? null,
        purchasingBlocked: data.purchasingBlocked ?? false,
        paymentBlocked: data.paymentBlocked ?? false,
        orderEmail: data.orderEmail ?? null,
        orderPhone: data.orderPhone ?? null,
        isActive: data.isActive ?? true,
      });
    } catch (error: unknown) {
      if (_.get(error, 'code') === '23505' && _.get(error, 'constraint') === 'uq_suppliers_le_party') {
        throw new ConflictException('This company is already a supplier for this legal entity.');
      }
      throw error;
    }

    const withParty = await this.repository.findByIdWithParty(entity.id);
    this.logger.log(`Created supplier: ${entity.code}`);
    return {
      success: true,
      message: `Supplier "${withParty?.partyName ?? entity.code}" created.`,
      data: SupplierDto.from(entity, withParty?.partyName ?? null),
    };
  }

  // Returns supplier detail with party name, registrations, licenses, and its enrollment and item counts
  async findById(id: string): Promise<SupplierDetailDto> {
    const entity = await this.repository.findDetailById(id);
    if (!entity) throw new NotFoundException('Supplier not found.');
    return SupplierDetailDto.fromDetail(entity, entity.partyName, {
      partyType: entity.partyType,
      registrations: entity.registrations,
      licenses: entity.licenses,
      enrolledSiteCount: entity.enrolledSiteCount,
      itemCount: entity.itemCount,
    });
  }

  // Updates a supplier's commercial terms and block flags
  async update(id: string, data: Omit<UpdateSupplierDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Supplier not found.');
    await this.assertDefaultPaymentTerm(data.defaultPaymentTermId);

    if (Object.keys(data).length > 0) {
      await this.repository.update(id, data);
    }

    this.logger.log(`Updated supplier: ${existing.code} (${existing.id})`);
    return { success: true, message: 'Supplier updated successfully.' };
  }

  // Activates or deactivates a supplier
  async setActive(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    const existing = await this.repository.findByIdWithParty(id);
    if (!existing) throw new NotFoundException('Supplier not found.');
    await this.repository.update(id, { isActive });
    return {
      success: true,
      message: `Supplier "${existing.partyName ?? existing.code}" ${isActive ? 'activated' : 'deactivated'}.`,
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

  // Deletes a supplier
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.repository.findByIdWithParty(id);
    if (!existing) throw new NotFoundException('Supplier not found.');
    const refs = await this.repository.countReferences(id);
    const refLabels: [number, string][] = [
      [refs.purchaseOrders, 'purchase order'],
      [refs.quotations, 'quotation'],
      [refs.prices, 'item price'],
    ];
    const parts = refLabels.filter(([n]) => n > 0).map(([n, label]) => `${n} ${pluralize(label, n)}`);

    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Supplier In Use',
        detail: `Cannot delete "${existing.partyName ?? existing.code}" — it is referenced by ${parts.join(', ')}. Remove those references first.`,
      });
    }

    await this.repository.delete(id);
    this.logger.log(`Deleted supplier: ${existing.code} (${id})`);
    return { success: true, message: `Supplier "${existing.partyName ?? existing.code}" deleted successfully.` };
  }

  // Rejects a default payment term that is not an active term of the caller's organization
  private async assertDefaultPaymentTerm(paymentTermId: string | null | undefined): Promise<void> {
    if (!paymentTermId || (await this.repository.isPaymentTermUsable(paymentTermId))) return;
    throw new BadRequestException({
      label: 'Invalid Payment Term',
      detail: 'The selected default payment term does not exist or is inactive.',
      errors: [{ field: 'defaultPaymentTermId', message: 'Pick an active payment term' }],
    });
  }
}

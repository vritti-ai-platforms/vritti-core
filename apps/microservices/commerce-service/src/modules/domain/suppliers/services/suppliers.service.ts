import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterOperators,
  FilterProcessor,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, desc, sql } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { parties, supplierItems, suppliers } from '@/db/schema';
import type { CreateSupplierDto } from '@/modules/legal-entity/suppliers/root/dto/request/create-supplier.dto';
import type { UpdateSupplierDto } from '@/modules/legal-entity/suppliers/root/dto/request/update-supplier.dto';
import { SupplierDetailDto, SupplierDto } from '../dto/entity/supplier.dto';
import { SuppliersRepository } from '../repositories/suppliers.repository';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: parties.displayName, type: 'string' },
    code: { column: suppliers.code, type: 'string' },
    isActive: { column: suppliers.isActive, type: 'boolean' },
    inventoryItemId: {
      expression: (value, operator) =>
        operator === FilterOperators.NOT_EQUALS
          ? sql`NOT EXISTS (SELECT 1 FROM ${supplierItems} WHERE ${supplierItems.supplierId} = ${suppliers.id} AND ${supplierItems.inventoryItemId} = ${String(value)})`
          : sql`EXISTS (SELECT 1 FROM ${supplierItems} WHERE ${supplierItems.supplierId} = ${suppliers.id} AND ${supplierItems.inventoryItemId} = ${String(value)})`,
      type: 'string',
    },
  };

  constructor(private readonly repository: SuppliersRepository) {}

  // Returns paginated suppliers for the data table with the joined party name
  async findForTable(state: TableViewState): Promise<{ result: SupplierDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, SuppliersService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SuppliersService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SuppliersService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllWithParty({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(suppliers.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map((row) => SupplierDto.from(row, row.partyName)), count };
  }

  // Returns paginated supplier options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Creates a new supplier referencing an existing party for its identity
  async create(data: CreateSupplierDto): Promise<CreateResponseDto<SupplierDto>> {
    const entity = await this.repository.create({
      partyId: data.partyId,
      code: data.code,
      currencyCode: data.currencyCode,
      paymentTerms: data.paymentTerms ?? null,
      leadTimeDays: data.leadTimeDays ?? null,
      notes: data.notes ?? null,
    });

    const withParty = await this.repository.findByIdWithParty(entity.id);
    this.logger.log(`Created supplier: ${entity.code}`);
    return {
      success: true,
      message: `Supplier "${withParty?.partyName ?? entity.code}" created.`,
      data: SupplierDto.from(entity, withParty?.partyName ?? null),
    };
  }

  // Returns supplier detail with the joined party name
  async findById(id: string): Promise<SupplierDetailDto> {
    const entity = await this.repository.findByIdWithParty(id);
    if (!entity) throw new NotFoundException('Supplier not found.');
    return SupplierDetailDto.fromDetail(entity, entity.partyName);
  }

  // Updates a supplier's commercial terms
  async update(id: string, data: Omit<UpdateSupplierDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Supplier not found.');

    if (Object.keys(data).length > 0) {
      await this.repository.update(id, data);
    }

    this.logger.log(`Updated supplier: ${existing.code} (${existing.id})`);
    return { success: true, message: 'Supplier updated successfully.' };
  }

  // Deletes a supplier
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.repository.findByIdWithParty(id);
    if (!existing) throw new NotFoundException('Supplier not found.');
    const refs = await this.repository.countReferences(id);
    const refLabels: [number, string][] = [[refs.purchaseOrders, 'purchase order']];
    const parts = refLabels.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}${n > 1 ? 's' : ''}`);

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
}

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
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { supplierItems, suppliers } from '@/db/schema';
import type { CreateSupplierDto } from '@/modules/legal-entity/suppliers/root/dto/request/create-supplier.dto';
import type { UpdateSupplierDto } from '@/modules/legal-entity/suppliers/root/dto/request/update-supplier.dto';
import { SupplierDetailDto, SupplierDto } from '../dto/entity/supplier.dto';
import { SuppliersRepository } from '../repositories/suppliers.repository';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: suppliers.name, type: 'string' },
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

  private throwMissingTaxId(): never {
    throw new BadRequestException({
      label: 'Invalid Tax Details',
      detail: 'Tax ID is required when Tax ID Type is selected.',
      errors: [{ field: 'taxId', message: 'Tax ID is required when Tax ID Type is selected.' }],
    });
  }

  private throwMissingTaxIdType(): never {
    throw new BadRequestException({
      label: 'Invalid Tax Details',
      detail: 'Tax ID Type is required when Tax ID is provided.',
      errors: [{ field: 'taxIdType', message: 'Tax ID Type is required when Tax ID is provided.' }],
    });
  }

  // Returns paginated suppliers for the data table
  async findForTable(state: TableViewState): Promise<{ result: SupplierDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, SuppliersService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SuppliersService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SuppliersService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(suppliers.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(SupplierDto.from), count };
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

  // Creates a new supplier. App-layer is responsible for creating the primary contact after creation.
  async create(data: CreateSupplierDto): Promise<CreateResponseDto<SupplierDto>> {
    const normalizedTaxId = data.taxId?.trim() ? data.taxId.trim() : null;
    const normalizedTaxIdType = data.taxIdType ?? null;
    if (normalizedTaxId != null && normalizedTaxIdType == null) this.throwMissingTaxIdType();
    if (normalizedTaxId == null && normalizedTaxIdType != null) this.throwMissingTaxId();

    const entity = await this.repository.create({
      name: data.name,
      code: data.code,
      currencyCode: data.currencyCode,
      contactName: data.primaryContact.name,
      phone: data.primaryContact.phone,
      email: data.primaryContact.email ?? null,
      website: data.website ?? null,
      address: data.address ?? null,
      taxId: normalizedTaxId,
      taxIdType: normalizedTaxIdType,
      paymentTerms: data.paymentTerms ?? null,
      leadTimeDays: data.leadTimeDays ?? null,
      notes: data.notes ?? null,
    });

    this.logger.log(`Created supplier: ${entity.name} (${entity.code})`);
    return { success: true, message: `Supplier "${entity.name}" created.`, data: SupplierDto.from(entity) };
  }

  // Returns supplier detail
  async findById(id: string): Promise<SupplierDetailDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Supplier not found.');
    return SupplierDetailDto.fromDetail(entity);
  }

  // Updates a supplier
  async update(id: string, data: UpdateSupplierDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Supplier not found.');

    const normalizedTaxIdInput = data.taxId !== undefined ? (data.taxId?.trim() ? data.taxId.trim() : null) : undefined;
    const nextTaxId = normalizedTaxIdInput !== undefined ? normalizedTaxIdInput : existing.taxId;
    const nextTaxIdType = data.taxIdType !== undefined ? data.taxIdType : existing.taxIdType;
    if (nextTaxId != null && nextTaxIdType == null) this.throwMissingTaxIdType();
    if (nextTaxId == null && nextTaxIdType != null) this.throwMissingTaxId();

    const { taxId: _taxId, ...rest } = data;
    const updatePayload = { ...rest, ...(normalizedTaxIdInput !== undefined && { taxId: normalizedTaxIdInput }) };

    const entity = Object.keys(updatePayload).length > 0 ? await this.repository.update(id, updatePayload) : existing;

    this.logger.log(`Updated supplier: ${entity.name} (${entity.id})`);
    return { success: true, message: `Supplier "${entity.name}" updated successfully.` };
  }

  // Deletes a supplier
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Supplier not found.');
    const refs = await this.repository.countReferences(id);
    const refLabels: [number, string][] = [[refs.purchaseOrders, 'purchase order']];
    const parts = refLabels.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}${n > 1 ? 's' : ''}`);

    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Supplier In Use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${parts.join(', ')}. Remove those references first.`,
      });
    }

    await this.repository.delete(id);
    this.logger.log(`Deleted supplier: ${existing.name} (${id})`);
    return { success: true, message: `Supplier "${existing.name}" deleted successfully.` };
  }
}

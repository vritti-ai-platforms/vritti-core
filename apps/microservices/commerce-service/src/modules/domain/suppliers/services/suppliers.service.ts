import { SupplierContactsRepository } from '@domain/supplier-contacts/repositories/supplier-contacts.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  ConflictException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { suppliers } from '@/db/schema';
import type { CreateSupplierDto } from '@/modules/suppliers/dto/request/create-supplier.dto';
import type { UpdateSupplierDto } from '@/modules/suppliers/dto/request/update-supplier.dto';
import { SupplierDetailDto, SupplierDto } from '../dto/entity/supplier.dto';
import { SuppliersRepository } from '../repositories/suppliers.repository';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: suppliers.name, type: 'string' },
    code: { column: suppliers.code, type: 'string' },
    isActive: { column: suppliers.isActive, type: 'boolean' },
  };

  constructor(
    private readonly repository: SuppliersRepository,
    private readonly supplierContactsRepository: SupplierContactsRepository,
  ) {}

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

  // Creates a new supplier
  async create(data: CreateSupplierDto): Promise<SupplierDto> {
    const normalizedTaxId = data.taxId?.trim() ? data.taxId.trim() : null;
    const normalizedTaxIdType = data.taxIdType ?? null;
    if ((normalizedTaxId != null) !== (normalizedTaxIdType != null)) {
      throw new ConflictException({
        label: 'Invalid Tax Details',
        detail: 'Tax ID and Tax ID Type must be provided together.',
      });
    }

    const entity = await this.repository.transaction(async (tx) => {
      const supplier = await this.repository.create(
        {
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
        },
        tx,
      );

      await this.supplierContactsRepository.createContact(
        {
          supplierId: supplier.id,
          name: data.primaryContact.name,
          phone: data.primaryContact.phone,
          alternatePhone: data.primaryContact.alternatePhone ?? null,
          email: data.primaryContact.email ?? null,
          alternateEmail: data.primaryContact.alternateEmail ?? null,
          designation: data.primaryContact.designation ?? null,
          isPrimary: true,
          isActive: true,
        },
        tx,
      );

      return supplier;
    });
    this.logger.log(`Created supplier: ${entity.name} (${entity.code})`);
    return SupplierDto.from(entity);
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
    if ((nextTaxId != null) !== (nextTaxIdType != null)) {
      throw new ConflictException({
        label: 'Invalid Tax Details',
        detail: 'Tax ID and Tax ID Type must be provided together.',
      });
    }

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.code !== undefined) updatePayload.code = data.code;
    if (data.currencyCode !== undefined) updatePayload.currencyCode = data.currencyCode;
    if (data.website !== undefined) updatePayload.website = data.website;
    if (data.address !== undefined) updatePayload.address = data.address;
    if (normalizedTaxIdInput !== undefined) updatePayload.taxId = normalizedTaxIdInput;
    if (data.taxIdType !== undefined) updatePayload.taxIdType = data.taxIdType;
    if (data.paymentTerms !== undefined) updatePayload.paymentTerms = data.paymentTerms;
    if (data.leadTimeDays !== undefined) updatePayload.leadTimeDays = data.leadTimeDays;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

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

import { Injectable, Logger } from '@nestjs/common';
import {
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { suppliers } from '@/db/schema';
import type { CreateSupplierDto } from '@/modules/suppliers/dto/request/create-supplier.dto';
import type { UpdateSupplierDto } from '@/modules/suppliers/dto/request/update-supplier.dto';
import { SupplierContactsRepository } from '@domain/supplier-contacts/repositories/supplier-contacts.repository';
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
      groupId: query.groupIdKey,
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
    const entity = await this.repository.transaction(async (tx) => {
      const supplier = await this.repository.create(
        {
          name: data.name,
          code: data.code,
          contactName: data.primaryContact.name,
          phone: data.primaryContact.phone ?? null,
          email: data.primaryContact.email ?? null,
          address: data.address ?? null,
          gstin: data.gstin ?? null,
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
          phone: data.primaryContact.phone ?? null,
          email: data.primaryContact.email ?? null,
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
  async update(id: string, data: UpdateSupplierDto): Promise<SupplierDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Supplier not found.');

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.code !== undefined) updatePayload.code = data.code;
    if (data.address !== undefined) updatePayload.address = data.address;
    if (data.gstin !== undefined) updatePayload.gstin = data.gstin;
    if (data.paymentTerms !== undefined) updatePayload.paymentTerms = data.paymentTerms;
    if (data.leadTimeDays !== undefined) updatePayload.leadTimeDays = data.leadTimeDays;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    const entity = Object.keys(updatePayload).length > 0 ? await this.repository.update(id, updatePayload) : existing;

    this.logger.log(`Updated supplier: ${entity.name} (${entity.id})`);
    return SupplierDto.from(entity);
  }

  // Deletes a supplier
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Supplier not found.');
    await this.repository.delete(id);
    this.logger.log(`Deleted supplier: ${existing.name} (${id})`);
    return { success: true, message: `Supplier "${existing.name}" deleted successfully.` };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import {
  type FieldMap,
  FilterProcessor,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { customers } from '@/db/schema';
import type { CreateCustomerDto } from '@/modules/customers/dto/request/create-customer.dto';
import type { UpdateCustomerDto } from '@/modules/customers/dto/request/update-customer.dto';
import { CustomerDto } from '../dto/entity/customer.dto';
import { CustomersRepository } from '../repositories/customers.repository';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: customers.name, type: 'string' },
    phone: { column: customers.phone, type: 'string' },
    email: { column: customers.email, type: 'string' },
    isActive: { column: customers.isActive, type: 'boolean' },
  };

  constructor(private readonly repository: CustomersRepository) {}

  // Returns paginated customers for the data table
  async findForTable(state: TableViewState): Promise<{ result: CustomerDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, CustomersService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, CustomersService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, CustomersService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(customers.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(CustomerDto.from), count };
  }

  // Returns paginated customer options for select dropdowns
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

  // Creates a new customer
  async create(data: CreateCustomerDto): Promise<CustomerDto> {
    const entity = await this.repository.create({
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      notes: data.notes ?? null,
    });
    this.logger.log(`Created customer: ${entity.name} (${entity.id})`);
    return CustomerDto.from(entity);
  }

  // Returns a customer by ID
  async findById(id: string): Promise<CustomerDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Customer not found.');
    return CustomerDto.from(entity);
  }

  // Updates a customer
  async update(id: string, data: UpdateCustomerDto): Promise<CustomerDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Customer not found.');

    const entity = await this.repository.update(id, data);
    this.logger.log(`Updated customer: ${entity.name} (${entity.id})`);
    return CustomerDto.from(entity);
  }

  // Deletes a customer if not referenced by orders
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Customer not found.');

    const refs = await this.repository.countReferences(id);
    if (refs.orders > 0) {
      throw new ConflictException({
        label: 'Customer In Use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${refs.orders} order${refs.orders > 1 ? 's' : ''}.`,
      });
    }

    await this.repository.delete(id);
    this.logger.log(`Deleted customer: ${existing.name} (${id})`);
    return { success: true, message: `Customer "${existing.name}" deleted successfully.` };
  }
}

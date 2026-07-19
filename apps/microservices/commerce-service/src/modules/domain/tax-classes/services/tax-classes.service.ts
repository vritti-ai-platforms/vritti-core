import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { taxClasses } from '@/db/schema';
import { TaxClassDto } from '../dto/entity/tax-class.dto';
import { CreateTaxClassDto } from '../dto/request/create-tax-class.dto';
import { UpdateTaxClassDto } from '../dto/request/update-tax-class.dto';
import { TaxClassesDomainRepository } from '../repositories/tax-classes.repository';

@Injectable()
export class TaxClassesDomainService {
  private readonly logger = new Logger(TaxClassesDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: taxClasses.name, type: 'string' },
    code: { column: taxClasses.code, type: 'string' },
    isActive: { column: taxClasses.isActive, type: 'boolean' },
    isSystem: { column: taxClasses.isSystem, type: 'boolean' },
  };

  constructor(private readonly repository: TaxClassesDomainRepository) {}

  // Returns paginated, filtered, and sorted tax classes for the data table
  async findForTable(state: TableViewState): Promise<{ result: TaxClassDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, TaxClassesDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, TaxClassesDomainService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, TaxClassesDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(taxClasses.createdAt)],
      limit,
      offset,
    });

    const dtos = rows.map((row) => TaxClassDto.from(row, !row.isSystem));
    return { result: dtos, count };
  }

  // Returns paginated tax-class options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey || 'code',
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

  // Creates a new tax class, rejecting duplicate codes
  async create(data: CreateTaxClassDto): Promise<CreateResponseDto<TaxClassDto>> {
    const existing = await this.repository.findByCode(data.code);
    if (existing) {
      throw new ConflictException({
        label: 'Code already exists',
        detail: `A tax class with code "${data.code}" already exists.`,
      });
    }

    const entity = await this.repository.create({
      code: data.code,
      name: data.name,
      isActive: data.isActive ?? true,
      isSystem: false,
    });

    this.logger.log(`Created tax class: ${entity.code}`);
    return {
      success: true,
      message: `Tax class "${entity.name}" created successfully.`,
      data: TaxClassDto.from(entity, true),
    };
  }

  // Returns a single tax class by ID
  async findById(id: string): Promise<TaxClassDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Tax class not found.');
    return TaxClassDto.from(entity, !entity.isSystem);
  }

  // Updates a tax class's name and active flag
  async update(id: string, data: Omit<UpdateTaxClassDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Tax class not found.');

    await this.repository.update(id, data);

    this.logger.log(`Updated tax class: ${existing.code} (${id})`);
    return { success: true, message: `Tax class "${data.name ?? existing.name}" updated successfully.` };
  }

  // Deletes a tax class; rejects system rows
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Tax class not found.');
    if (existing.isSystem) {
      throw new ConflictException({
        label: 'System tax class',
        detail: `Cannot delete "${existing.name}" — it is reserved by the system.`,
      });
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted tax class: ${existing.code} (${id})`);
    return { success: true, message: `Tax class "${existing.name}" deleted successfully.` };
  }
}

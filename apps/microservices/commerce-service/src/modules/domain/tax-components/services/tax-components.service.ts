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
import { type TaxAuthorityLevel, taxComponents } from '@/db/schema';
import { TaxComponentDto } from '../dto/entity/tax-component.dto';
import { TaxComponentsRepository } from '../repositories/tax-components.repository';

export interface CreateTaxComponentInput {
  code: string;
  name: string;
  authorityLevel: TaxAuthorityLevel;
  isRecoverable: boolean;
  isWithholding: boolean;
  isActive: boolean;
}

export interface UpdateTaxComponentInput {
  name?: string;
  authorityLevel?: TaxAuthorityLevel;
  isRecoverable?: boolean;
  isWithholding?: boolean;
  isActive?: boolean;
}

@Injectable()
export class TaxComponentsService {
  private readonly logger = new Logger(TaxComponentsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: taxComponents.name, type: 'string' },
    code: { column: taxComponents.code, type: 'string' },
    authorityLevel: { column: taxComponents.authorityLevel, type: 'string' },
    isRecoverable: { column: taxComponents.isRecoverable, type: 'boolean' },
    isWithholding: { column: taxComponents.isWithholding, type: 'boolean' },
    isActive: { column: taxComponents.isActive, type: 'boolean' },
    isSystem: { column: taxComponents.isSystem, type: 'boolean' },
  };

  constructor(private readonly repository: TaxComponentsRepository) {}

  // Returns paginated, filtered, and sorted tax components for the data table
  async findForTable(state: TableViewState): Promise<{ result: TaxComponentDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, TaxComponentsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, TaxComponentsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, TaxComponentsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(taxComponents.createdAt)],
      limit,
      offset,
    });

    const dtos = rows.map((row) => TaxComponentDto.from(row, !row.isSystem));
    return { result: dtos, count };
  }

  // Returns paginated tax-component options for select dropdowns
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

  // Creates a new tax component, rejecting duplicate codes
  async create(data: CreateTaxComponentInput): Promise<CreateResponseDto<TaxComponentDto>> {
    const existing = await this.repository.findByCode(data.code);
    if (existing) {
      throw new ConflictException({
        label: 'Code already exists',
        detail: `A tax component with code "${data.code}" already exists.`,
      });
    }

    const entity = await this.repository.create({
      code: data.code,
      name: data.name,
      authorityLevel: data.authorityLevel,
      isRecoverable: data.isRecoverable,
      isWithholding: data.isWithholding,
      isActive: data.isActive,
      isSystem: false,
    });

    this.logger.log(`Created tax component: ${entity.code}`);
    return {
      success: true,
      message: `Tax component "${entity.name}" created successfully.`,
      data: TaxComponentDto.from(entity, true),
    };
  }

  // Returns a single tax component by ID
  async findById(id: string): Promise<TaxComponentDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Tax component not found.');
    return TaxComponentDto.from(entity, !entity.isSystem);
  }

  // Updates a tax component's editable fields
  async update(id: string, data: UpdateTaxComponentInput): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Tax component not found.');

    await this.repository.update(id, data);

    this.logger.log(`Updated tax component: ${existing.code} (${id})`);
    return { success: true, message: `Tax component "${data.name ?? existing.name}" updated successfully.` };
  }

  // Deletes a tax component; rejects system rows
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Tax component not found.');
    if (existing.isSystem) {
      throw new ConflictException({
        label: 'System tax component',
        detail: `Cannot delete "${existing.name}" — it is reserved by the system.`,
      });
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted tax component: ${existing.code} (${id})`);
    return { success: true, message: `Tax component "${existing.name}" deleted successfully.` };
  }
}

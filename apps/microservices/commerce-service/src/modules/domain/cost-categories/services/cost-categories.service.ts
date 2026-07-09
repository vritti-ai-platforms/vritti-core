import { Injectable, Logger } from '@nestjs/common';
import {
  ConflictException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, asc, desc, ilike, or } from '@vritti/api-sdk/drizzle-orm';
import { type CostCategory, type CostCategoryKind, CostCategoryKindValues, costCategories } from '@/db/schema';
import { CostCategoryDto } from '../dto/entity/cost-category.dto';
import { CostCategoriesRepository } from '../repositories/cost-categories.repository';

export interface CreateCostCategoryInput {
  code: string;
  name: string;
  kind: CostCategoryKind;
}

export interface UpdateCostCategoryInput {
  name?: string;
  isActive?: boolean;
}

@Injectable()
export class CostCategoriesService {
  private readonly logger = new Logger(CostCategoriesService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: costCategories.name, type: 'string' },
    code: { column: costCategories.code, type: 'string' },
    kind: { column: costCategories.kind, type: 'string' },
    isActive: { column: costCategories.isActive, type: 'boolean' },
    isSystem: { column: costCategories.isSystem, type: 'boolean' },
  };

  constructor(private readonly repository: CostCategoriesRepository) {}

  async findForTable(state: TableViewState): Promise<{ result: CostCategoryDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, CostCategoriesService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, CostCategoriesService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, CostCategoriesService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(costCategories.createdAt)],
      limit,
      offset,
    });

    const refCounts = await Promise.all(rows.map((row) => this.repository.countReferences(row.id)));
    const dtos = rows.map((row, i) => CostCategoryDto.from(row, refCounts[i].costRows === 0 && !row.isSystem));
    return { result: dtos, count };
  }

  // Returns all cost categories (with canDelete) for the mobile plain list — by name, searchable on
  // name + code. Bounded set (org-scoped taxonomy), so no pagination.
  async list(search?: string): Promise<CostCategoryDto[]> {
    const where = search
      ? or(ilike(costCategories.name, `%${search}%`), ilike(costCategories.code, `%${search}%`))
      : undefined;
    const { result: rows } = await this.repository.findAllAndCount({
      where,
      orderBy: [asc(costCategories.name)],
      limit: 500,
      offset: 0,
    });
    const refCounts = await Promise.all(rows.map((row) => this.repository.countReferences(row.id)));
    return rows.map((row, i) => CostCategoryDto.from(row, refCounts[i].costRows === 0 && !row.isSystem));
  }

  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey || 'kind',
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

  async create(data: CreateCostCategoryInput): Promise<CreateResponseDto<CostCategoryDto>> {
    if (data.kind === CostCategoryKindValues.ITEM) {
      const existing = await this.repository.findByKind(CostCategoryKindValues.ITEM);
      if (existing) {
        throw new ConflictException({
          label: 'ITEM category already exists',
          detail: `Only one ITEM-kind cost category is allowed per organization. "${existing.name}" already serves that role — edit or deactivate it first.`,
        });
      }
    }

    const entity = await this.repository.create({
      code: data.code.trim(),
      name: data.name.trim(),
      kind: data.kind,
      isActive: true,
      isSystem: false,
    });

    this.logger.log(`Created cost category: ${entity.code} (${entity.kind})`);
    return {
      success: true,
      message: `Cost category "${entity.name}" created.`,
      data: CostCategoryDto.from(entity, true),
    };
  }

  async findById(id: string): Promise<CostCategoryDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Cost category not found.');
    const refs = await this.repository.countReferences(id);
    return CostCategoryDto.from(entity, refs.costRows === 0 && !entity.isSystem);
  }

  async update(id: string, data: UpdateCostCategoryInput): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Cost category not found.');

    const payload: Partial<CostCategory> = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.isActive !== undefined) payload.isActive = data.isActive;

    if (Object.keys(payload).length > 0) {
      await this.repository.update(id, payload);
    }

    this.logger.log(`Updated cost category: ${existing.code} (${id})`);
    return { success: true, message: `Cost category "${data.name ?? existing.name}" updated successfully.` };
  }

  async deactivate(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Cost category not found.');
    if (!existing.isActive) {
      return { success: true, message: `Cost category "${existing.name}" is already inactive.` };
    }
    await this.repository.setActive(id, false);
    this.logger.log(`Deactivated cost category: ${existing.code} (${id})`);
    return { success: true, message: `Cost category "${existing.name}" deactivated.` };
  }

  async activate(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Cost category not found.');
    if (existing.isActive) {
      return { success: true, message: `Cost category "${existing.name}" is already active.` };
    }
    await this.repository.setActive(id, true);
    this.logger.log(`Activated cost category: ${existing.code} (${id})`);
    return { success: true, message: `Cost category "${existing.name}" activated.` };
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Cost category not found.');
    if (existing.isSystem) {
      throw new ConflictException({
        label: 'System category',
        detail: `Cannot delete "${existing.name}" — it is reserved by the system. Deactivate instead.`,
      });
    }
    const refs = await this.repository.countReferences(id);
    if (refs.costRows > 0) {
      throw new ConflictException({
        label: 'Cost category in use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${refs.costRows} cost row${refs.costRows > 1 ? 's' : ''}. Deactivate instead.`,
      });
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted cost category: ${existing.code} (${id})`);
    return { success: true, message: `Cost category "${existing.name}" deleted.` };
  }
}

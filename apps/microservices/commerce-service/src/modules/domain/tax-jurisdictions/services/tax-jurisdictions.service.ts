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
import { and, asc, eq } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type TaxJurisdiction, type TaxJurisdictionLevel, taxJurisdictions } from '@/db/schema';
import { TaxJurisdictionDto } from '../dto/entity/tax-jurisdiction.dto';
import type { TaxJurisdictionCountDto } from '../dto/entity/tax-jurisdiction-count.dto';
import type { TaxJurisdictionTreeDto } from '../dto/entity/tax-jurisdiction-tree.dto';
import type { CreateTaxJurisdictionDto } from '../dto/request/create-tax-jurisdiction.dto';
import type { UpdateTaxJurisdictionDto } from '../dto/request/update-tax-jurisdiction.dto';
import { TaxJurisdictionsDomainRepository } from '../repositories/tax-jurisdictions.repository';

@Injectable()
export class TaxJurisdictionsDomainService {
  private readonly logger = new Logger(TaxJurisdictionsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: taxJurisdictions.name, type: 'string' },
    code: { column: taxJurisdictions.code, type: 'string' },
    level: { column: taxJurisdictions.level, type: 'string' },
    countryCode: { column: taxJurisdictions.countryCode, type: 'string' },
    isActive: { column: taxJurisdictions.isActive, type: 'boolean' },
  };

  constructor(private readonly repository: TaxJurisdictionsDomainRepository) {}

  // Returns total tax-jurisdiction count
  async count(): Promise<TaxJurisdictionCountDto> {
    const count = await this.repository.countAll();
    return { count };
  }

  // Returns tax jurisdictions as a TreeView-compatible hierarchy from pre-ordered CTE rows
  async tree(search?: string): Promise<TaxJurisdictionTreeDto[]> {
    const rows = await this.repository.findHierarchyRows(search?.trim());

    const nodesById = new Map<string, TaxJurisdictionTreeDto>();
    const roots: TaxJurisdictionTreeDto[] = [];

    for (const row of rows) {
      const node: TaxJurisdictionTreeDto = {
        id: row.id,
        name: row.name,
        code: row.code,
        level: row.level as TaxJurisdictionLevel,
      };
      nodesById.set(row.id, node);

      if (row.parentId === null) {
        roots.push(node);
        continue;
      }

      const parent = nodesById.get(row.parentId);
      if (!parent) {
        roots.push(node);
        continue;
      }
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    }

    return roots;
  }

  // Returns paginated child jurisdictions for a given parent ID
  async findChildrenForTable(
    parentId: string,
    state: TableViewState,
  ): Promise<{ result: TaxJurisdictionDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, TaxJurisdictionsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, TaxJurisdictionsDomainService.FIELD_MAP);
    const where = and(eq(taxJurisdictions.parentId, parentId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, TaxJurisdictionsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findChildren({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(taxJurisdictions.name)],
      limit,
      offset,
    });

    const parentIdsWithChildren = await this.repository.findParentIdsWithChildren(rows.map((row) => row.id));

    return {
      result: rows.map((row) => TaxJurisdictionDto.from(row, !parentIdsWithChildren.has(row.id))),
      count,
    };
  }

  // Returns paginated tax-jurisdiction options for select dropdowns
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

  // Creates a new tax jurisdiction, rejecting duplicate codes and validating the parent
  async create(data: CreateTaxJurisdictionDto): Promise<CreateResponseDto<TaxJurisdictionDto>> {
    const existing = await this.repository.findByCode(data.code);
    if (existing) {
      throw new ConflictException({
        label: 'Code already exists',
        detail: `A tax jurisdiction with code "${data.code}" already exists.`,
      });
    }

    if (data.parentId) await this.requireById(data.parentId, 'Parent tax jurisdiction not found.');

    const entity = await this.repository.create({
      code: data.code,
      name: data.name,
      level: data.level,
      parentId: data.parentId ?? null,
      countryCode: data.countryCode.toUpperCase(),
      regionCode: data.regionCode ?? null,
      taxUnion: data.taxUnion ?? null,
      isActive: data.isActive,
    });

    this.logger.log(`Created tax jurisdiction: ${entity.code} (${entity.id})`);
    return {
      success: true,
      message: `Tax jurisdiction "${entity.name}" created successfully.`,
      data: TaxJurisdictionDto.from(entity, true),
    };
  }

  // Returns a single tax jurisdiction by ID
  async findById(id: string): Promise<TaxJurisdictionDto> {
    const entity = await this.repository.findByIdWithParent(id);
    if (!entity) throw new NotFoundException('Tax jurisdiction not found.');
    const hasChildren = await this.repository.hasChildren(id);
    return TaxJurisdictionDto.from(entity, !hasChildren, entity.parentName);
  }

  // Updates a tax jurisdiction's editable fields
  async update(id: string, data: Omit<UpdateTaxJurisdictionDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.requireById(id);

    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new BadRequestException('A tax jurisdiction cannot be its own parent.');
      }
      await this.requireById(data.parentId, 'Parent tax jurisdiction not found.');
    }

    const payload = { ...data };
    if (data.countryCode !== undefined) payload.countryCode = data.countryCode.toUpperCase();
    await this.repository.update(id, payload);

    this.logger.log(`Updated tax jurisdiction: ${existing.code} (${id})`);
    return { success: true, message: `Tax jurisdiction "${data.name ?? existing.name}" updated successfully.` };
  }

  // Deletes a tax jurisdiction; refuses when it still has child jurisdictions
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.requireById(id);
    const hasChildren = await this.repository.hasChildren(id);
    if (hasChildren) {
      throw new ConflictException({
        label: 'Jurisdiction In Use',
        detail: `Cannot delete "${existing.name}" — it still has child jurisdictions. Remove those first.`,
      });
    }

    await this.repository.delete(id);
    this.logger.log(`Deleted tax jurisdiction: ${existing.code} (${id})`);
    return { success: true, message: `Tax jurisdiction "${existing.name}" deleted successfully.` };
  }

  // Loads a tax jurisdiction by ID, throwing if not found
  private async requireById(id: string, message = 'Tax jurisdiction not found.'): Promise<TaxJurisdiction> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException(message);
    return entity;
  }
}

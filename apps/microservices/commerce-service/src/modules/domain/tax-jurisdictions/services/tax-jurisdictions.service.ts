import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, asc, eq } from '@vritti/api-sdk/drizzle-orm';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import { taxJurisdictions } from '@/db/schema';
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

  // Search runs ILIKE, which Postgres enums (level) don't support — so it only covers the text columns
  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    name: TaxJurisdictionsDomainService.FIELD_MAP.name,
    code: TaxJurisdictionsDomainService.FIELD_MAP.code,
  };

  constructor(private readonly repository: TaxJurisdictionsDomainRepository) {}

  // Returns total tax-jurisdiction count
  async count(): Promise<TaxJurisdictionCountDto> {
    const count = await this.repository.countAll();
    return { count };
  }

  // Returns tax jurisdictions as a TreeView hierarchy from pre-ordered CTE rows: states at the top, grouped by country
  async tree(search?: string, country?: string): Promise<TaxJurisdictionTreeDto[]> {
    const rows = await this.repository.findHierarchyRows(search?.trim(), country);

    const nodesById = new Map<string, TaxJurisdictionTreeDto>();
    const roots: TaxJurisdictionTreeDto[] = [];

    for (const row of rows) {
      const node: TaxJurisdictionTreeDto = {
        id: row.id,
        name: row.name,
        code: row.code,
        level: row.level,
        countryCode: row.countryCode,
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
    state: TableState,
  ): Promise<{ result: TaxJurisdictionDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, TaxJurisdictionsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, TaxJurisdictionsDomainService.SEARCH_FIELD_MAP);
    const where = and(eq(taxJurisdictions.parentId, parentId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, TaxJurisdictionsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findDetailsForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(taxJurisdictions.name)],
      limit,
      offset,
    });
    return { result: result.map(TaxJurisdictionDto.from), count };
  }

  // Returns paginated tax-jurisdiction options for select dropdowns, narrowed to one country when given
  findForSelect(query: SelectOptionsQueryDto, options?: { country?: string }): Promise<SelectQueryResult> {
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
      where: options?.country ? { countryCode: options.country } : undefined,
    });
  }

  // Creates a tax jurisdiction under a parent of the same country one level up, rejecting duplicate codes
  async create(data: CreateTaxJurisdictionDto): Promise<CreateResponseDto<TaxJurisdictionDto>> {
    await this.repository.assertCodeFree(data.code);
    const parent = await this.repository.findParentOrThrow({
      level: data.level,
      countryCode: data.countryCode,
      parentId: data.parentId ?? null,
    });

    const entity = await this.repository.create({
      code: data.code,
      name: data.name,
      level: data.level,
      parentId: parent?.id ?? null,
      countryCode: data.countryCode,
      regionCode: data.regionCode ?? null,
      taxUnion: data.taxUnion ?? null,
      isActive: data.isActive,
    });

    this.logger.log(`Created tax jurisdiction: ${entity.code} (${entity.id})`);
    return {
      success: true,
      message: `Tax jurisdiction "${entity.name}" created successfully.`,
      data: TaxJurisdictionDto.from({
        ...entity,
        parentName: parent?.name ?? null,
        hasChildren: false,
        isReferenced: false,
      }),
    };
  }

  // Returns a single tax jurisdiction by ID
  async findById(id: string): Promise<TaxJurisdictionDto> {
    return TaxJurisdictionDto.from(await this.repository.findDetailOrThrow(id));
  }

  // Updates a tax jurisdiction; its level and country stay fixed once children, registrations or parties depend on it
  async update(id: string, data: Omit<UpdateTaxJurisdictionDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findDetailOrThrow(id);
    const placement = {
      level: data.level ?? existing.level,
      countryCode: data.countryCode ?? existing.countryCode,
      parentId: data.parentId === undefined ? existing.parentId : data.parentId,
    };
    this.repository.assertPlacementChangeable(existing, placement);
    await this.repository.findParentOrThrow(placement);

    await this.repository.update(id, data);

    this.logger.log(`Updated tax jurisdiction: ${existing.code} (${id})`);
    return { success: true, message: `Tax jurisdiction "${data.name ?? existing.name}" updated successfully.` };
  }

  // Deletes a tax jurisdiction unless children, registrations or parties still depend on it
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findDetailOrThrow(id);
    this.repository.assertDeletable(existing);

    await this.repository.delete(id);
    this.logger.log(`Deleted tax jurisdiction: ${existing.code} (${id})`);
    return { success: true, message: `Tax jurisdiction "${existing.name}" deleted successfully.` };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import type {
  CreateResponseDto,
  FieldMap,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';
import { FilterProcessor } from '@vritti/api-sdk/database';
import { and, asc, eq } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { catalogs } from '@/db/schema';
import { CatalogDto } from '../dto/entity/catalog.dto';
import type { CreateCatalogDto } from '../dto/request/create-catalog.dto';
import type { UpdateCatalogDto } from '../dto/request/update-catalog.dto';
import { CatalogsDomainRepository } from '../repositories/catalogs.repository';

@Injectable()
export class CatalogsDomainService {
  private readonly logger = new Logger(CatalogsDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    name: { column: catalogs.name, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    isActive: { column: catalogs.isActive, type: 'boolean' },
    taxInclusive: { column: catalogs.taxInclusive, type: 'boolean' },
  };

  constructor(private readonly repository: CatalogsDomainRepository) {}

  // Returns paginated, filtered and sorted catalogs for the data table
  async findForTable(state: TableViewState): Promise<{ result: CatalogDto[]; count: number }> {
    const where = and(
      FilterProcessor.buildWhere(state.filters, CatalogsDomainService.FILTER_FIELD_MAP),
      FilterProcessor.buildSearch(state.search, CatalogsDomainService.SEARCH_FIELD_MAP),
    );
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...CatalogsDomainService.SEARCH_FIELD_MAP,
      ...CatalogsDomainService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = state.pagination;
    const { result: rows, count } = await this.repository.findForTable({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [asc(catalogs.name)],
      limit,
      offset,
    });
    return { result: rows.map((row) => CatalogDto.from(row, row)), count };
  }

  // Catalog options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
      conditions: [eq(catalogs.isActive, true)],
    });
  }

  async findById(id: string): Promise<CatalogDto> {
    const row = await this.requireCatalog(id);
    return CatalogDto.from(row, row);
  }

  async create(data: CreateCatalogDto): Promise<CreateResponseDto<CatalogDto>> {
    await this.assertNameFree(data.name);
    const created = await this.repository.create({
      name: data.name,
      ownerLegalEntityId: data.ownerLegalEntityId ?? null,
      taxInclusive: data.taxInclusive ?? false,
    });
    this.logger.log(`Created catalog ${created.name} (${created.id})`);
    return { success: true, message: `"${created.name}" created.`, data: CatalogDto.from(created) };
  }

  async update(id: string, data: Omit<UpdateCatalogDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.requireCatalog(id);
    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) await this.assertNameFree(data.name);
    // isActive only hides a catalog from selectors, so retiring one that still lists items would leave
    // those listings selling with no way to reach the catalog again
    if (data.isActive === false && existing.items > 0) {
      throw new ConflictException({
        label: 'Catalog In Use',
        detail: `"${existing.name}" still lists ${pluralize('listing', existing.items, true)}. Remove them before deactivating it.`,
      });
    }
    await this.repository.update(id, data);
    return { success: true, message: `"${data.name ?? existing.name}" updated.` };
  }

  // Deleting cascades into listings and prices, so it is refused while the catalog still has any
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.requireCatalog(id);
    if (existing.items > 0) {
      throw new ConflictException({
        label: 'Catalog In Use',
        detail: `"${existing.name}" still lists ${pluralize('listing', existing.items, true)}. Remove them first.`,
      });
    }
    await this.repository.deleteById(id);
    return { success: true, message: `"${existing.name}" deleted.` };
  }

  private async assertNameFree(name: string): Promise<void> {
    const clash = await this.repository.findByName(name);
    if (clash) {
      throw new ConflictException({ label: 'Duplicate Catalog', detail: `"${name}" already exists.` });
    }
  }

  private async requireCatalog(id: string) {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Catalog not found.');
    return row;
  }
}

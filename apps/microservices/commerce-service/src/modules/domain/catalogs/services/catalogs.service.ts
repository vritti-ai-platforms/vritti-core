import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
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
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { type Catalog, catalogs } from '@/db/schema';
import { CatalogDto } from '../dto/entity/catalog.dto';
import type { CreateCatalogDto } from '../dto/request/create-catalog.dto';
import type { UpdateCatalogDto } from '../dto/request/update-catalog.dto';
import { CatalogsDomainRepository } from '../repositories/catalogs.repository';

@Injectable()
export class CatalogsDomainService {
  private readonly logger = new Logger(CatalogsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: catalogs.name, type: 'string' },
    isActive: { column: catalogs.isActive, type: 'boolean' },
  };

  constructor(
    private readonly repository: CatalogsDomainRepository,
    private readonly catalogChannelsService: CatalogChannelsDomainService,
  ) {}

  // Returns paginated, filtered, and sorted catalogs for the data table
  async findForTable(state: TableViewState): Promise<{ result: CatalogDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, CatalogsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, CatalogsDomainService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, CatalogsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(catalogs.createdAt)],
      limit,
      offset,
    });

    const counts = await this.catalogChannelsService.findCountsByCatalogIds(result.map((row) => row.id));

    return {
      result: result.map((row) => CatalogDto.from(row, counts.get(row.id) ?? 0)),
      count,
    };
  }

  // Returns paginated catalog options for select dropdowns
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

  // Creates a catalog and maps its channels; a channel conflict rejects the whole create
  async create(data: CreateCatalogDto): Promise<CreateResponseDto<CatalogDto>> {
    const entity = await this.repository.create({
      name: data.name,
      currencyCode: data.currencyCode,
      taxInclusive: data.taxInclusive ?? false,
      isActive: data.isActive ?? true,
    });

    if (data.channelIds?.length) {
      await this.catalogChannelsService.setChannels(entity.id, entity.siteId, data.channelIds);
    }

    this.logger.log(`Created catalog: ${entity.id}`);
    return {
      success: true,
      message: `Catalog "${entity.name}" created successfully.`,
      data: CatalogDto.from(entity),
    };
  }

  // Returns a single catalog by ID
  async findById(id: string): Promise<CatalogDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Catalog not found.');
    const counts = await this.catalogChannelsService.findCountsByCatalogIds([id]);
    return CatalogDto.from(entity, counts.get(id) ?? 0);
  }

  // Updates a catalog's name, tax-inclusive flag, and active flag
  async update(id: string, data: UpdateCatalogDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Catalog not found.');

    const payload: Partial<Catalog> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.taxInclusive !== undefined) payload.taxInclusive = data.taxInclusive;
    if (data.isActive !== undefined) payload.isActive = data.isActive;

    if (Object.keys(payload).length > 0) {
      await this.repository.update(id, payload);
    }

    if (data.channelIds !== undefined) {
      await this.catalogChannelsService.setChannels(id, existing.siteId, data.channelIds);
    }

    this.logger.log(`Updated catalog: ${id}`);
    return { success: true, message: 'Catalog updated successfully.' };
  }

  // Deletes a catalog (cascades to its offerings and modifier groups)
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Catalog not found.');
    await this.repository.delete(id);
    this.logger.log(`Deleted catalog: ${id}`);
    return { success: true, message: 'Catalog deleted successfully.' };
  }

  // Deep-copies a source catalog into a new catalog with no channel assignments
  async clone(sourceCatalogId: string): Promise<CreateResponseDto<CatalogDto>> {
    const source = await this.repository.findById(sourceCatalogId);
    if (!source) throw new NotFoundException('Catalog not found.');

    const entity = await this.repository.cloneCatalog(source);
    this.logger.log(`Cloned catalog ${sourceCatalogId} -> ${entity.id}`);
    return {
      success: true,
      message: `Catalog "${entity.name}" cloned successfully.`,
      data: CatalogDto.from(entity),
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and, asc, eq } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk/select';
import { catalogs } from '@/db/schema';
import { CatalogDto } from '../dto/entity/catalog.dto';
import { CatalogChannelDto } from '../dto/entity/catalog-channel.dto';
import { CatalogCurrencyDto } from '../dto/entity/catalog-currency.dto';
import type { CreateCatalogDto } from '../dto/request/create-catalog.dto';
import type { UpdateCatalogDto } from '../dto/request/update-catalog.dto';
import { CatalogCurrenciesDomainRepository } from '../repositories/catalog-currencies.repository';
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

  constructor(
    private readonly repository: CatalogsDomainRepository,
    private readonly currencies: CatalogCurrenciesDomainRepository,
  ) {}

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

  // Every channel carrying this catalog — the read-only tab on the catalog detail
  async findChannels(catalogId: string): Promise<CatalogChannelDto[]> {
    const rows = await this.repository.findChannels(catalogId);
    return rows.map((row) => CatalogChannelDto.from(row));
  }

  async findById(id: string): Promise<CatalogDto> {
    const row = await this.requireCatalog(id);
    return CatalogDto.from(row, row, await this.findCurrencies(id));
  }

  async create(data: CreateCatalogDto): Promise<CreateResponseDto<CatalogDto>> {
    await this.assertNameFree(data.name);
    const created = await this.repository.create({
      name: data.name,
      taxInclusive: data.taxInclusive ?? false,
    });
    this.logger.log(`Created catalog ${created.name} (${created.id})`);
    // Created here, so this workspace owns it — no need to read the ownership test back
    return {
      success: true,
      message: `"${created.name}" created.`,
      data: CatalogDto.from(created, { isOwned: true }),
    };
  }

  async update(id: string, data: Omit<UpdateCatalogDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.requireCatalog(id);
    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) await this.assertNameFree(data.name);
    // isActive only hides a catalog from selectors, so retiring one that still lists items would leave those listings
    // reachable with no way to reach the catalog again
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

  // Which currencies this catalog may be priced in, in the order they are offered
  async findCurrencies(catalogId: string): Promise<string[]> {
    const rows = await this.currencies.findForCatalog(catalogId);
    return rows.map((row) => row.currencyCode);
  }

  // The cards on the Prices tab: each declared currency and how much of the catalog it actually covers
  async findCurrencyCoverage(catalogId: string): Promise<CatalogCurrencyDto[]> {
    const catalog = await this.requireCatalog(catalogId);
    const rows = await this.currencies.findCoverage(catalogId);
    return rows.map((row) => CatalogCurrencyDto.from(row, catalog.items));
  }

  // Offers a currency on this price list.
  // Offers a currency on this price list. Nothing is priced by it yet — the Prices tab fills that in.
  async addCurrency(catalogId: string, currencyCode: string): Promise<SuccessResponseDto> {
    const catalog = await this.requireCatalog(catalogId);
    await this.currencies.addForCatalog(catalogId, currencyCode);
    this.logger.log(`Catalog ${catalog.name} now prices in ${currencyCode}`);
    return { success: true, message: `"${catalog.name}" can now be priced in ${currencyCode}.` };
  }

  // Withdrawing a currency makes its prices unreachable, so it is refused while any exist rather than cascading — a
  // price list is too expensive to lose to a mis-click.
  async removeCurrency(catalogId: string, currencyCode: string): Promise<SuccessResponseDto> {
    const catalog = await this.requireCatalog(catalogId);
    const [priced] = await this.currencies.countPrices(catalogId, [currencyCode]);
    if (priced && priced.count > 0) {
      throw new ConflictException({
        label: 'Currency In Use',
        detail: `${currencyCode} still prices ${pluralize('listing', priced.count, true)} in "${catalog.name}". Clear those prices before removing it.`,
      });
    }

    const removed = await this.currencies.removeForCatalog(catalogId, currencyCode);
    if (removed === 0) throw new NotFoundException(`"${catalog.name}" does not price in ${currencyCode}.`);
    return { success: true, message: `${currencyCode} removed from "${catalog.name}".` };
  }

  private async assertNameFree(name: string): Promise<void> {
    const clash = await this.repository.findByName(name);
    if (clash) {
      throw new ConflictException({ label: 'Duplicate Catalog', detail: `"${name}" already exists.` });
    }
  }

  private async requireCatalog(id: string) {
    const row = await this.repository.findByIdWithCounts(id);
    if (!row) throw new NotFoundException('Catalog not found.');
    return row;
  }
}

import type { CatalogChannelResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import type { AddCatalogListingDto } from '@commerce/catalogs/dto/request/add-catalog-listing.dto';
import type { AddCatalogListingsBatchDto } from '@commerce/catalogs/dto/request/add-catalog-listings-batch.dto';
import type {
  BulkRemoveCatalogListingsDto,
  BulkSetCatalogListingAvailabilityDto,
  BulkSetCatalogListingPriceDto,
} from '@commerce/catalogs/dto/request/bulk-catalog-listings.dto';
import type { CreateCatalogDto } from '@commerce/catalogs/dto/request/create-catalog.dto';
import type { SetCatalogListingPriceDto } from '@commerce/catalogs/dto/request/set-catalog-listing-price.dto';
import type { UpdateCatalogDto } from '@commerce/catalogs/dto/request/update-catalog.dto';
import type { CatalogCurrencyResponseDto } from '@commerce/catalogs/dto/response/catalog-currency-response.dto';
import type { CatalogListingResponseDto } from '@commerce/catalogs/dto/response/catalog-listing-response.dto';
import type { CatalogListingTableResponseDto } from '@commerce/catalogs/dto/response/catalog-listing-table-response.dto';
import type { CatalogResponseDto } from '@commerce/catalogs/dto/response/catalog-response.dto';
import type { CatalogTableResponseDto } from '@commerce/catalogs/dto/response/catalog-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

const CATALOGS_TABLE_SLUG = 'commerce-site-catalogs';
const CATALOG_LISTINGS_TABLE_SLUG = (catalogId: string) => `commerce-site-catalog-${catalogId}-items`;
const CATALOG_PRICES_TABLE_SLUG = (catalogId: string) => `commerce-site-catalog-${catalogId}-prices`;

@Injectable()
export class SiteCatalogsGatewayService {
  private readonly logger = new Logger(SiteCatalogsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // Returns paginated, filtered and sorted catalogs for the data table
  async findForTable(orgId: string, userId: string): Promise<CatalogTableResponseDto> {
    this.logger.log('site.catalogs.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, CATALOGS_TABLE_SLUG);
    const { result, count } = await this.nats.send<{ result: CatalogResponseDto[]; count: number }>(
      'commerce',
      'site.catalogs.table',
      state,
    );
    // commerce stores only the owning ids; the names live in core
    return { result: await this.ownerNames.resolve(orgId, result), count, state, activeViewId };
  }

  async findById(orgId: string, id: string): Promise<CatalogResponseDto> {
    this.logger.log(`site.catalogs.findById — id: ${id}`);
    const catalog = await this.nats.send<CatalogResponseDto>('commerce', 'site.catalogs.findById', { id });
    const [withOwner] = await this.ownerNames.resolve(orgId, [catalog]);
    return withOwner;
  }

  async create(dto: CreateCatalogDto): Promise<CreateResponseDto<CatalogResponseDto>> {
    this.logger.log(`site.catalogs.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'site.catalogs.create', dto);
  }

  async update(id: string, dto: UpdateCatalogDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogs.update — id: ${id}`);
    return this.nats.send('commerce', 'site.catalogs.update', { id, ...dto });
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogs.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.catalogs.delete', { id });
  }

  // The currencies this catalog prices in, each with how much of it it covers
  async findCurrencies(catalogId: string): Promise<CatalogCurrencyResponseDto[]> {
    this.logger.log(`site.catalogs.currencies — catalogId: ${catalogId}`);
    return this.nats.send('commerce', 'site.catalogs.currencies', { catalogId });
  }

  async addCurrency(catalogId: string, currencyCode: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogs.currencies.add — catalogId: ${catalogId}, currency: ${currencyCode}`);
    return this.nats.send('commerce', 'site.catalogs.currencies.add', { catalogId, currencyCode });
  }

  async removeCurrency(catalogId: string, currencyCode: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogs.currencies.remove — catalogId: ${catalogId}, currency: ${currencyCode}`);
    return this.nats.send('commerce', 'site.catalogs.currencies.remove', { catalogId, currencyCode });
  }

  // Returns paginated listings of one catalog, each with its prices.
  async findListingsForTable(
    orgId: string,
    catalogId: string,
    userId: string,
    currencyCode?: string,
  ): Promise<CatalogListingTableResponseDto> {
    this.logger.log(`site.catalogs.listings.table — catalogId: ${catalogId}, currency: ${currencyCode ?? 'all'}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      currencyCode ? CATALOG_PRICES_TABLE_SLUG(catalogId) : CATALOG_LISTINGS_TABLE_SLUG(catalogId),
    );
    const { result, count } = await this.nats.send<{ result: CatalogListingResponseDto[]; count: number }>(
      'commerce',
      'site.catalogs.listings.table',
      { catalogId, state, currencyCode },
    );
    const rows = await this.ownerNames.resolve(orgId, result);
    return { result: await this.namePriceOwners(orgId, rows), count, state, activeViewId };
  }

  async addListing(
    catalogId: string,
    dto: AddCatalogListingDto,
  ): Promise<CreateResponseDto<CatalogListingResponseDto>> {
    this.logger.log(`site.catalogs.listings.add — catalogId: ${catalogId}, variantId: ${dto.offeringVariantId}`);
    return this.nats.send('commerce', 'site.catalogs.listings.add', { catalogId, ...dto });
  }

  // Lists several variants at once — one call, because a loop of single adds half-applies on the first refusal
  async addListings(
    catalogId: string,
    dto: AddCatalogListingsBatchDto,
  ): Promise<CreateResponseDto<CatalogListingResponseDto[]>> {
    this.logger.log(`site.catalogs.listings.addBatch — catalogId: ${catalogId}, items: ${dto.items.length}`);
    return this.nats.send('commerce', 'site.catalogs.listings.addBatch', { catalogId, ...dto });
  }

  async setListingPrice(listingId: string, dto: SetCatalogListingPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogs.listings.setPrice — listingId: ${listingId}`);
    return this.nats.send('commerce', 'site.catalogs.listings.setPrice', { catalogListingId: listingId, ...dto });
  }

  async clearListingPrice(listingId: string, currencyCode: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogs.listings.clearPrice — listingId: ${listingId}, currency: ${currencyCode}`);
    return this.nats.send('commerce', 'site.catalogs.listings.clearPrice', {
      catalogListingId: listingId,
      currencyCode,
    });
  }

  // Every channel carrying this catalog — read-only on the catalog detail
  async findChannels(catalogId: string): Promise<CatalogChannelResponseDto[]> {
    this.logger.log(`site.catalogs.channels — catalogId: ${catalogId}`);
    return this.nats.send('commerce', 'site.catalogs.channels', { catalogId });
  }

  async setListingChannelVisibility(
    listingId: string,
    channelId: string,
    visible: boolean,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogs.listings.setChannelVisibility — listingId: ${listingId}, visible: ${visible}`);
    return this.nats.send('commerce', 'site.catalogs.listings.setChannelVisibility', {
      id: listingId,
      catalogChannelId: channelId,
      visible,
    });
  }

  async bulkRemoveListings(catalogId: string, dto: BulkRemoveCatalogListingsDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogs.listings.bulkDelete — ${dto.ids.length} selected`);
    return this.nats.send('commerce', 'site.catalogs.listings.bulkDelete', { catalogId, ids: dto.ids });
  }

  async bulkSetListingPrice(catalogId: string, dto: BulkSetCatalogListingPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogs.listings.bulkSetPrice — ${dto.ids.length} selected`);
    return this.nats.send('commerce', 'site.catalogs.listings.bulkSetPrice', {
      catalogId,
      ids: dto.ids,
      price: dto.price,
    });
  }

  async bulkSetListingAvailability(
    catalogId: string,
    dto: BulkSetCatalogListingAvailabilityDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogs.listings.bulkSetAvailability — ${dto.ids.length} selected`);
    return this.nats.send('commerce', 'site.catalogs.listings.bulkSetAvailability', {
      catalogId,
      ids: dto.ids,
      channelIds: dto.channelIds,
      visible: dto.visible,
    });
  }

  async deleteListing(listingId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogs.listings.delete — listingId: ${listingId}`);
    return this.nats.send('commerce', 'site.catalogs.listings.delete', { id: listingId });
  }

  // A price carries the workspace that set it, so an inherited one can say whose it is
  private async namePriceOwners(
    orgId: string,
    rows: CatalogListingResponseDto[],
  ): Promise<CatalogListingResponseDto[]> {
    const prices = rows.flatMap((row) => row.prices);
    if (prices.length === 0) return rows;

    const named = await this.ownerNames.resolve(orgId, prices);
    const byId = new Map(named.map((price) => [price.id, price.ownerName]));
    return rows.map((row) => ({
      ...row,
      prices: row.prices.map((price) => ({ ...price, ownerName: byId.get(price.id) ?? 'Organization' })),
    }));
  }
}

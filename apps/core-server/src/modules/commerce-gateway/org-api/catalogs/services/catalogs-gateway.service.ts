import type { CatalogChannelResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import type { AddCatalogListingDto } from '@commerce/catalogs/dto/request/add-catalog-listing.dto';
import type { CreateCatalogDto } from '@commerce/catalogs/dto/request/create-catalog.dto';
import type { SetCatalogListingPriceDto } from '@commerce/catalogs/dto/request/set-catalog-listing-price.dto';
import type { UpdateCatalogDto } from '@commerce/catalogs/dto/request/update-catalog.dto';
import type { CatalogCurrencyResponseDto } from '@commerce/catalogs/dto/response/catalog-currency-response.dto';
import type {
  CatalogListingMrpOptionResponseDto,
  CatalogListingResponseDto,
} from '@commerce/catalogs/dto/response/catalog-listing-response.dto';
import type { CatalogListingTableResponseDto } from '@commerce/catalogs/dto/response/catalog-listing-table-response.dto';
import type { CatalogResponseDto } from '@commerce/catalogs/dto/response/catalog-response.dto';
import type { CatalogTableResponseDto } from '@commerce/catalogs/dto/response/catalog-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

const CATALOGS_TABLE_SLUG = 'commerce-org-catalogs';
const CATALOG_LISTINGS_TABLE_SLUG = (catalogId: string) => `commerce-org-catalog-${catalogId}-items`;
const CATALOG_PRICES_TABLE_SLUG = (catalogId: string) => `commerce-org-catalog-${catalogId}-prices`;

export interface CatalogListingPayload {
  id: string;
  offeringVariantId: string;
  code: string;
  variantName: string;
  isActive: boolean;
  prices: { price: { currency: string; value: string } }[];
}

export interface StorefrontListing {
  id: string;
  offeringVariantId: string;
  code: string;
  name: string;
  price: { currency: string; value: string } | null;
}

@Injectable()
export class CatalogsGatewayService {
  private readonly logger = new Logger(CatalogsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // Returns paginated, filtered and sorted catalogs for the data table
  async findForTable(orgId: string, userId: string): Promise<CatalogTableResponseDto> {
    this.logger.log('org.catalogs.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, CATALOGS_TABLE_SLUG);
    const { result, count } = await this.nats.send<{ result: CatalogResponseDto[]; count: number }>(
      'commerce',
      'org.catalogs.table',
      state,
    );
    // commerce stores only the owning ids; the names live in core
    return { result: await this.ownerNames.resolve(orgId, result), count, state, activeViewId };
  }

  async findById(orgId: string, id: string): Promise<CatalogResponseDto> {
    this.logger.log(`org.catalogs.findById — id: ${id}`);
    const catalog = await this.nats.send<CatalogResponseDto>('commerce', 'org.catalogs.findById', { id });
    const [withOwner] = await this.ownerNames.resolve(orgId, [catalog]);
    return withOwner;
  }

  async create(dto: CreateCatalogDto): Promise<CreateResponseDto<CatalogResponseDto>> {
    this.logger.log(`org.catalogs.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'org.catalogs.create', dto);
  }

  async update(id: string, dto: UpdateCatalogDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.catalogs.update — id: ${id}`);
    return this.nats.send('commerce', 'org.catalogs.update', { id, ...dto });
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.catalogs.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.catalogs.delete', { id });
  }

  // The currencies this catalog prices in, each with how much of it it covers
  async findCurrencies(catalogId: string): Promise<CatalogCurrencyResponseDto[]> {
    this.logger.log(`org.catalogs.currencies — catalogId: ${catalogId}`);
    return this.nats.send('commerce', 'org.catalogs.currencies', { catalogId });
  }

  async addCurrency(catalogId: string, currencyCode: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.catalogs.currencies.add — catalogId: ${catalogId}, currency: ${currencyCode}`);
    return this.nats.send('commerce', 'org.catalogs.currencies.add', { catalogId, currencyCode });
  }

  async removeCurrency(catalogId: string, currencyCode: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.catalogs.currencies.remove — catalogId: ${catalogId}, currency: ${currencyCode}`);
    return this.nats.send('commerce', 'org.catalogs.currencies.remove', { catalogId, currencyCode });
  }

  // Returns paginated listings of one catalog, each with its prices.
  async findListingsForTable(
    orgId: string,
    catalogId: string,
    userId: string,
    currencyCode?: string,
  ): Promise<CatalogListingTableResponseDto> {
    this.logger.log(`org.catalogs.listings.table — catalogId: ${catalogId}, currency: ${currencyCode ?? 'all'}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      currencyCode ? CATALOG_PRICES_TABLE_SLUG(catalogId) : CATALOG_LISTINGS_TABLE_SLUG(catalogId),
    );
    const { result, count } = await this.nats.send<{ result: CatalogListingResponseDto[]; count: number }>(
      'commerce',
      'org.catalogs.listings.table',
      { catalogId, state, currencyCode },
    );
    const rows = await this.ownerNames.resolve(orgId, result);
    return { result: await this.namePriceOwners(orgId, rows), count, state, activeViewId };
  }

  // The MRP slices a variant can be listed at, for the add-listing picker
  async findMrpOptions(offeringVariantId: string): Promise<CatalogListingMrpOptionResponseDto[]> {
    this.logger.log(`org.catalogs.listings.mrpOptions — variantId: ${offeringVariantId}`);
    return this.nats.send('commerce', 'org.catalogs.listings.mrpOptions', { offeringVariantId });
  }

  async addListing(
    catalogId: string,
    dto: AddCatalogListingDto,
  ): Promise<CreateResponseDto<CatalogListingResponseDto>> {
    this.logger.log(`org.catalogs.listings.add — catalogId: ${catalogId}, variantId: ${dto.offeringVariantId}`);
    return this.nats.send('commerce', 'org.catalogs.listings.add', { catalogId, ...dto });
  }

  async setListingPrice(listingId: string, dto: SetCatalogListingPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.catalogs.listings.setPrice — listingId: ${listingId}`);
    return this.nats.send('commerce', 'org.catalogs.listings.setPrice', { catalogListingId: listingId, ...dto });
  }

  async clearListingPrice(listingId: string, currencyCode: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.catalogs.listings.clearPrice — listingId: ${listingId}, currency: ${currencyCode}`);
    return this.nats.send('commerce', 'org.catalogs.listings.clearPrice', {
      catalogListingId: listingId,
      currencyCode,
    });
  }

  // Every channel carrying this catalog — read-only on the catalog detail
  async findChannels(catalogId: string): Promise<CatalogChannelResponseDto[]> {
    this.logger.log(`org.catalogs.channels — catalogId: ${catalogId}`);
    return this.nats.send('commerce', 'org.catalogs.channels', { catalogId });
  }

  async setListingChannelVisibility(
    listingId: string,
    channelId: string,
    visible: boolean,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`org.catalogs.listings.setChannelVisibility — listingId: ${listingId}, visible: ${visible}`);
    return this.nats.send('commerce', 'org.catalogs.listings.setChannelVisibility', {
      id: listingId,
      catalogChannelId: channelId,
      visible,
    });
  }

  async deleteListing(listingId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.catalogs.listings.delete — listingId: ${listingId}`);
    return this.nats.send('commerce', 'org.catalogs.listings.delete', { id: listingId });
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

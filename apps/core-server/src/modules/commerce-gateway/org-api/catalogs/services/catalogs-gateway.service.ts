import type { CatalogChannelResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import type { AddCatalogListingDto } from '@commerce/catalogs/dto/request/add-catalog-listing.dto';
import type { CreateCatalogDto } from '@commerce/catalogs/dto/request/create-catalog.dto';
import type { SetCatalogListingPriceDto } from '@commerce/catalogs/dto/request/set-catalog-listing-price.dto';
import type { UpdateCatalogDto } from '@commerce/catalogs/dto/request/update-catalog.dto';
import type {
  CatalogListingMrpOptionResponseDto,
  CatalogListingResponseDto,
} from '@commerce/catalogs/dto/response/catalog-listing-response.dto';
import type { CatalogListingTableResponseDto } from '@commerce/catalogs/dto/response/catalog-listing-table-response.dto';
import type { CatalogResponseDto } from '@commerce/catalogs/dto/response/catalog-response.dto';
import type { CatalogTableResponseDto } from '@commerce/catalogs/dto/response/catalog-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

const CATALOGS_TABLE_SLUG = 'commerce-org-catalogs';
const CATALOG_LISTINGS_TABLE_SLUG = (catalogId: string) => `commerce-org-catalog-${catalogId}-items`;

/** One sellable line of a storefront's range, as the site sees it. */
export interface CatalogListingPayload {
  id: string;
  offeringVariantId: string;
  sku: string | null;
  variantName: string | null;
  isActive: boolean;
  prices: { price: { currency: string; value: string } }[];
}

/** One listing as a storefront shows it — a single price, already chosen for its scope. */
export interface StorefrontListing {
  id: string;
  offeringVariantId: string;
  sku: string | null;
  name: string | null;
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

  // Returns paginated listings of one catalog, each with its prices
  async findListingsForTable(
    orgId: string,
    catalogId: string,
    userId: string,
  ): Promise<CatalogListingTableResponseDto> {
    this.logger.log(`org.catalogs.listings.table — catalogId: ${catalogId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      CATALOG_LISTINGS_TABLE_SLUG(catalogId),
    );
    const { result, count } = await this.nats.send<{ result: CatalogListingResponseDto[]; count: number }>(
      'commerce',
      'org.catalogs.listings.table',
      { catalogId, state },
    );
    // commerce stores only the owning ids; the names live in core
    return { result: await this.ownerNames.resolve(orgId, result), count, state, activeViewId };
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

  // Every channel selling this catalog — read-only on the catalog detail
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

  /**
   * Everything an org-wide website sells: the org's APP channel, the organization-wide price row.
   *
   * Reached through the credential's own APP channel, so a website can only ever read the range it
   * was given — there is no argument naming a catalogue.
   */
  async findStorefrontListings(appId: string): Promise<StorefrontListing[]> {
    const resolution = await this.nats.send<{ catalog: { catalogId: string; channelId: string } | null }>(
      'commerce',
      'org.catalogChannels.resolve',
      { type: 'APP', appId },
    );
    if (!resolution?.catalog) {
      throw new NotFoundException({
        label: 'Store Not Configured',
        detail: 'This store has no catalogue assigned yet.',
      });
    }
    const { catalogId, channelId } = resolution.catalog;

    this.logger.log(`org.catalogs.listings.forChannel — channelId: ${channelId}`);
    const rows = await this.nats.send<CatalogListingPayload[]>('commerce', 'org.catalogs.listings.forChannel', {
      channelId,
      catalogId,
    });
    // The wire shape flattens the price list to the one row this storefront shows.
    return rows.map((row) => ({
      id: row.id,
      offeringVariantId: row.offeringVariantId,
      sku: row.sku ?? null,
      name: row.variantName ?? null,
      price: row.prices[0]?.price ?? null,
    }));
  }
}

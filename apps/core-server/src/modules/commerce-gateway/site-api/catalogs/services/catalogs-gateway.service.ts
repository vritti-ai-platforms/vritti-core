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
import type { CatalogListing } from '../../../org-api/catalogs/graphql/catalog-listing.type';

const CATALOGS_TABLE_SLUG = 'commerce-site-catalogs';
const CATALOG_LISTINGS_TABLE_SLUG = (catalogId: string) => `commerce-site-catalog-${catalogId}-items`;

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

  // Returns paginated listings of one catalog, each with its prices
  async findListingsForTable(
    orgId: string,
    catalogId: string,
    userId: string,
  ): Promise<CatalogListingTableResponseDto> {
    this.logger.log(`site.catalogs.listings.table — catalogId: ${catalogId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      CATALOG_LISTINGS_TABLE_SLUG(catalogId),
    );
    const { result, count } = await this.nats.send<{ result: CatalogListingResponseDto[]; count: number }>(
      'commerce',
      'site.catalogs.listings.table',
      { catalogId, state },
    );
    // commerce stores only the owning ids; the names live in core
    return { result: await this.ownerNames.resolve(orgId, result), count, state, activeViewId };
  }

  // The MRP slices a variant can be listed at, for the add-listing picker
  async findMrpOptions(offeringVariantId: string): Promise<CatalogListingMrpOptionResponseDto[]> {
    this.logger.log(`site.catalogs.listings.mrpOptions — variantId: ${offeringVariantId}`);
    return this.nats.send('commerce', 'site.catalogs.listings.mrpOptions', { offeringVariantId });
  }

  async addListing(
    catalogId: string,
    dto: AddCatalogListingDto,
  ): Promise<CreateResponseDto<CatalogListingResponseDto>> {
    this.logger.log(`site.catalogs.listings.add — catalogId: ${catalogId}, variantId: ${dto.offeringVariantId}`);
    return this.nats.send('commerce', 'site.catalogs.listings.add', { catalogId, ...dto });
  }

  async setListingPrice(listingId: string, dto: SetCatalogListingPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogs.listings.setPrice — listingId: ${listingId}`);
    return this.nats.send('commerce', 'site.catalogs.listings.setPrice', { catalogListingId: listingId, ...dto });
  }

  // Every channel selling this catalog — read-only on the catalog detail
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

  async deleteListing(listingId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogs.listings.delete — listingId: ${listingId}`);
    return this.nats.send('commerce', 'site.catalogs.listings.delete', { id: listingId });
  }

  /**
   * Everything an outlet's customer website sells: the site's own APP channel and its own price first.
   *
   * The APP channel is resolved for this app at this site, so the website reads the range it was
   * given and no other — there is no argument naming a catalogue.
   */
  async findStorefrontListings(appId: string, siteId: string): Promise<CatalogListing[]> {
    const resolution = await this.nats.send<{ catalog: { catalogId: string; channelId: string } | null }>(
      'commerce',
      'org.catalogChannels.resolve',
      { type: 'APP', appId },
    );
    if (!resolution?.catalog) {
      throw new NotFoundException({
        label: 'Store Not Configured',
        detail: 'This outlet has no catalogue assigned to its website yet.',
      });
    }
    const { catalogId, channelId } = resolution.catalog;

    this.logger.log(`org.catalogs.listings.forChannel — channelId: ${channelId}, site: ${siteId}`);
    const rows = await this.nats.send<
      {
        id: string;
        offeringVariantId: string;
        sku: string | null;
        variantName: string | null;
        prices: { price: { currency: string; value: string } }[];
      }[]
    >('commerce', 'org.catalogs.listings.forChannel', { channelId, catalogId, siteId });

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

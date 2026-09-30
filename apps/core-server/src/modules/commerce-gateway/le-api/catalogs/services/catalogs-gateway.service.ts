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

const CATALOGS_TABLE_SLUG = 'commerce-le-catalogs';
const CATALOG_LISTINGS_TABLE_SLUG = (catalogId: string) => `commerce-le-catalog-${catalogId}-items`;

@Injectable()
export class LeCatalogsGatewayService {
  private readonly logger = new Logger(LeCatalogsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // Returns paginated, filtered and sorted catalogs for the data table
  async findForTable(orgId: string, userId: string): Promise<CatalogTableResponseDto> {
    this.logger.log('le.catalogs.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, CATALOGS_TABLE_SLUG);
    const { result, count } = await this.nats.send<{ result: CatalogResponseDto[]; count: number }>(
      'commerce',
      'le.catalogs.table',
      state,
    );
    // commerce stores only the owning ids; the names live in core
    return { result: await this.ownerNames.resolve(orgId, result), count, state, activeViewId };
  }

  async findById(orgId: string, id: string): Promise<CatalogResponseDto> {
    this.logger.log(`le.catalogs.findById — id: ${id}`);
    const catalog = await this.nats.send<CatalogResponseDto>('commerce', 'le.catalogs.findById', { id });
    const [withOwner] = await this.ownerNames.resolve(orgId, [catalog]);
    return withOwner;
  }

  async create(dto: CreateCatalogDto): Promise<CreateResponseDto<CatalogResponseDto>> {
    this.logger.log(`le.catalogs.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'le.catalogs.create', dto);
  }

  async update(id: string, dto: UpdateCatalogDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.catalogs.update — id: ${id}`);
    return this.nats.send('commerce', 'le.catalogs.update', { id, ...dto });
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.catalogs.delete — id: ${id}`);
    return this.nats.send('commerce', 'le.catalogs.delete', { id });
  }

  // Returns paginated listings of one catalog, each with its prices
  async findListingsForTable(
    orgId: string,
    catalogId: string,
    userId: string,
  ): Promise<CatalogListingTableResponseDto> {
    this.logger.log(`le.catalogs.listings.table — catalogId: ${catalogId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      CATALOG_LISTINGS_TABLE_SLUG(catalogId),
    );
    const { result, count } = await this.nats.send<{ result: CatalogListingResponseDto[]; count: number }>(
      'commerce',
      'le.catalogs.listings.table',
      { catalogId, state },
    );
    // commerce stores only the owning ids; the names live in core
    return { result: await this.ownerNames.resolve(orgId, result), count, state, activeViewId };
  }

  // The MRP slices a variant can be listed at, for the add-listing picker
  async findMrpOptions(offeringVariantId: string): Promise<CatalogListingMrpOptionResponseDto[]> {
    this.logger.log(`le.catalogs.listings.mrpOptions — variantId: ${offeringVariantId}`);
    return this.nats.send('commerce', 'le.catalogs.listings.mrpOptions', { offeringVariantId });
  }

  async addListing(
    catalogId: string,
    dto: AddCatalogListingDto,
  ): Promise<CreateResponseDto<CatalogListingResponseDto>> {
    this.logger.log(`le.catalogs.listings.add — catalogId: ${catalogId}, variantId: ${dto.offeringVariantId}`);
    return this.nats.send('commerce', 'le.catalogs.listings.add', { catalogId, ...dto });
  }

  async setListingPrice(listingId: string, dto: SetCatalogListingPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.catalogs.listings.setPrice — listingId: ${listingId}`);
    return this.nats.send('commerce', 'le.catalogs.listings.setPrice', { catalogListingId: listingId, ...dto });
  }

  // Every channel selling this catalog — read-only on the catalog detail
  async findChannels(catalogId: string): Promise<CatalogChannelResponseDto[]> {
    this.logger.log(`le.catalogChannels.byCatalog — catalogId: ${catalogId}`);
    return this.nats.send('commerce', 'le.catalogChannels.byCatalog', { catalogId });
  }

  async setListingChannelVisibility(
    listingId: string,
    channelId: string,
    visible: boolean,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.catalogs.listings.setChannelVisibility — listingId: ${listingId}, visible: ${visible}`);
    return this.nats.send('commerce', 'le.catalogs.listings.setChannelVisibility', {
      id: listingId,
      catalogChannelId: channelId,
      visible,
    });
  }

  async deleteListing(listingId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.catalogs.listings.delete — listingId: ${listingId}`);
    return this.nats.send('commerce', 'le.catalogs.listings.delete', { id: listingId });
  }

  /**
   * Everything a legal entity's B2B website sells: the LE's own APP channel ahead of the org's.
   *
   * The APP channel is resolved for this app at this le, so the website reads the range it was
   * given and no other — there is no argument naming a catalogue.
   */
  async findStorefrontListings(appId: string, legalEntityId: string): Promise<CatalogListing[]> {
    const resolution = await this.nats.send<{ catalog: { catalogId: string; channelId: string } | null }>(
      'commerce',
      'org.catalogChannels.resolve',
      { type: 'APP', appId },
    );
    if (!resolution?.catalog) {
      throw new NotFoundException({
        label: 'Store Not Configured',
        detail: 'This company has no catalogue assigned to its website yet.',
      });
    }
    const { catalogId, channelId } = resolution.catalog;

    this.logger.log(`org.catalogs.listings.forChannel — channelId: ${channelId}, le: ${legalEntityId}`);
    const rows = await this.nats.send<
      {
        id: string;
        offeringVariantId: string;
        sku: string | null;
        variantName: string | null;
        prices: { price: { currency: string; value: string } }[];
      }[]
    >('commerce', 'org.catalogs.listings.forChannel', { channelId, catalogId });

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

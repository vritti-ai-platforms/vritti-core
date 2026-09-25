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
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';

const CATALOGS_TABLE_SLUG = 'commerce-org-catalogs';
const CATALOG_LISTINGS_TABLE_SLUG = (catalogId: string) => `commerce-org-catalog-${catalogId}-items`;

@Injectable()
export class CatalogsGatewayService {
  private readonly logger = new Logger(CatalogsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered and sorted catalogs for the data table
  async findForTable(userId: string): Promise<CatalogTableResponseDto> {
    this.logger.log('org.catalogs.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, CATALOGS_TABLE_SLUG);
    const { result, count } = await this.nats.send<{ result: CatalogResponseDto[]; count: number }>(
      'commerce',
      'org.catalogs.table',
      state,
    );
    return { result, count, state, activeViewId };
  }

  async findById(id: string): Promise<CatalogResponseDto> {
    this.logger.log(`org.catalogs.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.catalogs.findById', { id });
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
  async findListingsForTable(catalogId: string, userId: string): Promise<CatalogListingTableResponseDto> {
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
    return { result, count, state, activeViewId };
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
    this.logger.log(`org.catalogChannels.byCatalog — catalogId: ${catalogId}`);
    return this.nats.send('commerce', 'org.catalogChannels.byCatalog', { catalogId });
  }

  async setListingChannelVisibility(
    listingId: string,
    catalogChannelId: string,
    visible: boolean,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`org.catalogs.listings.setChannelVisibility — listingId: ${listingId}, visible: ${visible}`);
    return this.nats.send('commerce', 'org.catalogs.listings.setChannelVisibility', {
      id: listingId,
      catalogChannelId,
      visible,
    });
  }

  async deleteListing(listingId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.catalogs.listings.delete — listingId: ${listingId}`);
    return this.nats.send('commerce', 'org.catalogs.listings.delete', { id: listingId });
  }
}

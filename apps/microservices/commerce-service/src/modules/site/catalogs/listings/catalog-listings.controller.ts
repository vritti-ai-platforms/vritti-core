import type { CatalogListingDto } from '@domain/catalogs/dto/entity/catalog-listing.dto';
import { AddCatalogListingDto } from '@domain/catalogs/dto/request/add-catalog-listing.dto';
import { AddCatalogListingsBatchDto } from '@domain/catalogs/dto/request/add-catalog-listings-batch.dto';
import {
  BulkClearCatalogListingPricesDto,
  BulkRemoveCatalogListingsDto,
  BulkSetCatalogListingAvailabilityDto,
  BulkSetCatalogListingPriceDto,
} from '@domain/catalogs/dto/request/bulk-catalog-listings.dto';
import { SetCatalogListingPriceDto } from '@domain/catalogs/dto/request/set-catalog-listing-price.dto';
import { CatalogListingsDomainService } from '@domain/catalogs/services/catalog-listings.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SiteCatalogListingsController {
  private readonly logger = new Logger(SiteCatalogListingsController.name);

  constructor(private readonly listingsService: CatalogListingsDomainService) {}

  // Returns paginated listings of one catalog, each with its prices
  @MessagePattern({ cmd: 'site.catalogs.listings.table' })
  findListingsForTable(
    @Payload() data: { catalogId: string; state: TableViewState; currencyCode?: string },
  ): Promise<{ result: CatalogListingDto[]; count: number }> {
    this.logger.log(`catalogs.listings.table — catalogId: ${data.catalogId}`);
    return this.listingsService.findForTable(data.catalogId, data.state, data.currencyCode);
  }

  // The MRP slices a variant can be listed at Everything one storefront channel makes available — the list a

  // Lists a variant, optionally keyed to one MRP slice, with an optional opening price
  @MessagePattern({ cmd: 'site.catalogs.listings.add' })
  addListing(@Payload() dto: AddCatalogListingDto): Promise<CreateResponseDto<CatalogListingDto>> {
    this.logger.log(`catalogs.listings.add — catalogId: ${dto.catalogId}, variantId: ${dto.offeringVariantId}`);
    return this.listingsService.add(dto);
  }

  // Lists several variants in one go — judged whole, so a batch that breaches one rule writes nothing
  @MessagePattern({ cmd: 'site.catalogs.listings.addBatch' })
  addListings(@Payload() dto: AddCatalogListingsBatchDto): Promise<CreateResponseDto<CatalogListingDto[]>> {
    this.logger.log(`catalogs.listings.addBatch — catalogId: ${dto.catalogId}, items: ${dto.items.length}`);
    return this.listingsService.addBatch(dto);
  }

  // Sets the price for a (listing, currency, site) slot
  @MessagePattern({ cmd: 'site.catalogs.listings.setPrice' })
  setListingPrice(@Payload() dto: SetCatalogListingPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.listings.setPrice — catalogListingId: ${dto.catalogListingId}`);
    return this.listingsService.setPrice(dto);
  }

  // Shows or hides one listing on one channel of its catalog Clears one (listing, currency, site) price slot
  @MessagePattern({ cmd: 'site.catalogs.listings.clearPrice' })
  clearListingPrice(
    @Payload() data: { catalogListingId: string; currencyCode: string; siteId?: string | null },
  ): Promise<SuccessResponseDto> {
    this.logger.log(
      `catalogs.listings.clearPrice — listingId: ${data.catalogListingId}, currency: ${data.currencyCode}`,
    );
    return this.listingsService.clearPrice(data);
  }

  @MessagePattern({ cmd: 'site.catalogs.listings.setChannelVisibility' })
  setListingChannelVisibility(
    @Payload() data: { id: string; catalogChannelId: string; visible: boolean },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.listings.setChannelVisibility — id: ${data.id}, visible: ${data.visible}`);
    return this.listingsService.setChannelVisibility(data.id, data.catalogChannelId, data.visible);
  }

  // Removes a whole selection in one statement — refused unless every one of them is in this catalog
  @MessagePattern({ cmd: 'site.catalogs.listings.bulkDelete' })
  bulkDeleteListings(@Payload() data: BulkRemoveCatalogListingsDto): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.listings.bulkDelete — ${data.ids.length} selected`);
    return this.listingsService.bulkRemove(data);
  }

  // Prices a whole selection the same, refused if any one of them is keyed to a lower printed MRP
  @MessagePattern({ cmd: 'site.catalogs.listings.bulkSetPrice' })
  bulkSetListingPrice(@Payload() data: BulkSetCatalogListingPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.listings.bulkSetPrice — ${data.ids.length} selected`);
    return this.listingsService.bulkSetPrice(data);
  }

  // Clears one currency's own price across a whole selection
  @MessagePattern({ cmd: 'site.catalogs.listings.bulkClearPrice' })
  bulkClearListingPrice(@Payload() data: BulkClearCatalogListingPricesDto): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.listings.bulkClearPrice — ${data.ids.length} selected, ${data.currencyCodes.join(', ')}`);
    return this.listingsService.bulkClearPrice(data);
  }

  // Shows or hides a whole selection on a set of channels
  @MessagePattern({ cmd: 'site.catalogs.listings.bulkSetAvailability' })
  bulkSetListingAvailability(@Payload() data: BulkSetCatalogListingAvailabilityDto): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.listings.bulkSetAvailability — ${data.ids.length} selected`);
    return this.listingsService.bulkSetAvailability(data);
  }

  @MessagePattern({ cmd: 'site.catalogs.listings.delete' })
  deleteListing(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.listings.delete — id: ${data.id}`);
    return this.listingsService.delete(data.id);
  }
}

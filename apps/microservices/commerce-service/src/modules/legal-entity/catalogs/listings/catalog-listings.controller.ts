import type { CatalogListingDto, CatalogListingMrpOptionDto } from '@domain/catalogs/dto/entity/catalog-listing.dto';
import { AddCatalogListingDto } from '@domain/catalogs/dto/request/add-catalog-listing.dto';
import { SetCatalogListingPriceDto } from '@domain/catalogs/dto/request/set-catalog-listing-price.dto';
import { CatalogListingsDomainService } from '@domain/catalogs/services/catalog-listings.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class LeCatalogListingsController {
  private readonly logger = new Logger(LeCatalogListingsController.name);

  constructor(private readonly listingsService: CatalogListingsDomainService) {}

  // Returns paginated listings of one catalog, each with its prices
  @MessagePattern({ cmd: 'le.catalogs.listings.table' })
  findListingsForTable(
    @Payload() data: { catalogId: string; state: TableViewState },
  ): Promise<{ result: CatalogListingDto[]; count: number }> {
    this.logger.log(`catalogs.listings.table — catalogId: ${data.catalogId}`);
    return this.listingsService.findForTable(data.catalogId, data.state);
  }

  // The MRP slices a variant can be listed at
  // Everything one storefront channel sells — the list a provisioned website files its pages against
  @MessagePattern({ cmd: 'le.catalogs.listings.mrpOptions' })
  findMrpOptions(@Payload() data: { offeringVariantId: string }): Promise<CatalogListingMrpOptionDto[]> {
    this.logger.log(`catalogs.listings.mrpOptions — variantId: ${data.offeringVariantId}`);
    return this.listingsService.findMrpOptions(data.offeringVariantId);
  }

  // Lists a variant, optionally keyed to one MRP slice, with an optional opening price
  @MessagePattern({ cmd: 'le.catalogs.listings.add' })
  addListing(@Payload() dto: AddCatalogListingDto): Promise<CreateResponseDto<CatalogListingDto>> {
    this.logger.log(`catalogs.listings.add — catalogId: ${dto.catalogId}, variantId: ${dto.offeringVariantId}`);
    return this.listingsService.add(dto);
  }

  // Sets the price for a (listing, currency, site) slot
  @MessagePattern({ cmd: 'le.catalogs.listings.setPrice' })
  setListingPrice(@Payload() dto: SetCatalogListingPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.listings.setPrice — catalogListingId: ${dto.catalogListingId}`);
    return this.listingsService.setPrice(dto);
  }

  // Shows or hides one listing on one channel of its catalog
  @MessagePattern({ cmd: 'le.catalogs.listings.setChannelVisibility' })
  setListingChannelVisibility(
    @Payload() data: { id: string; catalogChannelId: string; visible: boolean },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.listings.setChannelVisibility — id: ${data.id}, visible: ${data.visible}`);
    return this.listingsService.setChannelVisibility(data.id, data.catalogChannelId, data.visible);
  }

  @MessagePattern({ cmd: 'le.catalogs.listings.delete' })
  deleteListing(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.listings.delete — id: ${data.id}`);
    return this.listingsService.delete(data.id);
  }
}

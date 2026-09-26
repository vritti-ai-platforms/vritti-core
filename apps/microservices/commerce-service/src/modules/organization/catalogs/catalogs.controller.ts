import type { CatalogDto } from '@domain/catalogs/dto/entity/catalog.dto';
import type { CatalogListingDto, CatalogListingMrpOptionDto } from '@domain/catalogs/dto/entity/catalog-listing.dto';
import { AddCatalogListingDto } from '@domain/catalogs/dto/request/add-catalog-listing.dto';
import { CreateCatalogDto } from '@domain/catalogs/dto/request/create-catalog.dto';
import { SetCatalogListingPriceDto } from '@domain/catalogs/dto/request/set-catalog-listing-price.dto';
import { UpdateCatalogDto } from '@domain/catalogs/dto/request/update-catalog.dto';
import { CatalogListingsDomainService } from '@domain/catalogs/services/catalog-listings.service';
import { CatalogsDomainService } from '@domain/catalogs/services/catalogs.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';

@Controller()
export class OrgCatalogsController {
  private readonly logger = new Logger(OrgCatalogsController.name);

  constructor(
    private readonly service: CatalogsDomainService,
    private readonly listingsService: CatalogListingsDomainService,
  ) {}

  // Returns paginated catalogs for the data table
  @MessagePattern({ cmd: 'org.catalogs.table' })
  findForTable(@Payload() state: TableViewState): Promise<{ result: CatalogDto[]; count: number }> {
    this.logger.log('catalogs.table');
    return this.service.findForTable(state);
  }

  // Returns catalog options for select dropdowns
  @MessagePattern({ cmd: 'org.catalogs.select' })
  findForSelect(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('catalogs.select');
    return this.service.findForSelect(query);
  }

  // Returns one catalog with its listing and channel counts
  @MessagePattern({ cmd: 'org.catalogs.findById' })
  findById(@Payload() data: { id: string }): Promise<CatalogDto> {
    this.logger.log(`catalogs.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'org.catalogs.create' })
  create(@Payload() dto: CreateCatalogDto): Promise<CreateResponseDto<CatalogDto>> {
    this.logger.log(`catalogs.create — name: ${dto.name}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'org.catalogs.update' })
  update(@Payload() dto: UpdateCatalogDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`catalogs.update — id: ${id}`);
    return this.service.update(id, data);
  }

  // Deletes a catalog; refused while it still lists anything
  @MessagePattern({ cmd: 'org.catalogs.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }

  // Returns paginated listings of one catalog, each with its prices
  @MessagePattern({ cmd: 'org.catalogs.listings.table' })
  findListingsForTable(
    @Payload() data: { catalogId: string; state: TableViewState },
  ): Promise<{ result: CatalogListingDto[]; count: number }> {
    this.logger.log(`catalogs.listings.table — catalogId: ${data.catalogId}`);
    return this.listingsService.findForTable(data.catalogId, data.state);
  }

  // The MRP slices a variant can be listed at
  // Everything one storefront channel sells — the list a provisioned website files its pages against
  @MessagePattern({ cmd: 'org.catalogs.listings.forChannel' })
  listingsForChannel(
    @Payload() data: { channelId: string; catalogId: string; siteId?: string | null },
  ): Promise<CatalogListingDto[]> {
    this.logger.log(`catalogs.listings.forChannel — channelId: ${data.channelId}, site: ${data.siteId ?? 'org'}`);
    return this.listingsService.findSellableForChannel(data.channelId, data.catalogId, data.siteId);
  }

  @MessagePattern({ cmd: 'org.catalogs.listings.mrpOptions' })
  findMrpOptions(@Payload() data: { offeringVariantId: string }): Promise<CatalogListingMrpOptionDto[]> {
    this.logger.log(`catalogs.listings.mrpOptions — variantId: ${data.offeringVariantId}`);
    return this.listingsService.findMrpOptions(data.offeringVariantId);
  }

  // Lists a variant, optionally keyed to one MRP slice, with an optional opening price
  @MessagePattern({ cmd: 'org.catalogs.listings.add' })
  addListing(@Payload() dto: AddCatalogListingDto): Promise<CreateResponseDto<CatalogListingDto>> {
    this.logger.log(`catalogs.listings.add — catalogId: ${dto.catalogId}, variantId: ${dto.offeringVariantId}`);
    return this.listingsService.add(dto);
  }

  // Sets the price for a (listing, currency, site) slot
  @MessagePattern({ cmd: 'org.catalogs.listings.setPrice' })
  setListingPrice(@Payload() dto: SetCatalogListingPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.listings.setPrice — catalogListingId: ${dto.catalogListingId}`);
    return this.listingsService.setPrice(dto);
  }

  // Hides or shows one listing on one channel of its catalog
  @MessagePattern({ cmd: 'org.catalogs.listings.setChannelVisibility' })
  setListingChannelVisibility(
    @Payload() data: { id: string; catalogChannelId: string; visible: boolean },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.listings.setChannelVisibility — id: ${data.id}, visible: ${data.visible}`);
    return this.listingsService.setChannelVisibility(data.id, data.catalogChannelId, data.visible);
  }

  @MessagePattern({ cmd: 'org.catalogs.listings.delete' })
  deleteListing(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.listings.delete — id: ${data.id}`);
    return this.listingsService.delete(data.id);
  }
}

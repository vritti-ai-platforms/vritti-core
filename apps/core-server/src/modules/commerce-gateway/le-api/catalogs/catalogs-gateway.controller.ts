import type { CatalogChannelResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import {
  ApiAddCatalogCurrency,
  ApiAddCatalogListing,
  ApiCatalogChannels,
  ApiCatalogCurrencies,
  ApiCatalogCurrencyListingsTable,
  ApiCatalogListingMrpOptions,
  ApiCatalogListingsTable,
  ApiCatalogsTable,
  ApiClearCatalogListingPrice,
  ApiCreateCatalog,
  ApiDeleteCatalog,
  ApiDeleteCatalogListing,
  ApiGetCatalog,
  ApiRemoveCatalogCurrency,
  ApiSetCatalogListingChannelVisibility,
  ApiSetCatalogListingPrice,
  ApiUpdateCatalog,
} from '@commerce/catalogs/docs/catalogs-gateway.docs';
import { AddCatalogCurrencyDto } from '@commerce/catalogs/dto/request/add-catalog-currency.dto';
import { AddCatalogListingDto } from '@commerce/catalogs/dto/request/add-catalog-listing.dto';
import { CatalogListingMrpOptionsQueryDto } from '@commerce/catalogs/dto/request/catalog-listing-mrp-options-query.dto';
import { ClearCatalogListingPriceQueryDto } from '@commerce/catalogs/dto/request/clear-catalog-listing-price-query.dto';
import { CreateCatalogDto } from '@commerce/catalogs/dto/request/create-catalog.dto';
import { SetCatalogListingPriceDto } from '@commerce/catalogs/dto/request/set-catalog-listing-price.dto';
import { SetCatalogListingVisibilityDto } from '@commerce/catalogs/dto/request/set-catalog-listing-visibility.dto';
import { UpdateCatalogDto } from '@commerce/catalogs/dto/request/update-catalog.dto';
import type { CatalogCurrencyResponseDto } from '@commerce/catalogs/dto/response/catalog-currency-response.dto';
import type {
  CatalogListingMrpOptionResponseDto,
  CatalogListingResponseDto,
} from '@commerce/catalogs/dto/response/catalog-listing-response.dto';
import type { CatalogListingTableResponseDto } from '@commerce/catalogs/dto/response/catalog-listing-table-response.dto';
import type { CatalogResponseDto } from '@commerce/catalogs/dto/response/catalog-response.dto';
import type { CatalogTableResponseDto } from '@commerce/catalogs/dto/response/catalog-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LE_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import { LeCatalogsGatewayService } from './services/catalogs-gateway.service';

@ApiTags('Commerce - Catalogs')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_CATALOGS.featureCode)
@Controller('le/catalogs')
export class LeCatalogsGatewayController {
  private readonly logger = new Logger(LeCatalogsGatewayController.name);

  constructor(private readonly service: LeCatalogsGatewayService) {}

  @Get('table')
  @RequirePermission(LE_CATALOGS.view)
  @ApiCatalogsTable()
  getTable(@OrgId() orgId: string, @UserId() userId: string): Promise<CatalogTableResponseDto> {
    this.logger.log('GET /commerce-api/le/catalogs/table');
    return this.service.findForTable(orgId, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_CATALOGS.add)
  @ApiCreateCatalog()
  create(@Body() dto: CreateCatalogDto): Promise<CreateResponseDto<CatalogResponseDto>> {
    this.logger.log('POST /commerce-api/le/catalogs');
    return this.service.create(dto);
  }

  // Returns one catalog's listings, table-shaped
  @Get(':id/listings/table')
  @RequirePermission(LE_CATALOGS.listings.view)
  @ApiCatalogListingsTable()
  getListingsTable(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<CatalogListingTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/catalogs/${id}/listings/table`);
    return this.service.findListingsForTable(orgId, id, userId);
  }

  // MRP slices belong to the variant rather than to any one catalog, so this sits outside the :id tree
  @Get('listings/mrp-options')
  @RequirePermission(LE_CATALOGS.listings.view)
  @ApiCatalogListingMrpOptions()
  getMrpOptions(@Query() query: CatalogListingMrpOptionsQueryDto): Promise<CatalogListingMrpOptionResponseDto[]> {
    this.logger.log('GET /commerce-api/le/catalogs/listings/mrp-options');
    return this.service.findMrpOptions(query.offeringVariantId);
  }

  // Lists a variant, optionally keyed to one MRP slice, with an optional opening price
  @Post(':id/listings')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_CATALOGS.listings.add)
  @ApiAddCatalogListing()
  addListing(
    @Param('id') id: string,
    @Body() dto: AddCatalogListingDto,
  ): Promise<CreateResponseDto<CatalogListingResponseDto>> {
    this.logger.log(`POST /commerce-api/le/catalogs/${id}/listings`);
    return this.service.addListing(id, dto);
  }

  // Sets a listing's price; refused above the MRP it is keyed to
  @Patch(':id/listings/:listingId/price')
  @RequirePermission(LE_CATALOGS.prices.set)
  @ApiSetCatalogListingPrice()
  setListingPrice(
    @Param('id') id: string,
    @Param('listingId') listingId: string,
    @Body() dto: SetCatalogListingPriceDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/catalogs/${id}/listings/${listingId}/price`);
    return this.service.setListingPrice(listingId, dto);
  }

  // Clears this workspace's own price, so a wider workspace's price applies again
  @Delete(':id/listings/:listingId/price')
  @RequirePermission(LE_CATALOGS.prices.clear)
  @ApiClearCatalogListingPrice()
  clearListingPrice(
    @Param('id') id: string,
    @Param('listingId') listingId: string,
    @Query() query: ClearCatalogListingPriceQueryDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/catalogs/${id}/listings/${listingId}/price`);
    return this.service.clearListingPrice(listingId, query.currencyCode);
  }

  // Every channel carrying this catalog — managed on the Catalog Channels page, read-only here
  @Get(':id/channels')
  @RequirePermission(LE_CATALOGS.view)
  @ApiCatalogChannels()
  getChannels(@Param('id') id: string): Promise<CatalogChannelResponseDto[]> {
    this.logger.log(`GET /commerce-api/le/catalogs/${id}/channels`);
    return this.service.findChannels(id);
  }

  // Shows or hides one listing on one channel of this catalog
  @Patch(':id/listings/:listingId/channels/:channelId')
  @RequirePermission(LE_CATALOGS.listings.edit)
  @ApiSetCatalogListingChannelVisibility()
  setListingChannelVisibility(
    @Param('id') id: string,
    @Param('listingId') listingId: string,
    @Param('channelId') channelId: string,
    @Body() dto: SetCatalogListingVisibilityDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/catalogs/${id}/listings/${listingId}/channels/${channelId}`);
    return this.service.setListingChannelVisibility(listingId, channelId, dto.visible);
  }

  @Delete(':id/listings/:listingId')
  @RequirePermission(LE_CATALOGS.listings.delete)
  @ApiDeleteCatalogListing()
  deleteListing(@Param('id') id: string, @Param('listingId') listingId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/catalogs/${id}/listings/${listingId}`);
    return this.service.deleteListing(listingId);
  }

  // Currencies this catalog may be priced in, each with the coverage it has
  @Get(':id/currencies')
  @RequirePermission(LE_CATALOGS.currencies.view)
  @ApiCatalogCurrencies()
  getCurrencies(@Param('id') id: string): Promise<CatalogCurrencyResponseDto[]> {
    this.logger.log(`GET /commerce-api/le/catalogs/${id}/currencies`);
    return this.service.findCurrencies(id);
  }

  @Post(':id/currencies')
  @RequirePermission(LE_CATALOGS.currencies.add)
  @ApiAddCatalogCurrency()
  addCurrency(@Param('id') id: string, @Body() dto: AddCatalogCurrencyDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/le/catalogs/${id}/currencies`);
    return this.service.addCurrency(id, dto.currencyCode);
  }

  @Delete(':id/currencies/:currencyCode')
  @RequirePermission(LE_CATALOGS.currencies.delete)
  @ApiRemoveCatalogCurrency()
  removeCurrency(@Param('id') id: string, @Param('currencyCode') currencyCode: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/catalogs/${id}/currencies/${currencyCode}`);
    return this.service.removeCurrency(id, currencyCode);
  }

  // One page of this catalog's listings priced in one currency — the Prices tab's drill-in
  @Get(':id/currencies/:currencyCode/listings/table')
  @RequirePermission(LE_CATALOGS.prices.view)
  @ApiCatalogCurrencyListingsTable()
  getCurrencyListingsTable(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Param('currencyCode') currencyCode: string,
    @UserId() userId: string,
  ): Promise<CatalogListingTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/catalogs/${id}/currencies/${currencyCode}/listings/table`);
    return this.service.findListingsForTable(orgId, id, userId, currencyCode);
  }

  @Get(':id')
  @RequirePermission(LE_CATALOGS.view)
  @ApiGetCatalog()
  findById(@OrgId() orgId: string, @Param('id') id: string): Promise<CatalogResponseDto> {
    this.logger.log(`GET /commerce-api/le/catalogs/${id}`);
    return this.service.findById(orgId, id);
  }

  @Patch(':id')
  @RequirePermission(LE_CATALOGS.edit)
  @ApiUpdateCatalog()
  update(@Param('id') id: string, @Body() dto: UpdateCatalogDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/catalogs/${id}`);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(LE_CATALOGS.delete)
  @ApiDeleteCatalog()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/catalogs/${id}`);
    return this.service.delete(id);
  }
}

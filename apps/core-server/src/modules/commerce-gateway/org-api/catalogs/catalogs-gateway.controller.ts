import type { CatalogChannelResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import {
  ApiAddCatalogListing,
  ApiCatalogChannels,
  ApiCatalogListingMrpOptions,
  ApiCatalogListingsTable,
  ApiCatalogsTable,
  ApiCreateCatalog,
  ApiDeleteCatalog,
  ApiDeleteCatalogListing,
  ApiGetCatalog,
  ApiSetCatalogListingChannelVisibility,
  ApiSetCatalogListingPrice,
  ApiSetCatalogListingStatus,
  ApiUpdateCatalog,
} from '@commerce/catalogs/docs/catalogs-gateway.docs';
import { AddCatalogListingDto } from '@commerce/catalogs/dto/request/add-catalog-listing.dto';
import { CatalogListingMrpOptionsQueryDto } from '@commerce/catalogs/dto/request/catalog-listing-mrp-options-query.dto';
import { CreateCatalogDto } from '@commerce/catalogs/dto/request/create-catalog.dto';
import { SetCatalogListingPriceDto } from '@commerce/catalogs/dto/request/set-catalog-listing-price.dto';
import { SetCatalogListingStatusDto } from '@commerce/catalogs/dto/request/set-catalog-listing-status.dto';
import { SetCatalogListingVisibilityDto } from '@commerce/catalogs/dto/request/set-catalog-listing-visibility.dto';
import { UpdateCatalogDto } from '@commerce/catalogs/dto/request/update-catalog.dto';
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
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { CatalogsGatewayService } from './services/catalogs-gateway.service';

@ApiTags('Commerce - Catalogs')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_CATALOGS.featureCode)
@Controller('org/catalogs')
export class CatalogsGatewayController {
  private readonly logger = new Logger(CatalogsGatewayController.name);

  constructor(private readonly service: CatalogsGatewayService) {}

  @Get('table')
  @RequirePermission(ORG_CATALOGS.view)
  @ApiCatalogsTable()
  getTable(@UserId() userId: string): Promise<CatalogTableResponseDto> {
    this.logger.log('GET /commerce-api/org/catalogs/table');
    return this.service.findForTable(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_CATALOGS.add)
  @ApiCreateCatalog()
  create(@Body() dto: CreateCatalogDto): Promise<CreateResponseDto<CatalogResponseDto>> {
    this.logger.log('POST /commerce-api/org/catalogs');
    return this.service.create(dto);
  }

  // Returns one catalog's listings, table-shaped
  @Get(':id/listings/table')
  @RequirePermission(ORG_CATALOGS.listings.view)
  @ApiCatalogListingsTable()
  getListingsTable(@Param('id') id: string, @UserId() userId: string): Promise<CatalogListingTableResponseDto> {
    this.logger.log(`GET /commerce-api/org/catalogs/${id}/listings/table`);
    return this.service.findListingsForTable(id, userId);
  }

  // MRP slices belong to the variant rather than to any one catalog, so this sits outside the :id tree
  @Get('listings/mrp-options')
  @RequirePermission(ORG_CATALOGS.listings.view)
  @ApiCatalogListingMrpOptions()
  getMrpOptions(@Query() query: CatalogListingMrpOptionsQueryDto): Promise<CatalogListingMrpOptionResponseDto[]> {
    this.logger.log('GET /commerce-api/org/catalogs/listings/mrp-options');
    return this.service.findMrpOptions(query.offeringVariantId);
  }

  // Lists a variant, optionally keyed to one MRP slice, with an optional opening price
  @Post(':id/listings')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_CATALOGS.listings.add)
  @ApiAddCatalogListing()
  addListing(
    @Param('id') id: string,
    @Body() dto: AddCatalogListingDto,
  ): Promise<CreateResponseDto<CatalogListingResponseDto>> {
    this.logger.log(`POST /commerce-api/org/catalogs/${id}/listings`);
    return this.service.addListing(id, dto);
  }

  // Sets a listing's price; refused above the MRP it is keyed to
  @Patch(':id/listings/:listingId/price')
  @RequirePermission(ORG_CATALOGS.listings.edit)
  @ApiSetCatalogListingPrice()
  setListingPrice(
    @Param('id') id: string,
    @Param('listingId') listingId: string,
    @Body() dto: SetCatalogListingPriceDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/catalogs/${id}/listings/${listingId}/price`);
    return this.service.setListingPrice(listingId, dto);
  }

  // Every channel selling this catalog — managed on the Catalog Channels page, read-only here
  @Get(':id/channels')
  @RequirePermission(ORG_CATALOGS.view)
  @ApiCatalogChannels()
  getChannels(@Param('id') id: string): Promise<CatalogChannelResponseDto[]> {
    this.logger.log(`GET /commerce-api/org/catalogs/${id}/channels`);
    return this.service.findChannels(id);
  }

  // Hides or shows one listing on one channel of this catalog
  @Patch(':id/listings/:listingId/channels/:channelId')
  @RequirePermission(ORG_CATALOGS.listings.edit)
  @ApiSetCatalogListingChannelVisibility()
  setListingChannelVisibility(
    @Param('id') id: string,
    @Param('listingId') listingId: string,
    @Param('channelId') channelId: string,
    @Body() dto: SetCatalogListingVisibilityDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/catalogs/${id}/listings/${listingId}/channels/${channelId}`);
    return this.service.setListingChannelVisibility(listingId, channelId, dto.visible);
  }

  // Marks a listing active or draft
  @Patch(':id/listings/:listingId/status')
  @RequirePermission(ORG_CATALOGS.listings.edit)
  @ApiSetCatalogListingStatus()
  setListingStatus(
    @Param('id') id: string,
    @Param('listingId') listingId: string,
    @Body() dto: SetCatalogListingStatusDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/catalogs/${id}/listings/${listingId}/status`);
    return this.service.setListingStatus(listingId, dto.isActive);
  }

  @Delete(':id/listings/:listingId')
  @RequirePermission(ORG_CATALOGS.listings.delete)
  @ApiDeleteCatalogListing()
  deleteListing(@Param('id') id: string, @Param('listingId') listingId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/org/catalogs/${id}/listings/${listingId}`);
    return this.service.deleteListing(listingId);
  }

  @Get(':id')
  @RequirePermission(ORG_CATALOGS.view)
  @ApiGetCatalog()
  findById(@Param('id') id: string): Promise<CatalogResponseDto> {
    this.logger.log(`GET /commerce-api/org/catalogs/${id}`);
    return this.service.findById(id);
  }

  @Patch(':id')
  @RequirePermission(ORG_CATALOGS.edit)
  @ApiUpdateCatalog()
  update(@Param('id') id: string, @Body() dto: UpdateCatalogDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/catalogs/${id}`);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(ORG_CATALOGS.delete)
  @ApiDeleteCatalog()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/org/catalogs/${id}`);
    return this.service.delete(id);
  }
}

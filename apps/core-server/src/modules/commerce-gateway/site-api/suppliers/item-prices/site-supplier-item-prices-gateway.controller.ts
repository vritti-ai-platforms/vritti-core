import { AddSiteSupplierItemPriceDto } from '@commerce/supplier-item-prices/dto/request/add-site-supplier-item-price.dto';
import { SiteSupplierItemPriceHistoryQueryDto } from '@commerce/supplier-item-prices/dto/request/site-supplier-item-price-history-query.dto';
import { SiteSupplierItemPriceQueryDto } from '@commerce/supplier-item-prices/dto/request/site-supplier-item-price-query.dto';
import { UpdateSiteSupplierItemPriceDto } from '@commerce/supplier-item-prices/dto/request/update-site-supplier-item-price.dto';
import type { SiteSupplierItemPriceResponseDto } from '@commerce/supplier-item-prices/dto/response/site-supplier-item-price-response.dto';
import type { SiteSupplierItemPriceTableResponseDto } from '@commerce/supplier-item-prices/dto/response/site-supplier-item-price-table-response.dto';
import type { SupplierItemPriceHistoryResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-item-price-history-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import { type CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { SiteSupplierItemPricesGatewayService } from './services/site-supplier-item-prices-gateway.service';

// A supplier item's validity-dated prices at the session site: the table, the graph, their records and the prefill
@ApiTags('Commerce - Site Supplier Item Prices')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_SUPPLIERS.featureCode)
@Controller('site/suppliers')
export class SiteSupplierItemPricesGatewayController {
  private readonly logger = new Logger(SiteSupplierItemPricesGatewayController.name);

  constructor(private readonly service: SiteSupplierItemPricesGatewayService) {}

  // Returns the resolved unit price for a supplier-item pair at this site
  @Get('items/price')
  @RequirePermission(SITE_SUPPLIERS.items.view)
  getItemPrice(@Query() query: SiteSupplierItemPriceQueryDto): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    this.logger.log('GET /commerce-api/site/suppliers/items/price');
    return this.service.findItemPrice(query.supplierId, query.inventoryItemId, query.uomId);
  }

  // Returns the price timeline visible to this site for a supplier item
  @Get(':id/items/:itemId/prices/table')
  @RequirePermission(SITE_SUPPLIERS.items.prices.view)
  getItemPricesTable(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @UserId() userId: string,
  ): Promise<SiteSupplierItemPriceTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/items/${itemId}/prices/table`);
    return this.service.findItemPricesTable(itemId, userId);
  }

  // Returns this site's price windows for a supplier item — unpaged, for charts
  @Get(':id/items/:itemId/prices/history')
  @RequirePermission(SITE_SUPPLIERS.items.prices.view)
  getItemPriceHistory(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Query() query: SiteSupplierItemPriceHistoryQueryDto,
  ): Promise<SupplierItemPriceHistoryResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/items/${itemId}/prices/history`);
    return this.service.findItemPriceHistory(itemId, query);
  }

  // Adds a site-specific price record to a supplier item's timeline
  @Post(':id/items/:itemId/prices')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_SUPPLIERS.items.prices.add)
  addItemPrice(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AddSiteSupplierItemPriceDto,
  ): Promise<CreateResponseDto<SiteSupplierItemPriceResponseDto[]>> {
    this.logger.log(`POST /commerce-api/site/suppliers/${supplierId}/items/${itemId}/prices`);
    return this.service.addItemPrice(itemId, dto);
  }

  // Updates a site-specific supplier item price record
  @Patch(':id/items/:itemId/prices/:priceId')
  @RequirePermission(SITE_SUPPLIERS.items.prices.edit)
  updateItemPrice(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('priceId') priceId: string,
    @Body() dto: UpdateSiteSupplierItemPriceDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/suppliers/${supplierId}/items/${itemId}/prices/${priceId}`);
    return this.service.updateItemPrice(priceId, dto);
  }

  // Deletes a site-specific supplier item price record
  @Delete(':id/items/:itemId/prices/:priceId')
  @RequirePermission(SITE_SUPPLIERS.items.prices.delete)
  deleteItemPrice(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('priceId') priceId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/suppliers/${supplierId}/items/${itemId}/prices/${priceId}`);
    return this.service.deleteItemPrice(priceId);
  }
}

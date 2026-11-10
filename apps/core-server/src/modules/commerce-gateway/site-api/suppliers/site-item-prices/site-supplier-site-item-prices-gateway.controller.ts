import { AddSupplierSiteItemPriceDto } from '@commerce/supplier-item-prices/dto/request/add-supplier-site-item-price.dto';
import { UpdateSupplierSiteItemPriceDto } from '@commerce/supplier-item-prices/dto/request/update-supplier-site-item-price.dto';
import type { SupplierItemPriceHistoryResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-item-price-history-response.dto';
import type { SupplierSiteItemPriceResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-site-item-price-response.dto';
import type { SupplierSiteItemPriceTableResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-site-item-price-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import { SiteSupplierSiteItemPricesGatewayService } from './services/site-supplier-site-item-prices-gateway.service';

// A supplier site item's validity-dated prices at the session site: the table, the price history and their records
@ApiTags('Commerce - Site Supplier Site Item Prices')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_SUPPLIERS.featureCode)
@Controller('site/suppliers')
export class SiteSupplierSiteItemPricesGatewayController {
  private readonly logger = new Logger(SiteSupplierSiteItemPricesGatewayController.name);

  constructor(private readonly service: SiteSupplierSiteItemPricesGatewayService) {}

  // Returns the price timeline visible to this site for a supplier item
  @Get(':id/site-items/:itemId/prices/table')
  @RequirePermission(SITE_SUPPLIERS.siteItems.prices.view)
  getSiteItemPricesTable(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @UserId() userId: string,
    @OrgId() orgId: string,
  ): Promise<SupplierSiteItemPriceTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/site-items/${itemId}/prices/table`);
    return this.service.findPricesTable(itemId, userId, orgId);
  }

  // Returns this site's price windows for a supplier item, in one currency, at the history's saved context
  @Get(':id/site-items/:itemId/price-history')
  @RequirePermission(SITE_SUPPLIERS.siteItems.prices.view)
  getSiteItemPriceHistory(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @UserId() userId: string,
  ): Promise<SupplierItemPriceHistoryResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/site-items/${itemId}/price-history`);
    return this.service.findPriceHistory(itemId, userId);
  }

  // Adds a site-specific price record to a supplier item's timeline
  @Post(':id/site-items/:itemId/prices')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_SUPPLIERS.siteItems.prices.add)
  createSiteItemPrice(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AddSupplierSiteItemPriceDto,
  ): Promise<CreateResponseDto<SupplierSiteItemPriceResponseDto[]>> {
    this.logger.log(`POST /commerce-api/site/suppliers/${supplierId}/site-items/${itemId}/prices`);
    return this.service.createPrice(itemId, dto);
  }

  // Updates a site-specific supplier item price record
  @Patch(':id/site-items/:itemId/prices/:priceId')
  @RequirePermission(SITE_SUPPLIERS.siteItems.prices.edit)
  updateSiteItemPrice(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('priceId') priceId: string,
    @Body() dto: UpdateSupplierSiteItemPriceDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/suppliers/${supplierId}/site-items/${itemId}/prices/${priceId}`);
    return this.service.updatePrice(priceId, dto);
  }

  // Deletes a site-specific supplier item price record
  @Delete(':id/site-items/:itemId/prices/:priceId')
  @RequirePermission(SITE_SUPPLIERS.siteItems.prices.delete)
  deleteSiteItemPrice(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('priceId') priceId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/suppliers/${supplierId}/site-items/${itemId}/prices/${priceId}`);
    return this.service.deletePrice(priceId);
  }
}

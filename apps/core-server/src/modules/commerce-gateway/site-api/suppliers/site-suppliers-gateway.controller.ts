import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { type CurrencyAmountDto } from '@vritti/api-sdk/money';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AddSiteSupplierItemPriceDto } from '@commerce/supplier-sites/dto/request/add-site-supplier-item-price.dto';
import { EnrollSiteSupplierDto } from '@commerce/supplier-sites/dto/request/enroll-site-supplier.dto';
import { SiteSupplierItemPriceQueryDto } from '@commerce/supplier-sites/dto/request/site-supplier-item-price-query.dto';
import { UpdateSiteSupplierEnrollmentDto } from '@commerce/supplier-sites/dto/request/update-site-supplier-enrollment.dto';
import { UpdateSiteSupplierItemPriceDto } from '@commerce/supplier-sites/dto/request/update-site-supplier-item-price.dto';
import type { SiteSupplierEnrollmentResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-enrollment-response.dto';
import type { SiteSupplierItemPriceResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-price-response.dto';
import type { SiteSupplierItemPriceTableResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-price-table-response.dto';
import type { SiteSupplierItemResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-response.dto';
import type { SiteSupplierItemTableResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-table-response.dto';
import type { SiteSupplierResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-response.dto';
import type { SiteSupplierTableResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-table-response.dto';
import { SiteSuppliersGatewayService } from './services/site-suppliers-gateway.service';

@ApiTags('Commerce - Site Suppliers')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(SITE_SUPPLIERS.featureCode)
@Controller('site/suppliers')
export class SiteSuppliersGatewayController {
  private readonly logger = new Logger(SiteSuppliersGatewayController.name);

  constructor(private readonly siteSuppliersGatewayService: SiteSuppliersGatewayService) {}

  // Returns the site's enrolled suppliers for the data table with server-stored state
  @Get('table')
  @RequirePermission(SITE_SUPPLIERS.view)
  getSupplierTable(@UserId() userId: string): Promise<SiteSupplierTableResponseDto> {
    this.logger.log('GET /commerce-api/site/suppliers/table');
    return this.siteSuppliersGatewayService.findForTable(userId);
  }

  // Enrolls a supplier for the session site
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_SUPPLIERS.add)
  enroll(@Body() dto: EnrollSiteSupplierDto): Promise<CreateResponseDto<SiteSupplierEnrollmentResponseDto>> {
    this.logger.log('POST /commerce-api/site/suppliers');
    return this.siteSuppliersGatewayService.enroll(dto);
  }

  // Returns the resolved unit price for a supplier-item pair at this site
  @Get('items/price')
  @RequirePermission(SITE_SUPPLIERS.items.view)
  getItemPrice(@Query() query: SiteSupplierItemPriceQueryDto): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    this.logger.log('GET /commerce-api/site/suppliers/items/price');
    return this.siteSuppliersGatewayService.findItemPrice(query.supplierId, query.inventoryItemId, query.uomId);
  }

  // Returns an enrolled supplier with the site's enrollment picks
  @Get(':id')
  @RequirePermission(SITE_SUPPLIERS.view)
  findById(@Param('id') id: string): Promise<SiteSupplierResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${id}`);
    return this.siteSuppliersGatewayService.findById(id);
  }

  // Updates the site's enrollment picks for a supplier
  @Patch(':id/enrollment')
  @RequirePermission(SITE_SUPPLIERS.edit)
  updateEnrollment(@Param('id') id: string, @Body() dto: UpdateSiteSupplierEnrollmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/suppliers/${id}/enrollment`);
    return this.siteSuppliersGatewayService.updateEnrollment(id, dto);
  }

  // Removes the site's enrollment for a supplier
  @Delete(':id/enrollment')
  @RequirePermission(SITE_SUPPLIERS.delete)
  unenroll(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/suppliers/${id}/enrollment`);
    return this.siteSuppliersGatewayService.unenroll(id);
  }

  // Returns an enrolled supplier's items for the data table
  @Get(':id/items/table')
  @RequirePermission(SITE_SUPPLIERS.items.view)
  getSupplierItemsTable(
    @Param('id') supplierId: string,
    @UserId() userId: string,
  ): Promise<SiteSupplierItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/items/table`);
    return this.siteSuppliersGatewayService.findItemsTable(supplierId, userId);
  }

  // Returns a single supplier item by ID
  @Get(':id/items/:itemId')
  @RequirePermission(SITE_SUPPLIERS.items.view)
  findItemById(@Param('id') supplierId: string, @Param('itemId') itemId: string): Promise<SiteSupplierItemResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/items/${itemId}`);
    return this.siteSuppliersGatewayService.findItemById(itemId);
  }

  // Returns the price timeline visible to this site for a supplier item
  @Get(':id/items/:itemId/prices/table')
  @RequirePermission(SITE_SUPPLIERS.prices.view)
  getItemPricesTable(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @UserId() userId: string,
  ): Promise<SiteSupplierItemPriceTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/items/${itemId}/prices/table`);
    return this.siteSuppliersGatewayService.findItemPricesTable(itemId, userId);
  }

  // Adds a site-specific price record to a supplier item's timeline
  @Post(':id/items/:itemId/prices')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_SUPPLIERS.prices.add)
  addItemPrice(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AddSiteSupplierItemPriceDto,
  ): Promise<CreateResponseDto<SiteSupplierItemPriceResponseDto>> {
    this.logger.log(`POST /commerce-api/site/suppliers/${supplierId}/items/${itemId}/prices`);
    return this.siteSuppliersGatewayService.addItemPrice(itemId, dto);
  }

  // Updates a site-specific supplier item price record
  @Patch(':id/items/:itemId/prices/:priceId')
  @RequirePermission(SITE_SUPPLIERS.prices.edit)
  updateItemPrice(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('priceId') priceId: string,
    @Body() dto: UpdateSiteSupplierItemPriceDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/suppliers/${supplierId}/items/${itemId}/prices/${priceId}`);
    return this.siteSuppliersGatewayService.updateItemPrice(itemId, priceId, dto);
  }

  // Deletes a site-specific supplier item price record
  @Delete(':id/items/:itemId/prices/:priceId')
  @RequirePermission(SITE_SUPPLIERS.prices.delete)
  deleteItemPrice(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('priceId') priceId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/suppliers/${supplierId}/items/${itemId}/prices/${priceId}`);
    return this.siteSuppliersGatewayService.deleteItemPrice(itemId, priceId);
  }
}

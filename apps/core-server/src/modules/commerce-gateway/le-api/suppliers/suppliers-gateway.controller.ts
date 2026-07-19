import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { type CurrencyAmountDto } from '@vritti/api-sdk/money';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { LegalEntityId, OrgId } from '@/security/decorators';
import { AddSupplierItemDto } from './dto/request/add-supplier-item.dto';
import { AddSupplierItemPriceDto } from './dto/request/add-supplier-item-price.dto';
import { AddSupplierItemSiteDto } from './dto/request/add-supplier-item-site.dto';
import { AddSupplierSiteDto } from './dto/request/add-supplier-site.dto';
import { BulkSetSupplierItemPreferredDto } from './dto/request/bulk-set-supplier-item-preferred.dto';
import { BulkSetSupplierItemSchemeDto } from './dto/request/bulk-set-supplier-item-scheme.dto';
import { BulkUnlinkSupplierItemsDto } from './dto/request/bulk-unlink-supplier-items.dto';
import { ChangeSupplierCurrencyDto } from './dto/request/change-supplier-currency.dto';
import { CreateSupplierDto } from './dto/request/create-supplier.dto';
import { UpdateSupplierDto } from './dto/request/update-supplier.dto';
import { UpdateSupplierItemDto } from './dto/request/update-supplier-item.dto';
import { UpdateSupplierItemPriceDto } from './dto/request/update-supplier-item-price.dto';
import { UpdateSupplierItemSiteDto } from './dto/request/update-supplier-item-site.dto';
import { UpdateSupplierSiteDto } from './dto/request/update-supplier-site.dto';
import type { SupplierItemPriceResponseDto } from './dto/response/supplier-item-price-response.dto';
import type { SupplierItemPriceTableResponseDto } from './dto/response/supplier-item-price-table-response.dto';
import type { SupplierItemResponseDto } from './dto/response/supplier-item-response.dto';
import type { SupplierItemSiteResponseDto } from './dto/response/supplier-item-site-response.dto';
import type { SupplierItemSiteTableResponseDto } from './dto/response/supplier-item-site-table-response.dto';
import type { SupplierItemTableResponseDto } from './dto/response/supplier-item-table-response.dto';
import type { SupplierResponseDto } from './dto/response/supplier-response.dto';
import type { SupplierSiteResponseDto } from './dto/response/supplier-site-response.dto';
import type { SupplierSiteTableResponseDto } from './dto/response/supplier-site-table-response.dto';
import type { SupplierTableResponseDto } from './dto/response/supplier-table-response.dto';
import { SuppliersGatewayService } from './services/suppliers-gateway.service';

@ApiTags('Commerce - Suppliers')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(LE_SUPPLIERS.featureCode)
@Controller('le/suppliers')
export class SuppliersGatewayController {
  private readonly logger = new Logger(SuppliersGatewayController.name);

  constructor(private readonly suppliersGatewayService: SuppliersGatewayService) {}

  // Returns paginated suppliers for the data table with server-stored state
  @Get('table')
  @RequirePermission(LE_SUPPLIERS.view)
  getSupplierTable(@UserId() userId: string): Promise<SupplierTableResponseDto> {
    this.logger.log('GET /commerce-api/le/suppliers/table');
    return this.suppliersGatewayService.findForTable(userId);
  }

  // Creates a new supplier
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIERS.add)
  create(@Body() dto: CreateSupplierDto): Promise<CreateResponseDto<SupplierResponseDto>> {
    this.logger.log('POST /commerce-api/le/suppliers');
    return this.suppliersGatewayService.create(dto);
  }

  // Returns the unit price for a supplier-item link
  @Get('items/price')
  @RequirePermission(LE_SUPPLIERS.items.view)
  @ApiQuery({ name: 'supplierId', required: true, type: String })
  @ApiQuery({ name: 'inventoryItemId', required: true, type: String })
  @ApiQuery({ name: 'uomId', required: true, type: String })
  getItemPrice(
    @Query('supplierId') supplierId: string,
    @Query('inventoryItemId') inventoryItemId: string,
    @Query('uomId') uomId: string,
  ): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    this.logger.log(`GET /commerce-api/le/suppliers/items/price`);
    return this.suppliersGatewayService.findItemPrice(supplierId, inventoryItemId, uomId);
  }

  // Returns linked items for a supplier table
  @Get(':id/items/table')
  @RequirePermission(LE_SUPPLIERS.items.view)
  getSupplierItemsTable(
    @Param('id') supplierId: string,
    @UserId() userId: string,
  ): Promise<SupplierItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/items/table`);
    return this.suppliersGatewayService.findItemsTable(supplierId, userId);
  }

  // Returns linked inventory item IDs for a supplier
  @Get(':id/items/ids')
  @RequirePermission(LE_SUPPLIERS.view)
  getSupplierItemIds(@Param('id') supplierId: string): Promise<string[]> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/items/ids`);
    return this.suppliersGatewayService.findItemIds(supplierId);
  }

  // Returns a single supplier by ID
  @Get(':id')
  @RequirePermission(LE_SUPPLIERS.view)
  findById(@Param('id') id: string): Promise<SupplierResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${id}`);
    return this.suppliersGatewayService.findById(id);
  }

  // Updates a supplier by ID
  @Patch(':id')
  @RequirePermission(LE_SUPPLIERS.edit)
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${id}`);
    return this.suppliersGatewayService.update(id, dto);
  }

  // Deletes a supplier by ID
  @Delete(':id')
  @RequirePermission(LE_SUPPLIERS.delete)
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/${id}`);
    return this.suppliersGatewayService.delete(id);
  }

  // Changes supplier currency and reprices all supplier items
  @Post(':id/change-currency')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(LE_SUPPLIERS.edit)
  changeCurrency(@Param('id') id: string, @Body() dto: ChangeSupplierCurrencyDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/le/suppliers/${id}/change-currency`);
    return this.suppliersGatewayService.changeCurrency(id, dto);
  }

  // Returns enrolled sites for a supplier table
  @Get(':id/sites/table')
  @RequirePermission(LE_SUPPLIERS.sites.view)
  getSupplierSitesTable(
    @Param('id') supplierId: string,
    @UserId() userId: string,
    @OrgId() orgId: string,
  ): Promise<SupplierSiteTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/sites/table`);
    return this.suppliersGatewayService.findSitesTable(supplierId, userId, orgId);
  }

  // Enrolls a site for a supplier
  @Post(':id/sites')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIERS.sites.add)
  addSite(
    @Param('id') supplierId: string,
    @Body() dto: AddSupplierSiteDto,
    @OrgId() orgId: string,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<CreateResponseDto<SupplierSiteResponseDto>> {
    this.logger.log(`POST /commerce-api/le/suppliers/${supplierId}/sites`);
    return this.suppliersGatewayService.addSite(supplierId, dto, orgId, legalEntityId);
  }

  // Updates a supplier site enrollment
  @Patch(':id/sites/:siteRowId')
  @RequirePermission(LE_SUPPLIERS.sites.edit)
  updateSite(
    @Param('id') supplierId: string,
    @Param('siteRowId') siteRowId: string,
    @Body() dto: UpdateSupplierSiteDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/sites/${siteRowId}`);
    return this.suppliersGatewayService.updateSite(supplierId, siteRowId, dto);
  }

  // Removes a supplier site enrollment
  @Delete(':id/sites/:siteRowId')
  @RequirePermission(LE_SUPPLIERS.sites.delete)
  removeSite(@Param('id') supplierId: string, @Param('siteRowId') siteRowId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/${supplierId}/sites/${siteRowId}`);
    return this.suppliersGatewayService.removeSite(supplierId, siteRowId);
  }

  // Adds an inventory item to a supplier
  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIERS.items.add)
  addItem(
    @Param('id') supplierId: string,
    @Body() dto: AddSupplierItemDto,
  ): Promise<CreateResponseDto<SupplierItemResponseDto>> {
    this.logger.log(`POST /commerce-api/le/suppliers/${supplierId}/items`);
    return this.suppliersGatewayService.addItem(supplierId, dto);
  }

  // Bulk-sets the free-goods scheme on multiple supplier items; declared before :itemId so "scheme" is not captured as an item id
  @Patch(':id/items/scheme')
  @RequirePermission(LE_SUPPLIERS.items.edit)
  bulkSetItemScheme(
    @Param('id') supplierId: string,
    @Body() dto: BulkSetSupplierItemSchemeDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/items/scheme`);
    return this.suppliersGatewayService.bulkSetItemScheme(supplierId, dto);
  }

  // Bulk-marks supplier items as preferred; declared before :itemId so "preferred" is not captured as an item id
  @Patch(':id/items/preferred')
  @RequirePermission(LE_SUPPLIERS.items.edit)
  bulkSetItemPreferred(
    @Param('id') supplierId: string,
    @Body() dto: BulkSetSupplierItemPreferredDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/items/preferred`);
    return this.suppliersGatewayService.bulkSetItemPreferred(supplierId, dto);
  }

  // Returns a single supplier item by ID
  @Get(':id/items/:itemId')
  @RequirePermission(LE_SUPPLIERS.items.view)
  findItemById(@Param('id') supplierId: string, @Param('itemId') itemId: string): Promise<SupplierItemResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/items/${itemId}`);
    return this.suppliersGatewayService.findItemById(itemId);
  }

  // Updates a supplier item link
  @Patch(':id/items/:itemId')
  @RequirePermission(LE_SUPPLIERS.items.edit)
  updateItem(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateSupplierItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/items/${itemId}`);
    return this.suppliersGatewayService.updateItem(supplierId, itemId, dto);
  }

  // Unlinks an inventory item from a supplier
  @Delete(':id/items/:itemId')
  @RequirePermission(LE_SUPPLIERS.items.delete)
  unlinkItem(@Param('id') supplierId: string, @Param('itemId') itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/${supplierId}/items/${itemId}`);
    return this.suppliersGatewayService.unlinkItem(supplierId, itemId);
  }

  // Bulk-unlinks multiple inventory items from a supplier
  @Delete(':id/items')
  @RequirePermission(LE_SUPPLIERS.items.delete)
  bulkUnlinkItems(
    @Param('id') supplierId: string,
    @Body() dto: BulkUnlinkSupplierItemsDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/${supplierId}/items`);
    return this.suppliersGatewayService.bulkUnlinkItems(supplierId, dto);
  }

  // Returns the price timeline of a supplier item for the table
  @Get(':id/items/:itemId/prices/table')
  @RequirePermission(LE_SUPPLIERS.prices.view)
  getItemPricesTable(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @UserId() userId: string,
  ): Promise<SupplierItemPriceTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/items/${itemId}/prices/table`);
    return this.suppliersGatewayService.findItemPricesTable(itemId, userId);
  }

  // Adds a price record to a supplier item's timeline
  @Post(':id/items/:itemId/prices')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIERS.prices.add)
  addItemPrice(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AddSupplierItemPriceDto,
  ): Promise<CreateResponseDto<SupplierItemPriceResponseDto>> {
    this.logger.log(`POST /commerce-api/le/suppliers/${supplierId}/items/${itemId}/prices`);
    return this.suppliersGatewayService.addItemPrice(itemId, dto);
  }

  // Updates a supplier item price record
  @Patch(':id/items/:itemId/prices/:priceId')
  @RequirePermission(LE_SUPPLIERS.prices.edit)
  updateItemPrice(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('priceId') priceId: string,
    @Body() dto: UpdateSupplierItemPriceDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/items/${itemId}/prices/${priceId}`);
    return this.suppliersGatewayService.updateItemPrice(itemId, priceId, dto);
  }

  // Deletes a supplier item price record
  @Delete(':id/items/:itemId/prices/:priceId')
  @RequirePermission(LE_SUPPLIERS.prices.delete)
  deleteItemPrice(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('priceId') priceId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/${supplierId}/items/${itemId}/prices/${priceId}`);
    return this.suppliersGatewayService.deleteItemPrice(itemId, priceId);
  }

  // Returns per-site overrides of a supplier item for the table
  @Get(':id/items/:itemId/sites/table')
  @RequirePermission(LE_SUPPLIERS.items.view)
  getItemSitesTable(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @UserId() userId: string,
    @OrgId() orgId: string,
  ): Promise<SupplierItemSiteTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/items/${itemId}/sites/table`);
    return this.suppliersGatewayService.findItemSitesTable(itemId, userId, orgId);
  }

  // Adds a per-site override to a supplier item
  @Post(':id/items/:itemId/sites')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIERS.items.edit)
  addItemSite(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AddSupplierItemSiteDto,
    @OrgId() orgId: string,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<CreateResponseDto<SupplierItemSiteResponseDto>> {
    this.logger.log(`POST /commerce-api/le/suppliers/${supplierId}/items/${itemId}/sites`);
    return this.suppliersGatewayService.addItemSite(itemId, dto, orgId, legalEntityId);
  }

  // Updates a supplier item's per-site override
  @Patch(':id/items/:itemId/sites/:rowId')
  @RequirePermission(LE_SUPPLIERS.items.edit)
  updateItemSite(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('rowId') rowId: string,
    @Body() dto: UpdateSupplierItemSiteDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/items/${itemId}/sites/${rowId}`);
    return this.suppliersGatewayService.updateItemSite(itemId, rowId, dto);
  }

  // Deletes a supplier item's per-site override
  @Delete(':id/items/:itemId/sites/:rowId')
  @RequirePermission(LE_SUPPLIERS.items.edit)
  deleteItemSite(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('rowId') rowId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/${supplierId}/items/${itemId}/sites/${rowId}`);
    return this.suppliersGatewayService.deleteItemSite(itemId, rowId);
  }
}

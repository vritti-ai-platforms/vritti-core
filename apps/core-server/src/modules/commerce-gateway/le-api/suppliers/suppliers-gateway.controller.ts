import type { SupplierQuotationTableResponseDto } from '@commerce/supplier-quotations/dto/response/supplier-quotation-table-response.dto';
import type { SiteSupplierItemResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-response.dto';
import type { SiteSupplierItemTableResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-table-response.dto';
import type { SupplierAtSiteResponseDto } from '@commerce/supplier-sites/dto/response/supplier-at-site-response.dto';
import { AddSupplierItemDto } from '@commerce/suppliers/dto/request/add-supplier-item.dto';
import { AddSupplierItemSiteDto } from '@commerce/suppliers/dto/request/add-supplier-item-site.dto';
import { AddSupplierSiteDto } from '@commerce/suppliers/dto/request/add-supplier-site.dto';
import { BulkSetSupplierActiveDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-active.dto';
import { BulkSetSupplierItemLeadTimeDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-item-lead-time.dto';
import { BulkSetSupplierItemMinOrderDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-item-min-order.dto';
import { BulkSetSupplierItemPreferredDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-item-preferred.dto';
import { ChangeSupplierCurrencyDto } from '@commerce/suppliers/dto/request/change-supplier-currency.dto';
import { CreateSupplierDto } from '@commerce/suppliers/dto/request/create-supplier.dto';
import { SetSupplierActiveDto } from '@commerce/suppliers/dto/request/set-supplier-active.dto';
import { UpdateSupplierDto } from '@commerce/suppliers/dto/request/update-supplier.dto';
import { UpdateSupplierItemDto } from '@commerce/suppliers/dto/request/update-supplier-item.dto';
import { UpdateSupplierItemSiteDto } from '@commerce/suppliers/dto/request/update-supplier-item-site.dto';
import { UpdateSupplierSiteDto } from '@commerce/suppliers/dto/request/update-supplier-site.dto';
import type { SupplierItemResponseDto } from '@commerce/suppliers/dto/response/supplier-item-response.dto';
import type { SupplierItemSiteResponseDto } from '@commerce/suppliers/dto/response/supplier-item-site-response.dto';
import type { SupplierItemSiteTableResponseDto } from '@commerce/suppliers/dto/response/supplier-item-site-table-response.dto';
import type { SupplierItemTableResponseDto } from '@commerce/suppliers/dto/response/supplier-item-table-response.dto';
import type { SupplierResponseDto } from '@commerce/suppliers/dto/response/supplier-response.dto';
import type { SupplierSiteResponseDto } from '@commerce/suppliers/dto/response/supplier-site-response.dto';
import type { SupplierSiteTableResponseDto } from '@commerce/suppliers/dto/response/supplier-site-table-response.dto';
import type { SupplierTableResponseDto } from '@commerce/suppliers/dto/response/supplier-table-response.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { LegalEntityId, OrgId } from '@/security/decorators';
import { SupplierQuotationsGatewayService } from './services/supplier-quotations-gateway.service';
import { SuppliersGatewayService } from './services/suppliers-gateway.service';

@ApiTags('Commerce - Suppliers')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_SUPPLIERS.featureCode)
@Controller('le/suppliers')
export class SuppliersGatewayController {
  private readonly logger = new Logger(SuppliersGatewayController.name);

  constructor(
    private readonly suppliersGatewayService: SuppliersGatewayService,
    private readonly quotationsGatewayService: SupplierQuotationsGatewayService,
  ) {}

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

  // Bulk-activates or deactivates suppliers
  @Patch('active')
  @RequirePermission(LE_SUPPLIERS.toggle)
  bulkSetActive(@Body() dto: BulkSetSupplierActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/active — ${dto.ids.length} selected`);
    return this.suppliersGatewayService.bulkSetActive(dto);
  }

  // Activates or deactivates a supplier
  @Patch(':id/active')
  @RequirePermission(LE_SUPPLIERS.toggle)
  setActive(@Param('id') id: string, @Body() dto: SetSupplierActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${id}/active`);
    return this.suppliersGatewayService.setActive(id, dto.isActive);
  }

  // Deletes a supplier by ID
  @Delete(':id')
  @RequirePermission(LE_SUPPLIERS.delete)
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/${id}`);
    return this.suppliersGatewayService.delete(id);
  }

  // Sets the currencies a supplier trades in and its default; prices are never converted
  @Post(':id/change-currency')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(LE_SUPPLIERS.currency.edit)
  changeCurrency(@Param('id') id: string, @Body() dto: ChangeSupplierCurrencyDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/le/suppliers/${id}/change-currency`);
    return this.suppliersGatewayService.changeCurrency(id, dto);
  }

  // Returns every site of the legal entity with the supplier's enrollment status there
  @Get(':id/sites/table')
  @RequirePermission(LE_SUPPLIERS.sites.view)
  getSupplierSitesTable(
    @Param('id') supplierId: string,
    @UserId() userId: string,
    @OrgId() orgId: string,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<SupplierSiteTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/sites/table`);
    return this.suppliersGatewayService.findSitesTable(supplierId, userId, orgId, legalEntityId);
  }

  // Returns a supplier as one of the LE's sites sees it — commercial identity plus that site's enrollment
  @Get(':id/sites/:siteId')
  @RequirePermission(LE_SUPPLIERS.sites.view)
  findAtSite(
    @Param('id') supplierId: string,
    @Param('siteId') siteId: string,
    @OrgId() orgId: string,
  ): Promise<SupplierAtSiteResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/sites/${siteId}`);
    return this.suppliersGatewayService.findAtSite(supplierId, siteId, orgId);
  }

  // Returns a supplier's items carried by one of the LE's sites for the table
  @Get(':id/sites/:siteId/items/table')
  @RequirePermission(LE_SUPPLIERS.sites.items.view)
  getSiteItemsTable(
    @Param('id') supplierId: string,
    @Param('siteId') siteId: string,
    @UserId() userId: string,
  ): Promise<SiteSupplierItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/sites/${siteId}/items/table`);
    return this.suppliersGatewayService.findSiteItemsTable(supplierId, siteId, userId);
  }

  // Returns a supplier's quotations posted to one of the LE's sites for the table
  @Get(':id/sites/:siteId/quotations/table')
  @RequirePermission(LE_SUPPLIERS.sites.quotations.view)
  getSiteQuotationsTable(
    @Param('id') supplierId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @UserId() userId: string,
  ): Promise<SupplierQuotationTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/sites/${siteId}/quotations/table`);
    return this.quotationsGatewayService.findForSiteTable(supplierId, siteId, userId);
  }

  // Returns a supplier item as one of the LE's sites carries it
  @Get(':id/sites/:siteId/items/:itemId')
  @RequirePermission(LE_SUPPLIERS.sites.items.view)
  findSiteItem(
    @Param('id') supplierId: string,
    @Param('siteId') siteId: string,
    @Param('itemId') itemId: string,
  ): Promise<SiteSupplierItemResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/sites/${siteId}/items/${itemId}`);
    return this.suppliersGatewayService.findSiteItem(itemId, siteId);
  }

  // Enrolls a site for a supplier
  @Post(':id/sites')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIERS.sites.enroll)
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
  @RequirePermission(LE_SUPPLIERS.sites.editEnroll)
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
  @RequirePermission(LE_SUPPLIERS.sites.unenroll)
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

  // Bulk-marks supplier items as preferred at chosen sites; declared before :itemId so "preferred" is not captured as an item id
  @Patch(':id/items/preferred')
  @RequirePermission(LE_SUPPLIERS.sites.items.edit)
  bulkSetItemPreferred(
    @Param('id') supplierId: string,
    @Body() dto: BulkSetSupplierItemPreferredDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/items/preferred`);
    return this.suppliersGatewayService.bulkSetItemPreferred(supplierId, dto);
  }

  // Bulk-sets the minimum order of supplier items; declared before :itemId so "min-order" is not captured as an item id
  @Patch(':id/items/min-order')
  @RequirePermission(LE_SUPPLIERS.items.edit)
  bulkSetItemMinOrder(
    @Param('id') supplierId: string,
    @Body() dto: BulkSetSupplierItemMinOrderDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/items/min-order`);
    return this.suppliersGatewayService.bulkSetItemMinOrder(supplierId, dto);
  }

  // Bulk-sets the lead time of supplier items; declared before :itemId so "lead-time" is not captured as an item id
  @Patch(':id/items/lead-time')
  @RequirePermission(LE_SUPPLIERS.items.edit)
  bulkSetItemLeadTime(
    @Param('id') supplierId: string,
    @Body() dto: BulkSetSupplierItemLeadTimeDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/items/lead-time`);
    return this.suppliersGatewayService.bulkSetItemLeadTime(supplierId, dto);
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

  // Returns per-site overrides of a supplier item for the table
  @Get(':id/items/:itemId/sites/table')
  @RequirePermission(LE_SUPPLIERS.sites.items.view)
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
  @RequirePermission(LE_SUPPLIERS.sites.items.add)
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
  @RequirePermission(LE_SUPPLIERS.sites.items.edit)
  updateItemSite(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('rowId') rowId: string,
    @Body() dto: UpdateSupplierItemSiteDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/items/${itemId}/sites/${rowId}`);
    return this.suppliersGatewayService.updateItemSite(rowId, dto);
  }

  // Deletes a supplier item's per-site override
  @Delete(':id/items/:itemId/sites/:rowId')
  @RequirePermission(LE_SUPPLIERS.sites.items.delete)
  deleteItemSite(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('rowId') rowId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/${supplierId}/items/${itemId}/sites/${rowId}`);
    return this.suppliersGatewayService.deleteItemSite(rowId);
  }
}

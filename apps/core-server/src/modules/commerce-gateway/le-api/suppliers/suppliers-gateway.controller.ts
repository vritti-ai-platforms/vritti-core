import { CreateSupplierEnrollmentDto } from '@commerce/supplier-enrollments/dto/request/create-supplier-enrollment.dto';
import { SetSupplierEnrollmentActiveDto } from '@commerce/supplier-enrollments/dto/request/set-supplier-enrollment-active.dto';
import { SupplierEnrollmentSiteParamsDto } from '@commerce/supplier-enrollments/dto/request/supplier-enrollment-site-params.dto';
import { UpdateEnrollmentPurchasingDto } from '@commerce/supplier-enrollments/dto/request/update-enrollment-purchasing.dto';
import { UpdateSupplierEnrollmentDto } from '@commerce/supplier-enrollments/dto/request/update-supplier-enrollment.dto';
import type { CreatedSupplierEnrollmentResponseDto } from '@commerce/supplier-enrollments/dto/response/created-supplier-enrollment-response.dto';
import type { SupplierEnrollmentCountsResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-counts-response.dto';
import type { SupplierEnrollmentDetailResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-detail-response.dto';
import type { SupplierEnrollmentTableResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-table-response.dto';
import { AddSupplierSiteItemDto } from '@commerce/supplier-items/dto/request/add-supplier-site-item.dto';
import { BulkSetSupplierSiteItemPreferredDto } from '@commerce/supplier-items/dto/request/bulk-set-supplier-site-item-preferred.dto';
import { UpdateSupplierSiteItemDto } from '@commerce/supplier-items/dto/request/update-supplier-site-item.dto';
import type { SupplierItemCountsResponseDto } from '@commerce/supplier-items/dto/response/supplier-item-counts-response.dto';
import type { SupplierSiteItemResponseDto } from '@commerce/supplier-items/dto/response/supplier-site-item-response.dto';
import type { SupplierSiteItemRowTableResponseDto } from '@commerce/supplier-items/dto/response/supplier-site-item-row-table-response.dto';
import type { SupplierSiteItemTableResponseDto } from '@commerce/supplier-items/dto/response/supplier-site-item-table-response.dto';
import type { SupplierQuotationTableResponseDto } from '@commerce/supplier-quotations/dto/response/supplier-quotation-table-response.dto';
import { AddSupplierItemDto } from '@commerce/suppliers/dto/request/add-supplier-item.dto';
import { BulkSetSupplierActiveDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-active.dto';
import { BulkSetSupplierDefaultPaymentTermDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-default-payment-term.dto';
import { BulkSetSupplierItemDefaultLeadTimeDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-item-default-lead-time.dto';
import { BulkSetSupplierItemMinOrderDto } from '@commerce/suppliers/dto/request/bulk-set-supplier-item-min-order.dto';
import { ChangeSupplierCurrencyDto } from '@commerce/suppliers/dto/request/change-supplier-currency.dto';
import { CreateSupplierDto } from '@commerce/suppliers/dto/request/create-supplier.dto';
import { SetSupplierActiveDto } from '@commerce/suppliers/dto/request/set-supplier-active.dto';
import { SetSupplierDefaultPaymentTermDto } from '@commerce/suppliers/dto/request/set-supplier-default-payment-term.dto';
import { SetSupplierPaymentBlockedDto } from '@commerce/suppliers/dto/request/set-supplier-payment-blocked.dto';
import { SetSupplierPurchasingBlockedDto } from '@commerce/suppliers/dto/request/set-supplier-purchasing-blocked.dto';
import { UpdateSupplierDto } from '@commerce/suppliers/dto/request/update-supplier.dto';
import { UpdateSupplierItemDto } from '@commerce/suppliers/dto/request/update-supplier-item.dto';
import type { CreatedSupplierResponseDto } from '@commerce/suppliers/dto/response/created-supplier-response.dto';
import type { SupplierCountsResponseDto } from '@commerce/suppliers/dto/response/supplier-counts-response.dto';
import type { SupplierItemResponseDto } from '@commerce/suppliers/dto/response/supplier-item-response.dto';
import type { SupplierItemTableResponseDto } from '@commerce/suppliers/dto/response/supplier-item-table-response.dto';
import type { SupplierResponseDto } from '@commerce/suppliers/dto/response/supplier-response.dto';
import type { SupplierTableResponseDto } from '@commerce/suppliers/dto/response/supplier-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { LegalEntityId, OrgId } from '@/security/decorators';
import {
  ApiFindSupplierCounts,
  ApiFindSupplierEnrollmentCounts,
  ApiFindSupplierItemCounts,
} from './docs/suppliers-gateway.docs';
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

  // Creates a new supplier
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIERS.add)
  create(@Body() dto: CreateSupplierDto): Promise<CreateResponseDto<CreatedSupplierResponseDto>> {
    this.logger.log('POST /commerce-api/le/suppliers');
    return this.suppliersGatewayService.create(dto);
  }

  // Enrolls the supplier at one of the LE's sites
  @Post(':id/enrollments')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIERS.sites.enroll)
  createEnrollment(
    @Param('id') supplierId: string,
    @Body() dto: CreateSupplierEnrollmentDto,
  ): Promise<CreateResponseDto<CreatedSupplierEnrollmentResponseDto>> {
    this.logger.log(`POST /commerce-api/le/suppliers/${supplierId}/enrollments`);
    return this.suppliersGatewayService.createEnrollment(supplierId, dto);
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

  // Sets a supplier item up at one of the LE's sites
  @Post(':id/items/:itemId/site-items')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIERS.siteItems.add)
  createSiteItem(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AddSupplierSiteItemDto,
  ): Promise<CreateResponseDto<SupplierSiteItemResponseDto>> {
    this.logger.log(`POST /commerce-api/le/suppliers/${supplierId}/items/${itemId}/site-items`);
    return this.suppliersGatewayService.createSiteItem(itemId, dto);
  }

  // Updates a supplier by ID
  @Patch(':id')
  @RequirePermission(LE_SUPPLIERS.edit)
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${id}`);
    return this.suppliersGatewayService.update(id, dto);
  }

  // Updates the supplier's enrollment picks and flags at one of the LE's sites
  @Patch(':id/enrollments/:siteId')
  @RequirePermission(LE_SUPPLIERS.sites.editEnroll)
  updateEnrollment(
    @Param() { id: supplierId, siteId }: SupplierEnrollmentSiteParamsDto,
    @Body() dto: UpdateSupplierEnrollmentDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/enrollments/${siteId}`);
    return this.suppliersGatewayService.updateEnrollment(supplierId, siteId, dto);
  }

  // Updates the supplier's purchasing settings at one of the LE's sites
  @Patch(':id/enrollments/:siteId/purchasing')
  @RequirePermission(LE_SUPPLIERS.sites.editEnroll)
  updateEnrollmentPurchasing(
    @Param() { id: supplierId, siteId }: SupplierEnrollmentSiteParamsDto,
    @Body() dto: UpdateEnrollmentPurchasingDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/enrollments/${siteId}/purchasing`);
    return this.suppliersGatewayService.updateEnrollmentPurchasing(supplierId, siteId, dto);
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

  // Updates a supplier item's settings at one site
  @Patch(':id/items/:itemId/site-items/:siteItemId')
  @RequirePermission(LE_SUPPLIERS.siteItems.edit)
  updateSiteItem(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('siteItemId') supplierSiteItemId: string,
    @Body() dto: UpdateSupplierSiteItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/items/${itemId}/site-items/${supplierSiteItemId}`);
    return this.suppliersGatewayService.updateSiteItem(supplierSiteItemId, dto);
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

  // Sets the default payment term of several suppliers at once
  @Patch('default-payment-term')
  @RequirePermission(LE_SUPPLIERS.defaultPaymentTerm)
  bulkSetDefaultPaymentTerm(@Body() dto: BulkSetSupplierDefaultPaymentTermDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/default-payment-term — ${dto.ids.length} selected`);
    return this.suppliersGatewayService.bulkSetDefaultPaymentTerm(dto);
  }

  // Sets the payment term new site enrollments of a supplier start from
  @Patch(':id/default-payment-term')
  @RequirePermission(LE_SUPPLIERS.defaultPaymentTerm)
  setDefaultPaymentTerm(
    @Param('id') id: string,
    @Body() dto: SetSupplierDefaultPaymentTermDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${id}/default-payment-term`);
    return this.suppliersGatewayService.setDefaultPaymentTerm(id, dto.defaultPaymentTermId);
  }

  // Blocks or unblocks new purchase orders and goods receipts from a supplier
  @Patch(':id/purchasing-blocked')
  @RequirePermission(LE_SUPPLIERS.purchasingBlock)
  setPurchasingBlocked(
    @Param('id') id: string,
    @Body() dto: SetSupplierPurchasingBlockedDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${id}/purchasing-blocked`);
    return this.suppliersGatewayService.setPurchasingBlocked(id, dto.purchasingBlocked);
  }

  // Blocks or unblocks payments to a supplier
  @Patch(':id/payment-blocked')
  @RequirePermission(LE_SUPPLIERS.paymentBlock)
  setPaymentBlocked(@Param('id') id: string, @Body() dto: SetSupplierPaymentBlockedDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${id}/payment-blocked`);
    return this.suppliersGatewayService.setPaymentBlocked(id, dto.paymentBlocked);
  }

  // Sets the currencies a supplier trades in and its default; prices are never converted
  @Post(':id/change-currency')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(LE_SUPPLIERS.currency.edit)
  changeCurrency(@Param('id') id: string, @Body() dto: ChangeSupplierCurrencyDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/le/suppliers/${id}/change-currency`);
    return this.suppliersGatewayService.changeCurrency(id, dto);
  }

  // Activates or deactivates the supplier's own enrollment at one of the LE's sites
  @Patch(':id/enrollments/:siteId/active')
  @RequirePermission(LE_SUPPLIERS.sites.editEnroll)
  setEnrollmentActive(
    @Param() { id: supplierId, siteId }: SupplierEnrollmentSiteParamsDto,
    @Body() dto: SetSupplierEnrollmentActiveDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/enrollments/${siteId}/active`);
    return this.suppliersGatewayService.setEnrollmentActive(supplierId, siteId, dto.isActive);
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

  // Bulk-sets the default lead time of supplier items; declared before :itemId so "default-lead-time" is not captured as an item id
  @Patch(':id/items/default-lead-time')
  @RequirePermission(LE_SUPPLIERS.items.edit)
  bulkSetItemDefaultLeadTime(
    @Param('id') supplierId: string,
    @Body() dto: BulkSetSupplierItemDefaultLeadTimeDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/items/default-lead-time`);
    return this.suppliersGatewayService.bulkSetItemDefaultLeadTime(supplierId, dto);
  }

  // Bulk-marks supplier items as preferred at chosen sites
  @Patch(':id/site-items/preferred')
  @RequirePermission(LE_SUPPLIERS.siteItems.edit)
  bulkSetSiteItemsPreferred(
    @Param('id') supplierId: string,
    @Body() dto: BulkSetSupplierSiteItemPreferredDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/${supplierId}/site-items/preferred`);
    return this.suppliersGatewayService.bulkSetSiteItemsPreferred(supplierId, dto);
  }

  // Returns a single supplier by ID
  @Get(':id')
  @RequirePermission(LE_SUPPLIERS.view)
  findById(@Param('id') id: string): Promise<SupplierResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${id}`);
    return this.suppliersGatewayService.findById(id);
  }

  // Returns a single supplier item by ID
  @Get(':id/items/:itemId')
  @RequirePermission(LE_SUPPLIERS.items.view)
  findItemById(@Param('id') supplierId: string, @Param('itemId') itemId: string): Promise<SupplierItemResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/items/${itemId}`);
    return this.suppliersGatewayService.findItemById(itemId);
  }

  // Returns paginated suppliers for the data table with server-stored state
  @Get('table')
  @RequirePermission(LE_SUPPLIERS.view)
  getSupplierTable(@UserId() userId: string): Promise<SupplierTableResponseDto> {
    this.logger.log('GET /commerce-api/le/suppliers/table');
    return this.suppliersGatewayService.findForTable(userId);
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

  // Returns every site of the legal entity with the supplier's enrollment there
  @Get(':id/enrollments/table')
  @RequirePermission(LE_SUPPLIERS.sites.view)
  getEnrollmentsTable(
    @Param('id') supplierId: string,
    @UserId() userId: string,
    @OrgId() orgId: string,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<SupplierEnrollmentTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/enrollments/table`);
    return this.suppliersGatewayService.findEnrollmentsTable(supplierId, userId, orgId, legalEntityId);
  }

  // Returns a supplier's site items at one of the LE's sites for the table
  @Get(':id/enrollments/:siteId/site-items/table')
  @RequirePermission(LE_SUPPLIERS.siteItems.view)
  getEnrollmentSiteItemsTable(
    @Param() { id: supplierId, siteId }: SupplierEnrollmentSiteParamsDto,
    @UserId() userId: string,
  ): Promise<SupplierSiteItemRowTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/enrollments/${siteId}/site-items/table`);
    return this.suppliersGatewayService.findEnrollmentSiteItemsTable(supplierId, siteId, userId);
  }

  // Returns a supplier's quotations posted to one of the LE's sites for the table
  @Get(':id/enrollments/:siteId/quotations/table')
  @RequirePermission(LE_SUPPLIERS.sites.quotations.view)
  getEnrollmentQuotationsTable(
    @Param() { id: supplierId, siteId }: SupplierEnrollmentSiteParamsDto,
    @UserId() userId: string,
    @OrgId() orgId: string,
  ): Promise<SupplierQuotationTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/enrollments/${siteId}/quotations/table`);
    return this.quotationsGatewayService.findEnrollmentQuotationsTable(supplierId, siteId, userId, orgId);
  }

  // Returns the site items of a supplier item for the table
  @Get(':id/items/:itemId/site-items/table')
  @RequirePermission(LE_SUPPLIERS.siteItems.view)
  getSiteItemsTable(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @UserId() userId: string,
    @OrgId() orgId: string,
  ): Promise<SupplierSiteItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/items/${itemId}/site-items/table`);
    return this.suppliersGatewayService.findSiteItemsTable(itemId, userId, orgId);
  }

  // Returns the supplier's enrollment at one of the LE's sites with its commercial identity, enrolled or not
  @Get(':id/enrollments/:siteId')
  @RequirePermission(LE_SUPPLIERS.sites.view)
  findEnrollment(
    @Param() { id: supplierId, siteId }: SupplierEnrollmentSiteParamsDto,
    @OrgId() orgId: string,
  ): Promise<SupplierEnrollmentDetailResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/enrollments/${siteId}`);
    return this.suppliersGatewayService.findEnrollment(supplierId, siteId, orgId);
  }

  // Counts a supplier's items, site enrollments, quotations and people, one per tab of its detail page
  @Get(':id/counts')
  @RequirePermission(LE_SUPPLIERS.view)
  @ApiFindSupplierCounts()
  findCounts(
    @Param('id') id: string,
    @OrgId() orgId: string,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<SupplierCountsResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${id}/counts`);
    return this.suppliersGatewayService.findCounts(id, orgId, legalEntityId);
  }

  // Counts a supplier item's sites and prices, one per tab of its detail page
  @Get(':id/items/:itemId/counts')
  @RequirePermission(LE_SUPPLIERS.items.view)
  @ApiFindSupplierItemCounts()
  findItemCounts(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
  ): Promise<SupplierItemCountsResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/items/${itemId}/counts`);
    return this.suppliersGatewayService.findItemCounts(itemId);
  }

  // Counts a supplier's items and quotations at one of the LE's sites, one per tab of its enrollment page
  @Get(':id/enrollments/:siteId/counts')
  @RequirePermission(LE_SUPPLIERS.sites.view)
  @ApiFindSupplierEnrollmentCounts()
  findEnrollmentCounts(
    @Param() { id: supplierId, siteId }: SupplierEnrollmentSiteParamsDto,
  ): Promise<SupplierEnrollmentCountsResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/enrollments/${siteId}/counts`);
    return this.suppliersGatewayService.findEnrollmentCounts(supplierId, siteId);
  }

  // Deletes a supplier by ID
  @Delete(':id')
  @RequirePermission(LE_SUPPLIERS.delete)
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/${id}`);
    return this.suppliersGatewayService.delete(id);
  }

  // Removes the supplier's enrollment at one of the LE's sites
  @Delete(':id/enrollments/:siteId')
  @RequirePermission(LE_SUPPLIERS.sites.unenroll)
  deleteEnrollment(@Param() { id: supplierId, siteId }: SupplierEnrollmentSiteParamsDto): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/${supplierId}/enrollments/${siteId}`);
    return this.suppliersGatewayService.deleteEnrollment(supplierId, siteId);
  }

  // Unlinks an inventory item from a supplier
  @Delete(':id/items/:itemId')
  @RequirePermission(LE_SUPPLIERS.items.delete)
  unlinkItem(@Param('id') supplierId: string, @Param('itemId') itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/${supplierId}/items/${itemId}`);
    return this.suppliersGatewayService.unlinkItem(supplierId, itemId);
  }

  // Removes a supplier item from one site
  @Delete(':id/items/:itemId/site-items/:siteItemId')
  @RequirePermission(LE_SUPPLIERS.siteItems.delete)
  deleteSiteItem(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('siteItemId') supplierSiteItemId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/${supplierId}/items/${itemId}/site-items/${supplierSiteItemId}`);
    return this.suppliersGatewayService.deleteSiteItem(supplierSiteItemId);
  }
}

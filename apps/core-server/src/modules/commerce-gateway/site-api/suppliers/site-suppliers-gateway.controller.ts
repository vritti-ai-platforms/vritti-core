import { CreateSupplierEnrollmentDto } from '@commerce/supplier-enrollments/dto/request/create-supplier-enrollment.dto';
import { SetSupplierEnrollmentActiveDto } from '@commerce/supplier-enrollments/dto/request/set-supplier-enrollment-active.dto';
import { UpdateSupplierEnrollmentDto } from '@commerce/supplier-enrollments/dto/request/update-supplier-enrollment.dto';
import type { CreatedSupplierEnrollmentResponseDto } from '@commerce/supplier-enrollments/dto/response/created-supplier-enrollment-response.dto';
import type { SupplierEnrollmentCountsResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-counts-response.dto';
import type { SupplierEnrollmentDetailResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-detail-response.dto';
import type { SupplierEnrollmentTableResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-table-response.dto';
import { CreateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/create-supplier-invoice.dto';
import { InvoiceableGoodsReceiptsQueryDto } from '@commerce/supplier-invoices/dto/request/invoiceable-goods-receipts-query.dto';
import { ReleaseSupplierInvoiceHoldDto } from '@commerce/supplier-invoices/dto/request/release-supplier-invoice-hold.dto';
import { SupplierInvoiceLineDto } from '@commerce/supplier-invoices/dto/request/supplier-invoice-line.dto';
import { UpdateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/update-supplier-invoice.dto';
import type { InvoiceableGoodsReceiptResponseDto } from '@commerce/supplier-invoices/dto/response/invoiceable-goods-receipt-response.dto';
import type { SupplierInvoiceCountsResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-counts-response.dto';
import type {
  SupplierInvoiceDetailResponseDto,
  SupplierInvoiceResponseDto,
} from '@commerce/supplier-invoices/dto/response/supplier-invoice-response.dto';
import type { SupplierInvoiceTableResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-table-response.dto';
import { UpdateSupplierSiteItemDto } from '@commerce/supplier-items/dto/request/update-supplier-site-item.dto';
import type { SupplierItemCountsResponseDto } from '@commerce/supplier-items/dto/response/supplier-item-counts-response.dto';
import type { SupplierSiteItemRowResponseDto } from '@commerce/supplier-items/dto/response/supplier-site-item-row-response.dto';
import type { SupplierSiteItemRowTableResponseDto } from '@commerce/supplier-items/dto/response/supplier-site-item-row-table-response.dto';
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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import {
  ApiCreateSiteSupplierInvoice,
  ApiCreateSiteSupplierInvoiceLine,
  ApiDeleteSiteSupplierInvoiceLine,
  ApiFindForTableSiteSupplierInvoices,
  ApiFindSiteSupplierCounts,
  ApiFindSiteSupplierInvoiceableGoodsReceipts,
  ApiFindSiteSupplierInvoiceById,
  ApiFindSiteSupplierInvoiceCounts,
  ApiFindSiteSupplierSiteItemCounts,
  ApiPostSiteSupplierInvoice,
  ApiReleaseSiteSupplierInvoiceHold,
  ApiUpdateSiteSupplierInvoice,
  ApiUpdateSiteSupplierInvoiceLine,
} from './docs/site-suppliers-gateway.docs';
import { SiteSuppliersGatewayService } from './services/site-suppliers-gateway.service';

@ApiTags('Commerce - Site Suppliers')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_SUPPLIERS.featureCode)
@Controller('site/suppliers')
export class SiteSuppliersGatewayController {
  private readonly logger = new Logger(SiteSuppliersGatewayController.name);

  constructor(private readonly siteSuppliersGatewayService: SiteSuppliersGatewayService) {}

  // Enrolls a supplier at the session site
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_SUPPLIERS.enroll)
  create(@Body() dto: CreateSupplierEnrollmentDto): Promise<CreateResponseDto<CreatedSupplierEnrollmentResponseDto>> {
    this.logger.log('POST /commerce-api/site/suppliers');
    return this.siteSuppliersGatewayService.create(dto);
  }

  // Records a draft invoice of the supplier at this site
  @Post(':id/invoices')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_SUPPLIERS.invoices.add)
  @ApiCreateSiteSupplierInvoice()
  createInvoice(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Body() dto: CreateSupplierInvoiceDto,
  ): Promise<CreateResponseDto<SupplierInvoiceResponseDto>> {
    this.logger.log(`POST /commerce-api/site/suppliers/${supplierId}/invoices`);
    return this.siteSuppliersGatewayService.createInvoice(supplierId, dto);
  }

  // Adds an item line invoicing a received lot, or a charge line, to an invoice
  @Post(':id/invoices/:invoiceId/lines')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_SUPPLIERS.invoices.edit)
  @ApiCreateSiteSupplierInvoiceLine()
  createInvoiceLine(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Param('invoiceId', new ParseUUIDPipe()) invoiceId: string,
    @Body() dto: SupplierInvoiceLineDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/suppliers/${supplierId}/invoices/${invoiceId}/lines`);
    return this.siteSuppliersGatewayService.createInvoiceLine(invoiceId, dto);
  }

  // Updates a supplier's enrollment picks and flags at the session site
  @Patch(':id')
  @RequirePermission(SITE_SUPPLIERS.editEnroll)
  update(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Body() dto: UpdateSupplierEnrollmentDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/suppliers/${supplierId}`);
    return this.siteSuppliersGatewayService.update(supplierId, dto);
  }

  // Updates this site's terms for a supplier item; the site item must belong to this site (RLS)
  @Patch(':id/site-items/:siteItemId')
  @RequirePermission(SITE_SUPPLIERS.siteItems.terms.edit)
  updateSiteItem(
    @Param('id') supplierId: string,
    @Param('siteItemId') supplierSiteItemId: string,
    @Body() dto: UpdateSupplierSiteItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/suppliers/${supplierId}/site-items/${supplierSiteItemId}`);
    return this.siteSuppliersGatewayService.updateSiteItem(supplierSiteItemId, dto);
  }

  // Updates an invoice's header
  @Patch(':id/invoices/:invoiceId')
  @RequirePermission(SITE_SUPPLIERS.invoices.edit)
  @ApiUpdateSiteSupplierInvoice()
  updateInvoice(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Param('invoiceId', new ParseUUIDPipe()) invoiceId: string,
    @Body() dto: UpdateSupplierInvoiceDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/suppliers/${supplierId}/invoices/${invoiceId}`);
    return this.siteSuppliersGatewayService.updateInvoice(invoiceId, dto);
  }

  // Updates a line of an invoice
  @Patch(':id/invoices/:invoiceId/lines/:lineId')
  @RequirePermission(SITE_SUPPLIERS.invoices.edit)
  @ApiUpdateSiteSupplierInvoiceLine()
  updateInvoiceLine(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Param('invoiceId', new ParseUUIDPipe()) invoiceId: string,
    @Param('lineId', new ParseUUIDPipe()) lineId: string,
    @Body() dto: SupplierInvoiceLineDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/suppliers/${supplierId}/invoices/${invoiceId}/lines/${lineId}`);
    return this.siteSuppliersGatewayService.updateInvoiceLine(invoiceId, lineId, dto);
  }

  // Activates or deactivates a supplier's own enrollment at the session site
  @Patch(':id/active')
  @RequirePermission(SITE_SUPPLIERS.editEnroll)
  setActive(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Body() dto: SetSupplierEnrollmentActiveDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/suppliers/${supplierId}/active`);
    return this.siteSuppliersGatewayService.setActive(supplierId, dto.isActive);
  }

  // Posts a draft invoice, setting the final cost of the stock it invoices
  @Post(':id/invoices/:invoiceId/post')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(SITE_SUPPLIERS.invoices.edit)
  @ApiPostSiteSupplierInvoice()
  postInvoice(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Param('invoiceId', new ParseUUIDPipe()) invoiceId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/suppliers/${supplierId}/invoices/${invoiceId}/post`);
    return this.siteSuppliersGatewayService.postInvoice(invoiceId);
  }

  // Releases an open hold of an invoice with a reason
  @Post(':id/invoices/:invoiceId/holds/:holdId/release')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(SITE_SUPPLIERS.invoices.edit)
  @ApiReleaseSiteSupplierInvoiceHold()
  releaseInvoiceHold(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Param('invoiceId', new ParseUUIDPipe()) invoiceId: string,
    @Param('holdId', new ParseUUIDPipe()) holdId: string,
    @Body() dto: ReleaseSupplierInvoiceHoldDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/suppliers/${supplierId}/invoices/${invoiceId}/holds/${holdId}/release`);
    return this.siteSuppliersGatewayService.releaseInvoiceHold(invoiceId, holdId, dto);
  }

  // Returns a supplier's enrollment at the session site with its commercial identity, enrolled or not
  @Get(':id')
  @RequirePermission(SITE_SUPPLIERS.view)
  findById(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @OrgId() orgId: string,
  ): Promise<SupplierEnrollmentDetailResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}`);
    return this.siteSuppliersGatewayService.findById(supplierId, orgId);
  }

  // Returns a supplier item's detail with this site's terms and price in force
  @Get(':id/site-items/:itemId')
  @RequirePermission(SITE_SUPPLIERS.siteItems.view)
  findSiteItemById(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
  ): Promise<SupplierSiteItemRowResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/site-items/${itemId}`);
    return this.siteSuppliersGatewayService.findSiteItemById(itemId);
  }

  // Returns one of the supplier's invoices with its lines and holds
  @Get(':id/invoices/:invoiceId')
  @RequirePermission(SITE_SUPPLIERS.invoices.view)
  @ApiFindSiteSupplierInvoiceById()
  findInvoiceById(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Param('invoiceId', new ParseUUIDPipe()) invoiceId: string,
    @OrgId() orgId: string,
  ): Promise<SupplierInvoiceDetailResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/invoices/${invoiceId}`);
    return this.siteSuppliersGatewayService.findInvoiceById(supplierId, invoiceId, orgId);
  }

  // Returns every supplier of the legal entity with its enrollment at the session site, with server-stored state
  @Get('table')
  @RequirePermission(SITE_SUPPLIERS.view)
  getSupplierTable(@UserId() userId: string, @OrgId() orgId: string): Promise<SupplierEnrollmentTableResponseDto> {
    this.logger.log('GET /commerce-api/site/suppliers/table');
    return this.siteSuppliersGatewayService.findForTable(userId, orgId);
  }

  // Returns an enrolled supplier's site items at this site for the data table
  @Get(':id/site-items/table')
  @RequirePermission(SITE_SUPPLIERS.siteItems.view)
  getSiteItemsTable(
    @Param('id') supplierId: string,
    @UserId() userId: string,
  ): Promise<SupplierSiteItemRowTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/site-items/table`);
    return this.siteSuppliersGatewayService.findSiteItemsTable(supplierId, userId);
  }

  // Returns the supplier's invoices at this site for the data table
  @Get(':id/invoices/table')
  @RequirePermission(SITE_SUPPLIERS.invoices.view)
  @ApiFindForTableSiteSupplierInvoices()
  getInvoicesTable(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @UserId() userId: string,
    @OrgId() orgId: string,
  ): Promise<SupplierInvoiceTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/invoices/table`);
    return this.siteSuppliersGatewayService.findInvoicesTable(supplierId, userId, orgId);
  }

  // Returns the supplier's posted receipt lots at this site still to invoice, for an invoice's line picker
  @Get(':id/invoices/invoiceable-goods-receipts')
  @RequirePermission(SITE_SUPPLIERS.invoices.view)
  @ApiFindSiteSupplierInvoiceableGoodsReceipts()
  getInvoiceableGoodsReceipts(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Query() query: InvoiceableGoodsReceiptsQueryDto,
  ): Promise<InvoiceableGoodsReceiptResponseDto[]> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/invoices/invoiceable-goods-receipts`);
    return this.siteSuppliersGatewayService.findInvoiceableGoodsReceipts(supplierId, query);
  }

  // Counts the lines and holds of one of the supplier's invoices, one per tab of its detail page
  @Get(':id/invoices/:invoiceId/counts')
  @RequirePermission(SITE_SUPPLIERS.invoices.view)
  @ApiFindSiteSupplierInvoiceCounts()
  findInvoiceCounts(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Param('invoiceId', new ParseUUIDPipe()) invoiceId: string,
  ): Promise<SupplierInvoiceCountsResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/invoices/${invoiceId}/counts`);
    return this.siteSuppliersGatewayService.findInvoiceCounts(supplierId, invoiceId);
  }

  // Counts a supplier's items, quotations and invoices at the session site, one per tab of its page
  @Get(':id/counts')
  @RequirePermission(SITE_SUPPLIERS.view)
  @ApiFindSiteSupplierCounts()
  findCounts(@Param('id', new ParseUUIDPipe()) supplierId: string): Promise<SupplierEnrollmentCountsResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/counts`);
    return this.siteSuppliersGatewayService.findCounts(supplierId);
  }

  // Counts a supplier item's prices this site reads, one per tab of its page
  @Get(':id/site-items/:itemId/counts')
  @RequirePermission(SITE_SUPPLIERS.siteItems.view)
  @ApiFindSiteSupplierSiteItemCounts()
  findSiteItemCounts(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
  ): Promise<SupplierItemCountsResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/site-items/${itemId}/counts`);
    return this.siteSuppliersGatewayService.findSiteItemCounts(itemId);
  }

  // Removes a supplier's enrollment at the session site
  @Delete(':id')
  @RequirePermission(SITE_SUPPLIERS.unenroll)
  delete(@Param('id', new ParseUUIDPipe()) supplierId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/suppliers/${supplierId}`);
    return this.siteSuppliersGatewayService.delete(supplierId);
  }

  // Removes a line from an invoice
  @Delete(':id/invoices/:invoiceId/lines/:lineId')
  @RequirePermission(SITE_SUPPLIERS.invoices.edit)
  @ApiDeleteSiteSupplierInvoiceLine()
  deleteInvoiceLine(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Param('invoiceId', new ParseUUIDPipe()) invoiceId: string,
    @Param('lineId', new ParseUUIDPipe()) lineId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/suppliers/${supplierId}/invoices/${invoiceId}/lines/${lineId}`);
    return this.siteSuppliersGatewayService.deleteInvoiceLine(invoiceId, lineId);
  }
}

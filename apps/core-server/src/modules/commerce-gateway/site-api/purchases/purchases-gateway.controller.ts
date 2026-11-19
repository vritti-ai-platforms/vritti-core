import { CancelPurchaseDto } from '@commerce/purchases/dto/request/cancel-purchase.dto';
import { CancelSupplierDto } from '@commerce/purchases/dto/request/cancel-supplier.dto';
import { ChangePurchaseMinQuotationsDto } from '@commerce/purchases/dto/request/change-purchase-min-quotations.dto';
import { ChangePurchaseNotesDto } from '@commerce/purchases/dto/request/change-purchase-notes.dto';
import { ClosePurchaseDto } from '@commerce/purchases/dto/request/close-purchase.dto';
import { CloseSupplierDto } from '@commerce/purchases/dto/request/close-supplier.dto';
import { CreateLegGoodsReceiptDto } from '@commerce/purchases/dto/request/create-leg-goods-receipt.dto';
import { CreateLegInboundDeliveryDto } from '@commerce/purchases/dto/request/create-leg-inbound-delivery.dto';
import { CreateLegPurchaseOrderDto } from '@commerce/purchases/dto/request/create-leg-purchase-order.dto';
import { CreatePurchaseDto } from '@commerce/purchases/dto/request/create-purchase.dto';
import { CreatePurchaseAllocationDto } from '@commerce/purchases/dto/request/create-purchase-allocation.dto';
import { CreatePurchaseAllocationsFromQuotationDto } from '@commerce/purchases/dto/request/create-purchase-allocations-from-quotation.dto';
import { CreatePurchaseItemDto } from '@commerce/purchases/dto/request/create-purchase-item.dto';
import { CreatePurchaseSupplierInvoiceDto } from '@commerce/purchases/dto/request/create-purchase-supplier-invoice.dto';
import { DisablePurchaseQuotationsDto } from '@commerce/purchases/dto/request/disable-purchase-quotations.dto';
import { EnablePurchaseQuotationsDto } from '@commerce/purchases/dto/request/enable-purchase-quotations.dto';
import { ReceiveWithInvoiceDto } from '@commerce/purchases/dto/request/receive-with-invoice.dto';
import { ReceiveWithInvoiceOpenLinesQueryDto } from '@commerce/purchases/dto/request/receive-with-invoice-open-lines-query.dto';
import { RejectPurchaseLegDto } from '@commerce/purchases/dto/request/reject-purchase-leg.dto';
import { RequestPurchaseQuotationDto } from '@commerce/purchases/dto/request/request-purchase-quotation.dto';
import { UpdatePurchaseAllocationDto } from '@commerce/purchases/dto/request/update-purchase-allocation.dto';
import { UpdatePurchaseItemDto } from '@commerce/purchases/dto/request/update-purchase-item.dto';
import type { CreatedLegGoodsReceiptResponseDto } from '@commerce/purchases/dto/response/created-leg-goods-receipt-response.dto';
import type { CreatedLegInboundDeliveryResponseDto } from '@commerce/purchases/dto/response/created-leg-inbound-delivery-response.dto';
import type { CreatedLegPurchaseOrdersResponseDto } from '@commerce/purchases/dto/response/created-leg-purchase-orders-response.dto';
import type { CreatedPurchaseSupplierInvoiceResponseDto } from '@commerce/purchases/dto/response/created-purchase-supplier-invoice-response.dto';
import type { PurchaseAllocationResponseDto } from '@commerce/purchases/dto/response/purchase-allocation-response.dto';
import type {
  PurchaseActionsResponseDto,
  PurchaseCountsResponseDto,
  PurchaseDetailResponseDto,
  PurchaseProgressSummaryResponseDto,
} from '@commerce/purchases/dto/response/purchase-detail-response.dto';
import type { PurchaseItemResponseDto } from '@commerce/purchases/dto/response/purchase-item-response.dto';
import type {
  PurchaseItemComparisonTableResponseDto,
  PurchaseItemFacetsResponseDto,
  PurchaseItemTableResponseDto,
} from '@commerce/purchases/dto/response/purchase-item-table-response.dto';
import type {
  PurchaseItemAllocationTableResponseDto,
  PurchaseItemCountsResponseDto,
  PurchaseItemDocumentTableResponseDto,
  PurchaseItemProgressResponseDto,
  PurchaseItemQuoteTableResponseDto,
  PurchaseItemSiteStockResponseDto,
  PurchaseItemViewResponseDto,
} from '@commerce/purchases/dto/response/purchase-item-view-response.dto';
import type { PurchaseLegResponseDto } from '@commerce/purchases/dto/response/purchase-leg-response.dto';
import type {
  PurchaseLegCountResponseDto,
  PurchaseLegTableResponseDto,
  PurchaseSupplierDocumentsResponseDto,
} from '@commerce/purchases/dto/response/purchase-leg-table-response.dto';
import type { PurchaseQuotationTableResponseDto } from '@commerce/purchases/dto/response/purchase-quotation-response.dto';
import type { PurchaseResponseDto } from '@commerce/purchases/dto/response/purchase-response.dto';
import type { PurchaseSettingsResponseDto } from '@commerce/purchases/dto/response/purchase-settings-response.dto';
import type { PurchaseTableResponseDto } from '@commerce/purchases/dto/response/purchase-table-response.dto';
import type { ReceiveWithInvoiceDetailResponseDto } from '@commerce/purchases/dto/response/receive-with-invoice-detail-response.dto';
import type { ReceiveWithInvoiceOpenLineResponseDto } from '@commerce/purchases/dto/response/receive-with-invoice-open-line-response.dto';
import type { RequestedPurchaseQuotationResponseDto } from '@commerce/purchases/dto/response/requested-purchase-quotation-response.dto';
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
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SITE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import {
  ApiApproveLeg,
  ApiCancel,
  ApiCancelSupplier,
  ApiChangeMinQuotations,
  ApiChangeNotes,
  ApiClose,
  ApiCloseSupplier,
  ApiConfirmLegPurchaseOrder,
  ApiCreate,
  ApiCreateAllocation,
  ApiCreateAllocationsFromQuotation,
  ApiCreateItem,
  ApiCreateLegGoodsReceipt,
  ApiCreateLegInboundDelivery,
  ApiCreateLegPurchaseOrder,
  ApiCreateReceiveWithInvoice,
  ApiCreateSupplierInvoice,
  ApiDelete,
  ApiDeleteAllocation,
  ApiDeleteItem,
  ApiDisableQuotations,
  ApiDiscardReceiveWithInvoice,
  ApiEnableQuotations,
  ApiFindActions,
  ApiFindById,
  ApiFindCounts,
  ApiFindDocuments,
  ApiFindItemById,
  ApiFindItemCounts,
  ApiFindItemFacets,
  ApiFindItemProgress,
  ApiFindItemSiteStock,
  ApiFindProgress,
  ApiFindReceiveWithInvoiceById,
  ApiFindReceiveWithInvoiceOpenLines,
  ApiFindSettings,
  ApiFindSupplierById,
  ApiFindSupplierCounts,
  ApiGetItemAllocationsTable,
  ApiGetItemComparisonTable,
  ApiGetItemDocumentsTable,
  ApiGetItemQuotesTable,
  ApiGetItemsTable,
  ApiGetQuotationsTable,
  ApiGetSuppliersTable,
  ApiGetTable,
  ApiPostReceiveWithInvoice,
  ApiRejectLeg,
  ApiRequestQuotation,
  ApiSubmit,
  ApiSubmitSupplier,
  ApiUpdateAllocation,
  ApiUpdateItem,
  ApiUpdateReceiveWithInvoice,
} from './docs/purchases-gateway.docs';
import { PurchasesGatewayService } from './services/purchases-gateway.service';

@ApiTags('Commerce - Purchases')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_PURCHASES.featureCode)
@Controller('site/purchases')
export class PurchasesGatewayController {
  private readonly logger = new Logger(PurchasesGatewayController.name);

  constructor(private readonly service: PurchasesGatewayService) {}

  // Creates a purchase at the site
  @Post()
  @RequirePermission(SITE_PURCHASES.add)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreate()
  create(@Body() dto: CreatePurchaseDto): Promise<CreateResponseDto<PurchaseResponseDto>> {
    this.logger.log('POST /commerce-api/site/purchases');
    return this.service.create(dto);
  }

  // Adds an item to a purchase
  @Post(':id/items')
  @RequirePermission(SITE_PURCHASES.edit)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateItem()
  createItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreatePurchaseItemDto,
  ): Promise<CreateResponseDto<PurchaseItemResponseDto>> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/items`);
    return this.service.createItem(id, dto);
  }

  // Requests a draft quotation from a supplier for a purchase's items
  @Post(':id/quotations')
  @RequirePermission(SITE_PURCHASES.quotations.add)
  @HttpCode(HttpStatus.CREATED)
  @ApiRequestQuotation()
  requestQuotation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RequestPurchaseQuotationDto,
  ): Promise<CreateResponseDto<RequestedPurchaseQuotationResponseDto>> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/quotations`);
    return this.service.requestQuotation(id, dto);
  }

  // Allocates part of an item to a supplier
  @Post(':id/allocations')
  @RequirePermission(SITE_PURCHASES.edit)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateAllocation()
  createAllocation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreatePurchaseAllocationDto,
  ): Promise<CreateResponseDto<PurchaseAllocationResponseDto>> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/allocations`);
    return this.service.createAllocation(id, dto);
  }

  // Allocates items from posted quotation lines
  @Post(':id/allocations/from-quotation')
  @RequirePermission(SITE_PURCHASES.edit)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateAllocationsFromQuotation()
  createAllocationsFromQuotation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreatePurchaseAllocationsFromQuotationDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/allocations/from-quotation`);
    return this.service.createAllocationsFromQuotation(id, dto);
  }

  // Creates a leg's purchase orders, one per currency of its allocations
  @Post(':id/legs/:legId/purchase-orders')
  @RequirePermission(SITE_PURCHASES.edit)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateLegPurchaseOrder()
  createLegPurchaseOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('legId', new ParseUUIDPipe()) legId: string,
    @Body() dto: CreateLegPurchaseOrderDto,
  ): Promise<CreateResponseDto<CreatedLegPurchaseOrdersResponseDto>> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/legs/${legId}/purchase-orders`);
    return this.service.createLegPurchaseOrder(id, legId, dto);
  }

  // Creates an inbound delivery of a leg's confirmed purchase order lines
  @Post(':id/legs/:legId/inbound-deliveries')
  @RequirePermission(SITE_PURCHASES.receive)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateLegInboundDelivery()
  createLegInboundDelivery(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('legId', new ParseUUIDPipe()) legId: string,
    @Body() dto: CreateLegInboundDeliveryDto,
  ): Promise<CreateResponseDto<CreatedLegInboundDeliveryResponseDto>> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/legs/${legId}/inbound-deliveries`);
    return this.service.createLegInboundDelivery(id, legId, dto);
  }

  // Creates a draft goods receipt of a leg
  @Post(':id/legs/:legId/goods-receipts')
  @RequirePermission(SITE_PURCHASES.receive)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateLegGoodsReceipt()
  createLegGoodsReceipt(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('legId', new ParseUUIDPipe()) legId: string,
    @Body() dto: CreateLegGoodsReceiptDto,
  ): Promise<CreateResponseDto<CreatedLegGoodsReceiptResponseDto>> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/legs/${legId}/goods-receipts`);
    return this.service.createLegGoodsReceipt(id, legId, dto);
  }

  // Drafts a supplier invoice for the received goods of the supplier's open legs
  @Post('supplier-invoices')
  @RequirePermission(SITE_PURCHASES.invoice)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateSupplierInvoice()
  createSupplierInvoice(
    @Body() dto: CreatePurchaseSupplierInvoiceDto,
  ): Promise<CreateResponseDto<CreatedPurchaseSupplierInvoiceResponseDto>> {
    this.logger.log('POST /commerce-api/site/purchases/supplier-invoices');
    return this.service.createSupplierInvoice(dto);
  }

  // Drafts a Receive with Invoice
  @Post('receive-with-invoices')
  @RequirePermission(SITE_PURCHASES.receive)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateReceiveWithInvoice()
  createReceiveWithInvoice(
    @Body() dto: ReceiveWithInvoiceDto,
  ): Promise<CreateResponseDto<CreatedPurchaseSupplierInvoiceResponseDto>> {
    this.logger.log('POST /commerce-api/site/purchases/receive-with-invoices');
    return this.service.createReceiveWithInvoice(dto);
  }

  // Changes an open purchase's notes
  @Patch(':id/notes')
  @RequirePermission(SITE_PURCHASES.edit)
  @ApiChangeNotes()
  changeNotes(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangePurchaseNotesDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/purchases/${id}/notes`);
    return this.service.changeNotes(id, dto);
  }

  // Requires quotations on a purchase none of whose suppliers is submitted yet
  @Post(':id/quotations/enable')
  @RequirePermission(SITE_PURCHASES.edit)
  @HttpCode(HttpStatus.OK)
  @ApiEnableQuotations()
  enableQuotations(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: EnablePurchaseQuotationsDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/quotations/enable`);
    return this.service.enableQuotations(id, dto);
  }

  // Stops requiring quotations on an open purchase, with why
  @Post(':id/quotations/disable')
  @RequirePermission(SITE_PURCHASES.edit)
  @HttpCode(HttpStatus.OK)
  @ApiDisableQuotations()
  disableQuotations(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DisablePurchaseQuotationsDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/quotations/disable`);
    return this.service.disableQuotations(id, dto);
  }

  // Changes how many posted quotations each item needs before its supplier is submitted
  @Patch(':id/quotations/minimum')
  @RequirePermission(SITE_PURCHASES.edit)
  @ApiChangeMinQuotations()
  changeMinQuotations(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangePurchaseMinQuotationsDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/purchases/${id}/quotations/minimum`);
    return this.service.changeMinQuotations(id, dto);
  }

  // Changes an item of a purchase
  @Patch(':id/items/:itemId')
  @RequirePermission(SITE_PURCHASES.edit)
  @ApiUpdateItem()
  updateItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdatePurchaseItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/purchases/${id}/items/${itemId}`);
    return this.service.updateItem(id, itemId, dto);
  }

  // Changes an allocation of a purchase
  @Patch(':id/allocations/:allocationId')
  @RequirePermission(SITE_PURCHASES.edit)
  @ApiUpdateAllocation()
  updateAllocation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('allocationId', new ParseUUIDPipe()) allocationId: string,
    @Body() dto: UpdatePurchaseAllocationDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/purchases/${id}/allocations/${allocationId}`);
    return this.service.updateAllocation(id, allocationId, dto);
  }

  // Replaces a draft Receive with Invoice
  @Put('receive-with-invoices/:invoiceId')
  @RequirePermission(SITE_PURCHASES.receive)
  @ApiUpdateReceiveWithInvoice()
  updateReceiveWithInvoice(
    @Param('invoiceId', new ParseUUIDPipe()) invoiceId: string,
    @Body() dto: ReceiveWithInvoiceDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /commerce-api/site/purchases/receive-with-invoices/${invoiceId}`);
    return this.service.updateReceiveWithInvoice(invoiceId, dto);
  }

  // Cancels a purchase with a reason
  @Post(':id/cancel')
  @RequirePermission(SITE_PURCHASES.delete)
  @HttpCode(HttpStatus.OK)
  @ApiCancel()
  cancel(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: CancelPurchaseDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/cancel`);
    return this.service.cancel(id, dto);
  }

  // Starts every leg of a purchase still in sourcing
  @Post(':id/submit')
  @RequirePermission(SITE_PURCHASES.edit)
  @HttpCode(HttpStatus.OK)
  @ApiSubmit()
  submit(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/submit`);
    return this.service.submit(id);
  }
  // Closes a purchase: suppliers with goods received stop expecting more, the others are cancelled
  @Post(':id/close')
  @RequirePermission(SITE_PURCHASES.close)
  @HttpCode(HttpStatus.OK)
  @ApiClose()
  close(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: ClosePurchaseDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/close`);
    return this.service.close(id, dto);
  }

  // Submits one supplier's leg of a purchase still in sourcing
  @Post(':id/legs/:legId/submit')
  @RequirePermission(SITE_PURCHASES.edit)
  @HttpCode(HttpStatus.OK)
  @ApiSubmitSupplier()
  submitSupplier(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('legId', new ParseUUIDPipe()) legId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/legs/${legId}/submit`);
    return this.service.submitSupplier(id, legId);
  }

  // Approves a leg of a purchase waiting for approval
  @Post(':id/legs/:legId/approve')
  @RequirePermission(SITE_PURCHASES.approve)
  @HttpCode(HttpStatus.OK)
  @ApiApproveLeg()
  approveLeg(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('legId', new ParseUUIDPipe()) legId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/legs/${legId}/approve`);
    return this.service.approveLeg(id, legId);
  }

  // Rejects a leg of a purchase back to sourcing
  @Post(':id/legs/:legId/reject')
  @RequirePermission(SITE_PURCHASES.approve)
  @HttpCode(HttpStatus.OK)
  @ApiRejectLeg()
  rejectLeg(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('legId', new ParseUUIDPipe()) legId: string,
    @Body() dto: RejectPurchaseLegDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/legs/${legId}/reject`);
    return this.service.rejectLeg(id, legId, dto);
  }

  // Confirms a sent purchase order of a leg
  @Post(':id/legs/:legId/purchase-orders/:purchaseOrderId/confirm')
  @RequirePermission(SITE_PURCHASES.edit)
  @HttpCode(HttpStatus.OK)
  @ApiConfirmLegPurchaseOrder()
  confirmLegPurchaseOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('legId', new ParseUUIDPipe()) legId: string,
    @Param('purchaseOrderId', new ParseUUIDPipe()) purchaseOrderId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/legs/${legId}/purchase-orders/${purchaseOrderId}/confirm`);
    return this.service.confirmLegPurchaseOrder(id, legId, purchaseOrderId);
  }

  // Closes a supplier's leg of a purchase
  @Post(':id/legs/:legId/close')
  @RequirePermission(SITE_PURCHASES.close)
  @HttpCode(HttpStatus.OK)
  @ApiCloseSupplier()
  closeSupplier(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('legId', new ParseUUIDPipe()) legId: string,
    @Body() dto: CloseSupplierDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/legs/${legId}/close`);
    return this.service.closeSupplier(id, legId, dto);
  }
  // Cancels a supplier nothing is received or invoiced on, returning its quantity to sourcing or dropping it
  @Post(':id/legs/:legId/cancel')
  @RequirePermission(SITE_PURCHASES.edit)
  @HttpCode(HttpStatus.OK)
  @ApiCancelSupplier()
  cancelSupplier(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('legId', new ParseUUIDPipe()) legId: string,
    @Body() dto: CancelSupplierDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/legs/${legId}/cancel`);
    return this.service.cancelSupplier(id, legId, dto);
  }

  // Posts a draft Receive with Invoice
  @Post('receive-with-invoices/:invoiceId/post')
  @RequirePermission(SITE_PURCHASES.receive)
  @HttpCode(HttpStatus.OK)
  @ApiPostReceiveWithInvoice()
  postReceiveWithInvoice(@Param('invoiceId', new ParseUUIDPipe()) invoiceId: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/receive-with-invoices/${invoiceId}/post`);
    return this.service.postReceiveWithInvoice(invoiceId);
  }

  // Returns one purchase, its site named
  @Get(':id')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindById()
  findById(@Param('id', new ParseUUIDPipe()) id: string, @OrgId() orgId: string): Promise<PurchaseDetailResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}`);
    return this.service.findById(id, orgId);
  }

  // Returns one Receive with Invoice
  @Get('receive-with-invoices/:invoiceId')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindReceiveWithInvoiceById()
  findReceiveWithInvoiceById(
    @Param('invoiceId', new ParseUUIDPipe()) invoiceId: string,
  ): Promise<ReceiveWithInvoiceDetailResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/receive-with-invoices/${invoiceId}`);
    return this.service.findReceiveWithInvoiceById(invoiceId);
  }
  // Returns one purchase item as its own page shows it
  @Get(':id/items/:itemId')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindItemById()
  findItemById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<PurchaseItemViewResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/items/${itemId}`);
    return this.service.findItemById(id, itemId);
  }

  // Returns one supplier leg of a purchase with its allocations, documents, progress, actions and blockers
  @Get(':id/suppliers/:legId')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindSupplierById()
  findSupplierById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('legId', new ParseUUIDPipe()) legId: string,
    @OrgId() orgId: string,
  ): Promise<PurchaseLegResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/suppliers/${legId}`);
    return this.service.findSupplierById(id, legId, orgId);
  }

  // Returns the site's purchases for the data table
  @Get('table')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiGetTable()
  getTable(@UserId() userId: string, @OrgId() orgId: string): Promise<PurchaseTableResponseDto> {
    this.logger.log('GET /commerce-api/site/purchases/table');
    return this.service.findForTable(userId, orgId);
  }
  // Returns one page of a purchase's items with how far each has got
  @Get(':id/items/table')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiGetItemsTable()
  getItemsTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PurchaseItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/items/table`);
    return this.service.findItemsTable(id, userId);
  }

  // Returns one page of a purchase's items with the quotation lines that quote each
  @Get(':id/items/comparison')
  @RequirePermission(SITE_PURCHASES.quotations.view)
  @ApiGetItemComparisonTable()
  getItemComparisonTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PurchaseItemComparisonTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/items/comparison`);
    return this.service.findItemComparisonTable(id, userId);
  }
  // Returns one page of a purchase item's allocations
  @Get(':id/items/:itemId/allocations/table')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiGetItemAllocationsTable()
  getItemAllocationsTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @UserId() userId: string,
  ): Promise<PurchaseItemAllocationTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/items/${itemId}/allocations/table`);
    return this.service.findItemAllocationsTable(id, itemId, userId);
  }

  // Returns one page of the quotation lines quoting a purchase item
  @Get(':id/items/:itemId/quotes/table')
  @RequirePermission(SITE_PURCHASES.quotations.view)
  @ApiGetItemQuotesTable()
  getItemQuotesTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @UserId() userId: string,
  ): Promise<PurchaseItemQuoteTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/items/${itemId}/quotes/table`);
    return this.service.findItemQuotesTable(id, itemId, userId);
  }

  // Returns one page of the document lines that move a purchase item
  @Get(':id/items/:itemId/documents/table')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiGetItemDocumentsTable()
  getItemDocumentsTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @UserId() userId: string,
  ): Promise<PurchaseItemDocumentTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/items/${itemId}/documents/table`);
    return this.service.findItemDocumentsTable(id, itemId, userId);
  }

  // Returns one page of a purchase's supplier legs
  @Get(':id/suppliers/table')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiGetSuppliersTable()
  getSuppliersTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
    @OrgId() orgId: string,
  ): Promise<PurchaseLegTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/suppliers/table`);
    return this.service.findSuppliersTable(id, userId, orgId);
  }

  // Returns one page of the quotations linked to a purchase
  @Get(':id/quotations/table')
  @RequirePermission(SITE_PURCHASES.quotations.view)
  @ApiGetQuotationsTable()
  getQuotationsTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
    @OrgId() orgId: string,
  ): Promise<PurchaseQuotationTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/quotations/table`);
    return this.service.findQuotationsTable(id, userId, orgId);
  }

  // Counts a purchase's item lines, suppliers and requested quotations
  @Get(':id/counts')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindCounts()
  findCounts(@Param('id', new ParseUUIDPipe()) id: string): Promise<PurchaseCountsResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/counts`);
    return this.service.findCounts(id);
  }

  // Returns how far a purchase's items have got and where it stands as a whole
  @Get(':id/progress')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindProgress()
  findProgress(@Param('id', new ParseUUIDPipe()) id: string): Promise<PurchaseProgressSummaryResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/progress`);
    return this.service.findProgress(id);
  }

  // Returns the actions a purchase offers and why the others are blocked
  @Get(':id/actions')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindActions()
  findActions(@Param('id', new ParseUUIDPipe()) id: string): Promise<PurchaseActionsResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/actions`);
    return this.service.findActions(id);
  }

  // Counts a purchase's items in each bucket of the items table
  @Get(':id/items/facets')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindItemFacets()
  findItemFacets(@Param('id', new ParseUUIDPipe()) id: string): Promise<PurchaseItemFacetsResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/items/facets`);
    return this.service.findItemFacets(id);
  }
  // Counts what a purchase item's page lists
  @Get(':id/items/:itemId/counts')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindItemCounts()
  findItemCounts(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<PurchaseItemCountsResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/items/${itemId}/counts`);
    return this.service.findItemCounts(id, itemId);
  }

  // Returns how far a purchase item has got, in all and per supplier
  @Get(':id/items/:itemId/progress')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindItemProgress()
  findItemProgress(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<PurchaseItemProgressResponseDto> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/items/${itemId}/progress`);
    return this.service.findItemProgress(id, itemId);
  }

  // Returns a purchase item's stock at the purchase's site, or null while the site does not carry it
  @Get(':id/items/:itemId/site-stock')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindItemSiteStock()
  findItemSiteStock(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<PurchaseItemSiteStockResponseDto | null> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/items/${itemId}/site-stock`);
    return this.service.findItemSiteStock(id, itemId);
  }

  // Counts a purchase's supplier legs and their lines by step and status
  @Get(':id/suppliers/counts')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindSupplierCounts()
  findSupplierCounts(@Param('id', new ParseUUIDPipe()) id: string): Promise<PurchaseLegCountResponseDto[]> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/suppliers/counts`);
    return this.service.findSupplierCounts(id);
  }

  // Returns the documents of every supplier leg of a purchase
  @Get(':id/documents')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindDocuments()
  findDocuments(@Param('id', new ParseUUIDPipe()) id: string): Promise<PurchaseSupplierDocumentsResponseDto[]> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/documents`);
    return this.service.findDocuments(id);
  }

  // Returns the supplier's allocations open to receive and invoice at once
  @Get('receive-with-invoices/open-lines')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindReceiveWithInvoiceOpenLines()
  findReceiveWithInvoiceOpenLines(
    @Query() query: ReceiveWithInvoiceOpenLinesQueryDto,
  ): Promise<ReceiveWithInvoiceOpenLineResponseDto[]> {
    this.logger.log('GET /commerce-api/site/purchases/receive-with-invoices/open-lines');
    return this.service.findReceiveWithInvoiceOpenLines(query);
  }

  // Returns the purchasing rules the legal entity set for the session site
  @Get('settings')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindSettings()
  findSettings(): Promise<PurchaseSettingsResponseDto> {
    this.logger.log('GET /commerce-api/site/purchases/settings');
    return this.service.findSettings();
  }

  // Deletes a purchase that is still open and Requesting with nothing beyond items
  @Delete(':id')
  @RequirePermission(SITE_PURCHASES.delete)
  @ApiDelete()
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/purchases/${id}`);
    return this.service.delete(id);
  }

  // Removes an item from a purchase
  @Delete(':id/items/:itemId')
  @RequirePermission(SITE_PURCHASES.edit)
  @ApiDeleteItem()
  deleteItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/purchases/${id}/items/${itemId}`);
    return this.service.deleteItem(id, itemId);
  }

  // Removes an allocation from a purchase
  @Delete(':id/allocations/:allocationId')
  @RequirePermission(SITE_PURCHASES.edit)
  @ApiDeleteAllocation()
  deleteAllocation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('allocationId', new ParseUUIDPipe()) allocationId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/purchases/${id}/allocations/${allocationId}`);
    return this.service.deleteAllocation(id, allocationId);
  }

  // Discards a draft Receive with Invoice
  @Delete('receive-with-invoices/:invoiceId')
  @RequirePermission(SITE_PURCHASES.receive)
  @ApiDiscardReceiveWithInvoice()
  discardReceiveWithInvoice(@Param('invoiceId', new ParseUUIDPipe()) invoiceId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/purchases/receive-with-invoices/${invoiceId}`);
    return this.service.discardReceiveWithInvoice(invoiceId);
  }
}

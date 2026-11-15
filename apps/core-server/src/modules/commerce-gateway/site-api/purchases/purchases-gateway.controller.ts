import { CancelPurchaseDto } from '@commerce/purchases/dto/request/cancel-purchase.dto';
import { CloseSupplierDto } from '@commerce/purchases/dto/request/close-supplier.dto';
import { CreateLegGoodsReceiptDto } from '@commerce/purchases/dto/request/create-leg-goods-receipt.dto';
import { CreateLegInboundDeliveryDto } from '@commerce/purchases/dto/request/create-leg-inbound-delivery.dto';
import { CreateLegPurchaseOrderDto } from '@commerce/purchases/dto/request/create-leg-purchase-order.dto';
import { CreatePurchaseDto } from '@commerce/purchases/dto/request/create-purchase.dto';
import { CreatePurchaseAllocationDto } from '@commerce/purchases/dto/request/create-purchase-allocation.dto';
import { CreatePurchaseAllocationsFromQuotationDto } from '@commerce/purchases/dto/request/create-purchase-allocations-from-quotation.dto';
import { CreatePurchaseItemDto } from '@commerce/purchases/dto/request/create-purchase-item.dto';
import { CreatePurchaseSupplierInvoiceDto } from '@commerce/purchases/dto/request/create-purchase-supplier-invoice.dto';
import { ReceiveWithInvoiceDto } from '@commerce/purchases/dto/request/receive-with-invoice.dto';
import { ReceiveWithInvoiceOpenLinesQueryDto } from '@commerce/purchases/dto/request/receive-with-invoice-open-lines-query.dto';
import { RejectPurchaseLegDto } from '@commerce/purchases/dto/request/reject-purchase-leg.dto';
import { RequestPurchaseQuotationDto } from '@commerce/purchases/dto/request/request-purchase-quotation.dto';
import { UpdatePurchaseDto } from '@commerce/purchases/dto/request/update-purchase.dto';
import { UpdatePurchaseAllocationDto } from '@commerce/purchases/dto/request/update-purchase-allocation.dto';
import { UpdatePurchaseItemDto } from '@commerce/purchases/dto/request/update-purchase-item.dto';
import type { CreatedLegGoodsReceiptResponseDto } from '@commerce/purchases/dto/response/created-leg-goods-receipt-response.dto';
import type { CreatedLegInboundDeliveryResponseDto } from '@commerce/purchases/dto/response/created-leg-inbound-delivery-response.dto';
import type { CreatedLegPurchaseOrdersResponseDto } from '@commerce/purchases/dto/response/created-leg-purchase-orders-response.dto';
import type { CreatedPurchaseSupplierInvoiceResponseDto } from '@commerce/purchases/dto/response/created-purchase-supplier-invoice-response.dto';
import type { PurchaseAllocationResponseDto } from '@commerce/purchases/dto/response/purchase-allocation-response.dto';
import type { PurchaseHeaderResponseDto } from '@commerce/purchases/dto/response/purchase-header-response.dto';
import type { PurchaseItemResponseDto } from '@commerce/purchases/dto/response/purchase-item-response.dto';
import type { PurchaseLegResponseDto } from '@commerce/purchases/dto/response/purchase-leg-response.dto';
import type { PurchaseQuotationResponseDto } from '@commerce/purchases/dto/response/purchase-quotation-response.dto';
import type { PurchaseResponseDto } from '@commerce/purchases/dto/response/purchase-response.dto';
import type { PurchaseSourcingItemResponseDto } from '@commerce/purchases/dto/response/purchase-sourcing-item-response.dto';
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
  ApiCloseSupplier,
  ApiCompleteQuotations,
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
  ApiDiscardReceiveWithInvoice,
  ApiFindById,
  ApiFindItems,
  ApiFindQuotations,
  ApiFindReceiveWithInvoiceById,
  ApiFindReceiveWithInvoiceOpenLines,
  ApiFindSourcingItems,
  ApiFindSuppliers,
  ApiGetTable,
  ApiPostReceiveWithInvoice,
  ApiRejectLeg,
  ApiRequestQuotation,
  ApiSubmit,
  ApiSubmitItems,
  ApiSubmitSupplier,
  ApiUpdate,
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
  @RequirePermission(SITE_PURCHASES.edit)
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

  // Changes a purchase's header while it is Requesting
  @Patch(':id')
  @RequirePermission(SITE_PURCHASES.edit)
  @ApiUpdate()
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdatePurchaseDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/purchases/${id}`);
    return this.service.update(id, dto);
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

  // Submits a purchase's items
  @Post(':id/submit-items')
  @RequirePermission(SITE_PURCHASES.edit)
  @HttpCode(HttpStatus.OK)
  @ApiSubmitItems()
  submitItems(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/submit-items`);
    return this.service.submitItems(id);
  }

  // Completes a purchase's quotations
  @Post(':id/complete-quotations')
  @RequirePermission(SITE_PURCHASES.edit)
  @HttpCode(HttpStatus.OK)
  @ApiCompleteQuotations()
  completeQuotations(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/${id}/complete-quotations`);
    return this.service.completeQuotations(id);
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

  // Posts a draft Receive with Invoice
  @Post('receive-with-invoices/:invoiceId/post')
  @RequirePermission(SITE_PURCHASES.receive)
  @HttpCode(HttpStatus.OK)
  @ApiPostReceiveWithInvoice()
  postReceiveWithInvoice(@Param('invoiceId', new ParseUUIDPipe()) invoiceId: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/purchases/receive-with-invoices/${invoiceId}/post`);
    return this.service.postReceiveWithInvoice(invoiceId);
  }

  // Returns one purchase's header with its counts, progress and available actions
  @Get(':id')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindById()
  findById(@Param('id', new ParseUUIDPipe()) id: string, @OrgId() orgId: string): Promise<PurchaseHeaderResponseDto> {
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

  // Returns the site's purchases for the data table
  @Get('table')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiGetTable()
  getTable(@UserId() userId: string, @OrgId() orgId: string): Promise<PurchaseTableResponseDto> {
    this.logger.log('GET /commerce-api/site/purchases/table');
    return this.service.findForTable(userId, orgId);
  }

  // Returns a purchase's items
  @Get(':id/items')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindItems()
  findItems(@Param('id', new ParseUUIDPipe()) id: string): Promise<PurchaseItemResponseDto[]> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/items`);
    return this.service.findItems(id);
  }

  // Returns the quotations linked to a purchase
  @Get(':id/quotations')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindQuotations()
  findQuotations(@Param('id', new ParseUUIDPipe()) id: string): Promise<PurchaseQuotationResponseDto[]> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/quotations`);
    return this.service.findQuotations(id);
  }

  // Returns a purchase's items with their allocations across every leg
  @Get(':id/sourcing/items')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindSourcingItems()
  findSourcingItems(@Param('id', new ParseUUIDPipe()) id: string): Promise<PurchaseSourcingItemResponseDto[]> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/sourcing/items`);
    return this.service.findSourcingItems(id);
  }

  // Returns a purchase's supplier legs
  @Get(':id/suppliers')
  @RequirePermission(SITE_PURCHASES.view)
  @ApiFindSuppliers()
  findSuppliers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @OrgId() orgId: string,
  ): Promise<PurchaseLegResponseDto[]> {
    this.logger.log(`GET /commerce-api/site/purchases/${id}/suppliers`);
    return this.service.findSuppliers(id, orgId);
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

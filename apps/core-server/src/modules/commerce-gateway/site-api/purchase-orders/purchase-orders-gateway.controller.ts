import type { GoodsReceiptTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-table-response.dto';
import type { InboundDeliveryTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-table-response.dto';
import { AddPurchaseOrderItemDto } from '@commerce/purchase-orders/dto/request/add-purchase-order-item.dto';
import { ChangePurchaseOrderExchangeRateDto } from '@commerce/purchase-orders/dto/request/change-purchase-order-exchange-rate.dto';
import { ChangePurchaseOrderSupplierDto } from '@commerce/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import { CreatePurchaseOrderDto } from '@commerce/purchase-orders/dto/request/create-purchase-order.dto';
import { SendPurchaseOrderEmailDto } from '@commerce/purchase-orders/dto/request/send-purchase-order-email.dto';
import { SetPurchaseOrderConversionRateDto } from '@commerce/purchase-orders/dto/request/set-purchase-order-conversion-rate.dto';
import { UpdatePurchaseOrderItemDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-item.dto';
import { UpdatePurchaseOrderNotesDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-notes.dto';
import { UpdatePurchaseOrderStatusDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-status.dto';
import { UpdatePurchaseOrderTaxDateDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-tax-date.dto';
import type { PurchaseOrderItemTableResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-item-table-response.dto';
import type { PurchaseOrderProblemsResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-problems-response.dto';
import type { PurchaseOrderResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-response.dto';
import type { PurchaseOrderTableResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-table-response.dto';
import { CreatePurchaseOrderInvoiceDto } from '@commerce/supplier-invoices/dto/request/create-purchase-order-invoice.dto';
import type { PurchaseOrderInvoiceSummaryResponseDto } from '@commerce/supplier-invoices/dto/response/purchase-order-invoice-summary-response.dto';
import type { SupplierInvoiceResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-response.dto';
import type { SupplierInvoiceTableResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-table-response.dto';
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
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SITE_PURCHASE_ORDERS } from '@vritti/commerce-permissions/purchase-orders';
import type { FastifyReply } from 'fastify';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import {
  ApiAddItem,
  ApiChangeExchangeRate,
  ApiChangeSupplier,
  ApiClosePurchaseOrder,
  ApiCreate,
  ApiCreatePurchaseOrderInvoice,
  ApiDelete,
  ApiDownloadPdf,
  ApiFindById,
  ApiFindForTablePurchaseOrderInvoices,
  ApiFindGoodsReceiptTable,
  ApiFindInboundDeliveryTable,
  ApiFindItemIds,
  ApiFindItemsTable,
  ApiFindProblems,
  ApiFindPurchaseOrderInvoicesSummary,
  ApiGetTable,
  ApiRemoveItem,
  ApiSendEmail,
  ApiSetConversionRate,
  ApiUpdateItem,
  ApiUpdateNotes,
  ApiUpdateStatus,
  ApiUpdateTaxDate,
} from './docs/purchase-orders-gateway.docs';
import { PurchaseOrdersGatewayService } from './services/purchase-orders-gateway.service';

@ApiTags('Commerce - Purchase Orders')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_PURCHASE_ORDERS.featureCode)
@Controller('purchase-orders')
export class PurchaseOrdersGatewayController {
  private readonly logger = new Logger(PurchaseOrdersGatewayController.name);

  constructor(private readonly service: PurchaseOrdersGatewayService) {}

  // Returns the site's purchase orders for the data table
  @Get('table')
  @RequirePermission(SITE_PURCHASE_ORDERS.view)
  @ApiGetTable()
  getTable(@UserId() userId: string): Promise<PurchaseOrderTableResponseDto> {
    this.logger.log('GET /commerce-api/purchase-orders/table');
    return this.service.findForTable(userId);
  }

  // Creates a purchase order at the site
  @Post()
  @RequirePermission(SITE_PURCHASE_ORDERS.add)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreate()
  create(@Body() dto: CreatePurchaseOrderDto): Promise<CreateResponseDto<PurchaseOrderResponseDto>> {
    this.logger.log('POST /commerce-api/purchase-orders');
    return this.service.create(dto);
  }

  // Streams the purchase order as a PDF
  @Get(':id/pdf')
  @RequirePermission(SITE_PURCHASE_ORDERS.view)
  @ApiDownloadPdf()
  async downloadPdf(@Param('id') id: string, @Res() reply: FastifyReply): Promise<void> {
    this.logger.log(`GET /commerce-api/purchase-orders/${id}/pdf`);
    const { buffer, filename } = await this.service.downloadPdf(id);
    void reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `inline; filename="${filename}"`)
      .send(buffer);
  }

  // Returns one purchase order
  @Get(':id')
  @RequirePermission(SITE_PURCHASE_ORDERS.view)
  @ApiFindById()
  findById(@Param('id') id: string): Promise<PurchaseOrderResponseDto> {
    this.logger.log(`GET /commerce-api/purchase-orders/${id}`);
    return this.service.findById(id);
  }

  // Returns the inventory items ordered on a purchase order
  @Get(':id/items/ids')
  @RequirePermission(SITE_PURCHASE_ORDERS.view)
  @ApiFindItemIds()
  findItemIds(@Param('id') id: string): Promise<string[]> {
    this.logger.log(`GET /commerce-api/purchase-orders/${id}/items/ids`);
    return this.service.findItemIds(id);
  }

  // Returns a purchase order's lines for the data table
  @Get(':id/items/table')
  @RequirePermission(SITE_PURCHASE_ORDERS.view)
  @ApiFindItemsTable()
  findItemsTable(@Param('id') id: string, @UserId() userId: string): Promise<PurchaseOrderItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/purchase-orders/${id}/items/table`);
    return this.service.findItemsTable(id, userId);
  }

  // Returns the goods receipts counted against a purchase order, for the data table
  @Get(':id/goods-receipts/table')
  @RequirePermission(SITE_PURCHASE_ORDERS.view)
  @ApiFindGoodsReceiptTable()
  findGoodsReceiptTable(@Param('id') id: string, @UserId() userId: string): Promise<GoodsReceiptTableResponseDto> {
    this.logger.log(`GET /commerce-api/purchase-orders/${id}/goods-receipts/table`);
    return this.service.findGoodsReceiptTable(id, userId);
  }

  // Returns the inbound deliveries carrying a line of a purchase order, for the data table
  @Get(':id/inbound-deliveries/table')
  @RequirePermission(SITE_PURCHASE_ORDERS.view)
  @ApiFindInboundDeliveryTable()
  findInboundDeliveryTable(
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<InboundDeliveryTableResponseDto> {
    this.logger.log(`GET /commerce-api/purchase-orders/${id}/inbound-deliveries/table`);
    return this.service.findInboundDeliveryTable(id, userId);
  }

  // Returns the flags raised on a purchase order's receipts and invoices, grouped by order line
  @Get(':id/problems')
  @RequirePermission(SITE_PURCHASE_ORDERS.view)
  @ApiFindProblems()
  findProblems(@Param('id', new ParseUUIDPipe()) id: string): Promise<PurchaseOrderProblemsResponseDto> {
    this.logger.log(`GET /commerce-api/purchase-orders/${id}/problems`);
    return this.service.findProblems(id);
  }

  // Adds a line to a purchase order
  @Post(':id/items')
  @RequirePermission(SITE_PURCHASE_ORDERS.edit)
  @HttpCode(HttpStatus.CREATED)
  @ApiAddItem()
  addItem(
    @Param('id') id: string,
    @Body() dto: AddPurchaseOrderItemDto,
  ): Promise<CreateResponseDto<PurchaseOrderResponseDto>> {
    this.logger.log(`POST /commerce-api/purchase-orders/${id}/items`);
    return this.service.addItem(id, dto);
  }

  // Updates a line of a purchase order
  @Patch(':id/items/:itemId')
  @RequirePermission(SITE_PURCHASE_ORDERS.edit)
  @ApiUpdateItem()
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePurchaseOrderItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/items/${itemId}`);
    return this.service.updateItem(id, itemId, dto);
  }

  // Removes a line from a purchase order
  @Delete(':id/items/:itemId')
  @RequirePermission(SITE_PURCHASE_ORDERS.edit)
  @ApiRemoveItem()
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/purchase-orders/${id}/items/${itemId}`);
    return this.service.removeItem(id, itemId);
  }

  // Updates a purchase order's notes
  @Patch(':id/notes')
  @RequirePermission(SITE_PURCHASE_ORDERS.edit)
  @ApiUpdateNotes()
  updateNotes(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderNotesDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/notes`);
    return this.service.updateNotes(id, dto);
  }

  // Sets a purchase order's tax date and moves the lines that follow it
  @Patch(':id/tax-date')
  @RequirePermission(SITE_PURCHASE_ORDERS.edit)
  @ApiUpdateTaxDate()
  updateTaxDate(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderTaxDateDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/tax-date`);
    return this.service.updateTaxDate(id, dto);
  }

  // Moves a draft purchase order to another supplier
  @Patch(':id/supplier')
  @RequirePermission(SITE_PURCHASE_ORDERS.edit)
  @ApiChangeSupplier()
  changeSupplier(@Param('id') id: string, @Body() dto: ChangePurchaseOrderSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/supplier`);
    return this.service.changeSupplier(id, dto);
  }

  // Changes the exchange rate of a purchase order in another currency than the legal entity's
  @Patch(':id/exchange-rate')
  @RequirePermission(SITE_PURCHASE_ORDERS.edit)
  @ApiChangeExchangeRate()
  changeExchangeRate(
    @Param('id') id: string,
    @Body() dto: ChangePurchaseOrderExchangeRateDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/exchange-rate`);
    return this.service.changeExchangeRate(id, dto);
  }

  // Sets the rate from another of the supplier's currencies into the PO currency and converts its lines in it again
  @Patch(':id/conversion-rates')
  @RequirePermission(SITE_PURCHASE_ORDERS.edit)
  @ApiSetConversionRate()
  setConversionRate(
    @Param('id') id: string,
    @Body() dto: SetPurchaseOrderConversionRateDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/conversion-rates`);
    return this.service.setConversionRate(id, dto);
  }

  // Closes a purchase order short — no further receipts expected
  @Patch(':id/close')
  @RequirePermission(SITE_PURCHASE_ORDERS.edit)
  @ApiClosePurchaseOrder()
  closePurchaseOrder(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/close`);
    return this.service.closePurchaseOrder(id);
  }

  // Moves a purchase order along its manual workflow
  @Patch(':id/status')
  @RequirePermission(SITE_PURCHASE_ORDERS.edit)
  @HttpCode(HttpStatus.OK)
  @ApiUpdateStatus()
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/status`);
    return this.service.updateStatus(id, dto.status);
  }

  // Emails the purchase order with its PDF to the supplier
  @Post(':id/send-email')
  @RequirePermission(SITE_PURCHASE_ORDERS.edit)
  @HttpCode(HttpStatus.OK)
  @ApiSendEmail()
  sendEmail(@Param('id') id: string, @Body() dto: SendPurchaseOrderEmailDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/purchase-orders/${id}/send-email`);
    return this.service.sendEmail(id, dto);
  }

  // Deletes a draft purchase order
  @Delete(':id')
  @RequirePermission(SITE_PURCHASE_ORDERS.delete)
  @ApiDelete()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/purchase-orders/${id}`);
    return this.service.delete(id);
  }

  // Returns the invoices billing the purchase order for the data table
  @Get(':id/invoices/table')
  @RequirePermission(SITE_PURCHASE_ORDERS.invoices.view)
  @ApiFindForTablePurchaseOrderInvoices()
  getInvoicesTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
    @OrgId() orgId: string,
  ): Promise<SupplierInvoiceTableResponseDto> {
    this.logger.log(`GET /commerce-api/purchase-orders/${id}/invoices/table`);
    return this.service.findInvoicesTable(id, userId, orgId);
  }

  // Rolls the purchase order's invoices up into counts and the share of the ordered quantity billed
  @Get(':id/invoices/summary')
  @RequirePermission(SITE_PURCHASE_ORDERS.invoices.view)
  @ApiFindPurchaseOrderInvoicesSummary()
  getInvoicesSummary(@Param('id', new ParseUUIDPipe()) id: string): Promise<PurchaseOrderInvoiceSummaryResponseDto> {
    this.logger.log(`GET /commerce-api/purchase-orders/${id}/invoices/summary`);
    return this.service.findInvoicesSummary(id);
  }

  // Records a draft invoice billing the purchase order
  @Post(':id/invoices')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_PURCHASE_ORDERS.invoices.add)
  @ApiCreatePurchaseOrderInvoice()
  createInvoice(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreatePurchaseOrderInvoiceDto,
  ): Promise<CreateResponseDto<SupplierInvoiceResponseDto>> {
    this.logger.log(`POST /commerce-api/purchase-orders/${id}/invoices`);
    return this.service.createInvoice(id, dto);
  }
}

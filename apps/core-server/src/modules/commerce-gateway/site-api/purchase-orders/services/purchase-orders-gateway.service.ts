import type { GoodsReceiptResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-response.dto';
import type { GoodsReceiptTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-table-response.dto';
import type { InboundDeliveryResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-response.dto';
import type { InboundDeliveryTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-table-response.dto';
import type { AddPurchaseOrderItemDto } from '@commerce/purchase-orders/dto/request/add-purchase-order-item.dto';
import type { ChangePurchaseOrderExchangeRateDto } from '@commerce/purchase-orders/dto/request/change-purchase-order-exchange-rate.dto';
import type { ChangePurchaseOrderSupplierDto } from '@commerce/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import type { CreatePurchaseOrderDto } from '@commerce/purchase-orders/dto/request/create-purchase-order.dto';
import type { SendPurchaseOrderEmailDto } from '@commerce/purchase-orders/dto/request/send-purchase-order-email.dto';
import type { SetPurchaseOrderConversionRateDto } from '@commerce/purchase-orders/dto/request/set-purchase-order-conversion-rate.dto';
import type { UpdatePurchaseOrderItemDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-item.dto';
import type { UpdatePurchaseOrderNotesDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-notes.dto';
import type { UpdatePurchaseOrderTaxDateDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-tax-date.dto';
import type { PurchaseOrderItemResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-item-response.dto';
import type { PurchaseOrderItemTableResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-item-table-response.dto';
import type { PurchaseOrderProblemsResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-problems-response.dto';
import type { PurchaseOrderResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-response.dto';
import type { PurchaseOrderTableResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-table-response.dto';
import {
  PurchaseOrderDocumentsService,
  type PurchaseOrderPdf,
} from '@commerce/purchase-orders/services/purchase-order-documents.service';
import type { CreatePurchaseOrderInvoiceDto } from '@commerce/supplier-invoices/dto/request/create-purchase-order-invoice.dto';
import type { PurchaseOrderInvoiceSummaryResponseDto } from '@commerce/supplier-invoices/dto/response/purchase-order-invoice-summary-response.dto';
import type { SupplierInvoiceResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-response.dto';
import type { SupplierInvoiceTableResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class PurchaseOrdersGatewayService {
  private readonly logger = new Logger(PurchaseOrdersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly documents: PurchaseOrderDocumentsService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // Returns paginated purchase orders for the data table
  async findForTable(userId: string): Promise<PurchaseOrderTableResponseDto> {
    this.logger.log('site.purchaseOrders.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-site-purchase-orders');

    const { result, count } = await this.nats.send<{ result: PurchaseOrderResponseDto[]; count: number }>(
      'commerce',
      'site.purchaseOrders.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new purchase order
  async create(dto: CreatePurchaseOrderDto): Promise<CreateResponseDto<PurchaseOrderResponseDto>> {
    this.logger.log(`site.purchaseOrders.create — supplier: ${dto.supplierId}`);
    return this.nats.send('commerce', 'site.purchaseOrders.create', dto);
  }

  // Finds a purchase order by ID
  async findById(id: string): Promise<PurchaseOrderResponseDto> {
    this.logger.log(`site.purchaseOrders.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.purchaseOrders.findById', { id });
  }

  // Returns inventory item IDs for a purchase order
  async findItemIds(id: string): Promise<string[]> {
    this.logger.log(`site.purchaseOrders.itemIds — id: ${id}`);
    return this.nats.send('commerce', 'site.purchaseOrders.itemIds', { id });
  }

  // Returns line items table for a purchase order using persisted table state
  async findItemsTable(id: string, userId: string): Promise<PurchaseOrderItemTableResponseDto> {
    this.logger.log(`site.purchaseOrders.itemsTable — id: ${id}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-purchase-order-${id}-items`,
    );
    const { result, count } = await this.nats.send<{ result: PurchaseOrderItemResponseDto[]; count: number }>(
      'commerce',
      'site.purchaseOrders.itemsTable',
      { id, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns the goods receipts counted against a purchase order, for the data table
  async findGoodsReceiptTable(id: string, userId: string): Promise<GoodsReceiptTableResponseDto> {
    this.logger.log(`site.purchaseOrders.goodsReceipts — id: ${id}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-purchase-order-${id}-goods-receipts`,
    );
    const { result, count } = await this.nats.send<{ result: GoodsReceiptResponseDto[]; count: number }>(
      'commerce',
      'site.purchaseOrders.goodsReceipts',
      { purchaseOrderId: id, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns the inbound deliveries carrying a line of a purchase order, for the data table
  async findInboundDeliveryTable(id: string, userId: string): Promise<InboundDeliveryTableResponseDto> {
    this.logger.log(`site.purchaseOrders.inboundDeliveries — id: ${id}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-purchase-order-${id}-inbound-deliveries`,
    );
    const { result, count } = await this.nats.send<{ result: InboundDeliveryResponseDto[]; count: number }>(
      'commerce',
      'site.purchaseOrders.inboundDeliveries',
      { purchaseOrderId: id, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns the flags raised on a purchase order's receipts and invoices, grouped by order line
  findProblems(id: string): Promise<PurchaseOrderProblemsResponseDto> {
    this.logger.log(`site.purchaseOrders.problems — id: ${id}`);
    return this.nats.send('commerce', 'site.purchaseOrders.problems', { id });
  }

  // Adds a line item to a purchase order
  async addItem(id: string, dto: AddPurchaseOrderItemDto): Promise<CreateResponseDto<PurchaseOrderResponseDto>> {
    this.logger.log(`site.purchaseOrders.addItem — id: ${id}, supplierItemId: ${dto.supplierItemId}`);
    return this.nats.send('commerce', 'site.purchaseOrders.addItem', { purchaseOrderId: id, ...dto });
  }

  // Updates a line item on a purchase order
  async updateItem(id: string, itemId: string, dto: UpdatePurchaseOrderItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.updateItem — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.purchaseOrders.updateItem', { purchaseOrderId: id, itemId, ...dto });
  }

  // Removes a line item from a purchase order
  async removeItem(id: string, itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.removeItem — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.purchaseOrders.removeItem', { id, itemId });
  }

  // Updates purchase order notes
  async updateNotes(id: string, dto: UpdatePurchaseOrderNotesDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.updateNotes — id: ${id}`);
    return this.nats.send('commerce', 'site.purchaseOrders.updateNotes', { id, notes: dto.notes ?? null });
  }

  // Sets a purchase order's tax date and moves the lines that follow it
  async updateTaxDate(id: string, dto: UpdatePurchaseOrderTaxDateDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.updateTaxDate — id: ${id}, date: ${dto.taxDate}`);
    return this.nats.send('commerce', 'site.purchaseOrders.updateTaxDate', { id, ...dto });
  }

  // Changes purchase order supplier
  async changeSupplier(id: string, dto: ChangePurchaseOrderSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.changeSupplier — id: ${id}, supplier: ${dto.supplierId}`);
    return this.nats.send('commerce', 'site.purchaseOrders.changeSupplier', { id, ...dto });
  }

  // Changes the exchange rate of a purchase order in another currency than the legal entity's
  async changeExchangeRate(id: string, dto: ChangePurchaseOrderExchangeRateDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.changeExchangeRate — id: ${id}, rate: ${dto.exchangeRate}`);
    return this.nats.send('commerce', 'site.purchaseOrders.changeExchangeRate', { id, ...dto });
  }

  // Sets the rate from another of the supplier's currencies into the PO currency
  async setConversionRate(id: string, dto: SetPurchaseOrderConversionRateDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.setConversionRate — id: ${id}, currency: ${dto.currencyCode}`);
    return this.nats.send('commerce', 'site.purchaseOrders.setConversionRate', { id, ...dto });
  }

  // Closes a purchase order short — no further receipts expected
  async closePurchaseOrder(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.closeShort — id: ${id}`);
    return this.nats.send('commerce', 'site.purchaseOrders.closeShort', { id });
  }

  // Updates a purchase order status
  async updateStatus(id: string, status: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.updateStatus — id: ${id}, status: ${status}`);
    return this.nats.send('commerce', 'site.purchaseOrders.updateStatus', { id, status });
  }

  // Emails the purchase order with its PDF to the supplier and marks a draft as sent
  async sendEmail(id: string, dto: SendPurchaseOrderEmailDto): Promise<SuccessResponseDto> {
    const [po, items] = await Promise.all([this.findById(id), this.findItems(id)]);
    const recipientEmail = await this.documents.email(po, items, dto.email);
    if (po.status === 'DRAFT') await this.updateStatus(id, 'SENT');

    this.logger.log(`site.purchaseOrders.sendEmail — id: ${id}, recipient: ${recipientEmail}`);
    return { success: true, message: `Purchase order "${po.poNumber}" emailed to ${recipientEmail}.` };
  }

  // Deletes a purchase order by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.purchaseOrders.delete', { id });
  }

  // Returns the invoices billing a purchase order for the data table
  async findInvoicesTable(
    purchaseOrderId: string,
    userId: string,
    orgId: string,
  ): Promise<SupplierInvoiceTableResponseDto> {
    this.logger.log(`site.purchaseOrders.invoices.table — purchaseOrderId: ${purchaseOrderId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-purchase-order-${purchaseOrderId}-invoices`,
    );
    const { result, count } = await this.nats.send<{
      result: Omit<SupplierInvoiceResponseDto, 'siteName' | 'siteCode'>[];
      count: number;
    }>('commerce', 'site.purchaseOrders.invoices.table', { purchaseOrderId, ...state });
    return { result: await this.ownerNames.withSiteNames(orgId, result), count, state, activeViewId };
  }

  // Rolls a purchase order's invoices up into counts and the share of the ordered quantity billed
  findInvoicesSummary(purchaseOrderId: string): Promise<PurchaseOrderInvoiceSummaryResponseDto> {
    this.logger.log(`site.purchaseOrders.invoices.summary — purchaseOrderId: ${purchaseOrderId}`);
    return this.nats.send('commerce', 'site.purchaseOrders.invoices.summary', { purchaseOrderId });
  }

  // Records a draft invoice billing the purchase order
  createInvoice(
    purchaseOrderId: string,
    dto: CreatePurchaseOrderInvoiceDto,
  ): Promise<CreateResponseDto<SupplierInvoiceResponseDto>> {
    this.logger.log(
      `site.purchaseOrders.invoices.create — purchaseOrderId: ${purchaseOrderId}, number: ${dto.invoiceNumber}`,
    );
    return this.nats.send('commerce', 'site.purchaseOrders.invoices.create', { ...dto, purchaseOrderId });
  }

  // Renders the purchase order as a PDF for download
  async downloadPdf(id: string): Promise<PurchaseOrderPdf> {
    this.logger.log(`site.purchaseOrders.downloadPdf — id: ${id}`);
    const [po, items] = await Promise.all([this.findById(id), this.findItems(id)]);
    return this.documents.renderPdf(po, items);
  }

  // Returns every line of a purchase order
  private findItems(id: string): Promise<PurchaseOrderItemResponseDto[]> {
    this.logger.log(`site.purchaseOrders.items — id: ${id}`);
    return this.nats.send('commerce', 'site.purchaseOrders.items', { id });
  }
}

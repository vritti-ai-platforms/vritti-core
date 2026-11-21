import type { GoodsReceiptResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-response.dto';
import type { GoodsReceiptTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-table-response.dto';
import type { InboundDeliveryResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-response.dto';
import type { InboundDeliveryTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-table-response.dto';
import type { AddPurchaseOrderItemDto } from '@commerce/purchase-orders/dto/request/add-purchase-order-item.dto';
import type { ChangePurchaseOrderExchangeRateDto } from '@commerce/purchase-orders/dto/request/change-purchase-order-exchange-rate.dto';
import type { ChangePurchaseOrderSupplierDto } from '@commerce/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import type { LeCreatePurchaseOrderDto } from '@commerce/purchase-orders/dto/request/le-create-purchase-order.dto';
import type { PurchaseOrderItemDefaultsQueryDto } from '@commerce/purchase-orders/dto/request/purchase-order-item-defaults-query.dto';
import type { SendPurchaseOrderEmailDto } from '@commerce/purchase-orders/dto/request/send-purchase-order-email.dto';
import type { SetPurchaseOrderConversionRateDto } from '@commerce/purchase-orders/dto/request/set-purchase-order-conversion-rate.dto';
import type { UpdatePurchaseOrderItemDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-item.dto';
import type { UpdatePurchaseOrderNotesDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-notes.dto';
import type { UpdatePurchaseOrderTaxDateDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-tax-date.dto';
import type { LePurchaseOrderResponseDto } from '@commerce/purchase-orders/dto/response/le-purchase-order-response.dto';
import type { LePurchaseOrderTableResponseDto } from '@commerce/purchase-orders/dto/response/le-purchase-order-table-response.dto';
import type { PurchaseOrderCountsResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-counts-response.dto';
import type { PurchaseOrderItemDefaultsResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-item-defaults-response.dto';
import type { PurchaseOrderItemResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-item-response.dto';
import type {
  PurchaseOrderItemTableResponseDto,
  PurchaseOrderItemTableRowResponseDto,
} from '@commerce/purchase-orders/dto/response/purchase-order-item-table-response.dto';
import type { PurchaseOrderProblemsResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-problems-response.dto';
import type { PurchaseOrderResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-response.dto';
import {
  PurchaseOrderDocumentsService,
  type PurchaseOrderPdf,
} from '@commerce/purchase-orders/services/purchase-order-documents.service';
import type { PurchaseOrderInvoiceSummaryResponseDto } from '@commerce/supplier-invoices/dto/response/purchase-order-invoice-summary-response.dto';
import type { SupplierInvoiceResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-response.dto';
import type { SupplierInvoiceTableResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class LePurchaseOrdersGatewayService {
  private readonly logger = new Logger(LePurchaseOrdersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly documents: PurchaseOrderDocumentsService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // Creates a purchase order at one of the legal entity's sites
  create(dto: LeCreatePurchaseOrderDto): Promise<CreateResponseDto<PurchaseOrderResponseDto>> {
    this.logger.log(`le.purchaseOrders.create — supplier: ${dto.supplierId}, site: ${dto.siteId}`);
    return this.nats.send('commerce', 'le.purchaseOrders.create', dto);
  }

  // Adds a line item to a purchase order
  async addItem(id: string, dto: AddPurchaseOrderItemDto): Promise<CreateResponseDto<PurchaseOrderResponseDto>> {
    this.logger.log(`le.purchaseOrders.addItem — id: ${id}, inventoryItemId: ${dto.inventoryItemId}`);
    return this.nats.send('commerce', 'le.purchaseOrders.addItem', { purchaseOrderId: id, ...dto });
  }

  // Updates a line item on a purchase order
  async updateItem(id: string, itemId: string, dto: UpdatePurchaseOrderItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.updateItem — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'le.purchaseOrders.updateItem', { purchaseOrderId: id, itemId, ...dto });
  }

  // Updates purchase order notes
  async updateNotes(id: string, dto: UpdatePurchaseOrderNotesDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.updateNotes — id: ${id}`);
    return this.nats.send('commerce', 'le.purchaseOrders.updateNotes', { id, notes: dto.notes ?? null });
  }

  // Sets a purchase order's tax date and moves the lines that follow it
  async updateTaxDate(id: string, dto: UpdatePurchaseOrderTaxDateDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.updateTaxDate — id: ${id}, date: ${dto.taxDate}`);
    return this.nats.send('commerce', 'le.purchaseOrders.updateTaxDate', { id, ...dto });
  }

  // Updates a purchase order status
  async updateStatus(id: string, status: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.updateStatus — id: ${id}, status: ${status}`);
    return this.nats.send('commerce', 'le.purchaseOrders.updateStatus', { id, status });
  }

  // Moves a draft purchase order to another supplier, resolving a new currency against the legal entity's
  changeSupplier(id: string, dto: ChangePurchaseOrderSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.changeSupplier — id: ${id}, supplier: ${dto.supplierId}`);
    return this.nats.send('commerce', 'le.purchaseOrders.changeSupplier', { id, ...dto });
  }

  // Changes the exchange rate of a purchase order in another currency than the legal entity's
  changeExchangeRate(id: string, dto: ChangePurchaseOrderExchangeRateDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.changeExchangeRate — id: ${id}, rate: ${dto.exchangeRate}`);
    return this.nats.send('commerce', 'le.purchaseOrders.changeExchangeRate', { id, ...dto });
  }

  // Sets the rate from another of the supplier's currencies into the PO currency
  async setConversionRate(id: string, dto: SetPurchaseOrderConversionRateDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.setConversionRate — id: ${id}, currency: ${dto.currencyCode}`);
    return this.nats.send('commerce', 'le.purchaseOrders.setConversionRate', { id, ...dto });
  }

  // Marks a purchase order delivery completed — no further receipts expected
  async completeDelivery(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.completeDelivery — id: ${id}`);
    return this.nats.send('commerce', 'le.purchaseOrders.completeDelivery', { id });
  }

  // Emails the purchase order with its PDF to the supplier and marks a draft as sent
  async sendEmail(id: string, dto: SendPurchaseOrderEmailDto): Promise<SuccessResponseDto> {
    const [po, items] = await Promise.all([this.findPurchaseOrder(id), this.findItems(id)]);
    const recipientEmail = await this.documents.email(po, items, dto.email);
    if (po.status === 'DRAFT') await this.updateStatus(id, 'SENT');

    this.logger.log(`le.purchaseOrders.sendEmail — id: ${id}, recipient: ${recipientEmail}`);
    return { success: true, message: `Purchase order "${po.poNumber}" emailed to ${recipientEmail}.` };
  }

  // Returns one purchase order with its site named
  async findById(id: string, orgId: string): Promise<LePurchaseOrderResponseDto> {
    const [named] = await this.ownerNames.withSiteNames(orgId, [await this.findPurchaseOrder(id)]);
    return named;
  }

  // Returns the purchase orders of the legal entity's sites with site names
  async findForTable(userId: string, orgId: string): Promise<LePurchaseOrderTableResponseDto> {
    this.logger.log('le.purchaseOrders.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-le-purchase-orders');
    const { result, count } = await this.nats.send<{ result: PurchaseOrderResponseDto[]; count: number }>(
      'commerce',
      'le.purchaseOrders.table',
      state,
    );
    return { result: await this.ownerNames.withSiteNames(orgId, result), count, state, activeViewId };
  }

  // Returns line items table for a purchase order using persisted table state
  async findItemsTable(id: string, userId: string): Promise<PurchaseOrderItemTableResponseDto> {
    this.logger.log(`le.purchaseOrders.itemsTable — id: ${id}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-purchase-order-${id}-items`,
    );
    const { result, count } = await this.nats.send<{ result: PurchaseOrderItemTableRowResponseDto[]; count: number }>(
      'commerce',
      'le.purchaseOrders.itemsTable',
      { id, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns the goods receipts counted against a purchase order, for the data table
  async findGoodsReceiptTable(id: string, userId: string): Promise<GoodsReceiptTableResponseDto> {
    this.logger.log(`le.purchaseOrders.goodsReceipts — id: ${id}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-purchase-order-${id}-goods-receipts`,
    );
    const { result, count } = await this.nats.send<{ result: GoodsReceiptResponseDto[]; count: number }>(
      'commerce',
      'le.purchaseOrders.goodsReceipts',
      { purchaseOrderId: id, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns the inbound deliveries carrying a line of a purchase order, for the data table
  async findInboundDeliveryTable(id: string, userId: string): Promise<InboundDeliveryTableResponseDto> {
    this.logger.log(`le.purchaseOrders.inboundDeliveries — id: ${id}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-purchase-order-${id}-inbound-deliveries`,
    );
    const { result, count } = await this.nats.send<{ result: InboundDeliveryResponseDto[]; count: number }>(
      'commerce',
      'le.purchaseOrders.inboundDeliveries',
      { purchaseOrderId: id, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns the invoices with a line invoicing a purchase order for the data table
  async findInvoicesTable(
    purchaseOrderId: string,
    userId: string,
    orgId: string,
  ): Promise<SupplierInvoiceTableResponseDto> {
    this.logger.log(`le.purchaseOrders.invoices.table — purchaseOrderId: ${purchaseOrderId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-purchase-order-${purchaseOrderId}-invoices`,
    );
    const { result, count } = await this.nats.send<{
      result: Omit<SupplierInvoiceResponseDto, 'siteName' | 'siteCode'>[];
      count: number;
    }>('commerce', 'le.purchaseOrders.invoices.table', { purchaseOrderId, ...state });
    return { result: await this.ownerNames.withSiteNames(orgId, result), count, state, activeViewId };
  }

  // What a new line of an item starts with on a purchase order: the supplier's unit, price, scheme and delivery
  findItemDefaults(
    id: string,
    query: PurchaseOrderItemDefaultsQueryDto,
  ): Promise<PurchaseOrderItemDefaultsResponseDto> {
    this.logger.log(`le.purchaseOrders.itemDefaults — id: ${id}, inventoryItemId: ${query.inventoryItemId}`);
    return this.nats.send('commerce', 'le.purchaseOrders.itemDefaults', { id, ...query });
  }

  // Returns inventory item IDs for a purchase order
  async findItemIds(id: string): Promise<string[]> {
    this.logger.log(`le.purchaseOrders.itemIds — id: ${id}`);
    return this.nats.send('commerce', 'le.purchaseOrders.itemIds', { id });
  }

  // Returns the flags raised on a purchase order's receipts and the open holds on its invoice lines, grouped by order line
  findProblems(id: string): Promise<PurchaseOrderProblemsResponseDto> {
    this.logger.log(`le.purchaseOrders.problems — id: ${id}`);
    return this.nats.send('commerce', 'le.purchaseOrders.problems', { id });
  }

  // Rolls a purchase order's invoices up into counts and the share of the due quantity invoiced
  findInvoicesSummary(purchaseOrderId: string): Promise<PurchaseOrderInvoiceSummaryResponseDto> {
    this.logger.log(`le.purchaseOrders.invoices.summary — purchaseOrderId: ${purchaseOrderId}`);
    return this.nats.send('commerce', 'le.purchaseOrders.invoices.summary', { purchaseOrderId });
  }

  // Counts a purchase order's lines and the deliveries, receipts and invoices on them, one per tab of its detail page
  findCounts(id: string): Promise<PurchaseOrderCountsResponseDto> {
    this.logger.log(`le.purchaseOrders.findCounts — id: ${id}`);
    return this.nats.send('commerce', 'le.purchaseOrders.findCounts', { id });
  }

  // Renders the purchase order as a PDF for download
  async downloadPdf(id: string): Promise<PurchaseOrderPdf> {
    this.logger.log(`le.purchaseOrders.downloadPdf — id: ${id}`);
    const [po, items] = await Promise.all([this.findPurchaseOrder(id), this.findItems(id)]);
    return this.documents.renderPdf(po, items);
  }

  // Deletes a purchase order by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.delete — id: ${id}`);
    return this.nats.send('commerce', 'le.purchaseOrders.delete', { id });
  }

  // Removes a line item from a purchase order
  async removeItem(id: string, itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.removeItem — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'le.purchaseOrders.removeItem', { id, itemId });
  }

  // Returns one purchase order
  private findPurchaseOrder(id: string): Promise<PurchaseOrderResponseDto> {
    this.logger.log(`le.purchaseOrders.findById — id: ${id}`);
    return this.nats.send('commerce', 'le.purchaseOrders.findById', { id });
  }

  // Returns every line of a purchase order
  private findItems(id: string): Promise<PurchaseOrderItemResponseDto[]> {
    this.logger.log(`le.purchaseOrders.items — id: ${id}`);
    return this.nats.send('commerce', 'le.purchaseOrders.items', { id });
  }
}

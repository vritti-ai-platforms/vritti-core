import type { GoodsReceiptResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-response.dto';
import type { GoodsReceiptTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-table-response.dto';
import type { InboundDeliveryResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-response.dto';
import type { InboundDeliveryTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-table-response.dto';
import type { AddPurchaseOrderItemDto } from '@commerce/purchase-orders/dto/request/add-purchase-order-item.dto';
import type { ChangePurchaseOrderExchangeRateDto } from '@commerce/purchase-orders/dto/request/change-purchase-order-exchange-rate.dto';
import type { ChangePurchaseOrderSupplierDto } from '@commerce/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import type { LeCreatePurchaseOrderDto } from '@commerce/purchase-orders/dto/request/le-create-purchase-order.dto';
import type { SendPurchaseOrderEmailDto } from '@commerce/purchase-orders/dto/request/send-purchase-order-email.dto';
import type { SetPurchaseOrderConversionRateDto } from '@commerce/purchase-orders/dto/request/set-purchase-order-conversion-rate.dto';
import type { UpdatePurchaseOrderItemDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-item.dto';
import type { UpdatePurchaseOrderNotesDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-notes.dto';
import type { UpdatePurchaseOrderTaxDateDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-tax-date.dto';
import type { LePurchaseOrderResponseDto } from '@commerce/purchase-orders/dto/response/le-purchase-order-response.dto';
import type { LePurchaseOrderTableResponseDto } from '@commerce/purchase-orders/dto/response/le-purchase-order-table-response.dto';
import type { PurchaseOrderItemResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-item-response.dto';
import type { PurchaseOrderItemTableResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-item-table-response.dto';
import type { PurchaseOrderProblemsResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-problems-response.dto';
import type { PurchaseOrderResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-response.dto';
import {
  PurchaseOrderDocumentsService,
  type PurchaseOrderPdf,
} from '@commerce/purchase-orders/services/purchase-order-documents.service';
import type { CreatePurchaseOrderInvoiceDto } from '@commerce/supplier-invoices/dto/request/create-purchase-order-invoice.dto';
import type { PurchaseOrderInvoiceSummaryResponseDto } from '@commerce/supplier-invoices/dto/response/purchase-order-invoice-summary-response.dto';
import type { SupplierInvoiceResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-response.dto';
import type { SupplierInvoiceTableResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-table-response.dto';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';
import { SiteContextResolverService } from '@/site-context/site-context-resolver.service';

@Injectable()
export class LePurchaseOrdersGatewayService {
  private readonly logger = new Logger(LePurchaseOrdersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly documents: PurchaseOrderDocumentsService,
    private readonly ownerNames: OwnerNameService,
    private readonly siteContextResolver: SiteContextResolverService,
    private readonly siteRepository: SiteDomainRepository,
  ) {}

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

  // Creates a purchase order at one of the legal entity's sites, in its timezone and against the company's currency
  async create(
    dto: LeCreatePurchaseOrderDto,
    legalEntityId: string | undefined,
  ): Promise<CreateResponseDto<PurchaseOrderResponseDto>> {
    this.logger.log(`le.purchaseOrders.create — supplier: ${dto.supplierId}, site: ${dto.siteId}`);
    const site = await this.siteContextResolver.resolve(dto.siteId);
    if (site.legalEntityId !== legalEntityId) {
      throw new BadRequestException({
        label: 'Site Not In Company',
        detail: 'Purchase orders can only be raised for the sites of the company you are working in.',
        errors: [{ field: 'siteId', message: 'Not one of your sites' }],
      });
    }
    return this.nats.send('commerce', 'le.purchaseOrders.create', {
      ...dto,
      timezone: site.siteTimezone,
      leCurrencyCode: site.siteCurrencyCode,
    });
  }

  // Returns one purchase order with its site named
  async findById(id: string, orgId: string): Promise<LePurchaseOrderResponseDto> {
    const [named] = await this.ownerNames.withSiteNames(orgId, [await this.findPurchaseOrder(id)]);
    return named;
  }

  // Returns inventory item IDs for a purchase order
  async findItemIds(id: string): Promise<string[]> {
    this.logger.log(`le.purchaseOrders.itemIds — id: ${id}`);
    return this.nats.send('commerce', 'le.purchaseOrders.itemIds', { id });
  }

  // Returns line items table for a purchase order using persisted table state
  async findItemsTable(id: string, userId: string): Promise<PurchaseOrderItemTableResponseDto> {
    this.logger.log(`le.purchaseOrders.itemsTable — id: ${id}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-purchase-order-${id}-items`,
    );
    const { result, count } = await this.nats.send<{ result: PurchaseOrderItemResponseDto[]; count: number }>(
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

  // Returns the flags raised on a purchase order's receipts and invoices, grouped by order line
  findProblems(id: string): Promise<PurchaseOrderProblemsResponseDto> {
    this.logger.log(`le.purchaseOrders.problems — id: ${id}`);
    return this.nats.send('commerce', 'le.purchaseOrders.problems', { id });
  }

  // Adds a line item to a purchase order
  async addItem(id: string, dto: AddPurchaseOrderItemDto): Promise<CreateResponseDto<PurchaseOrderResponseDto>> {
    this.logger.log(`le.purchaseOrders.addItem — id: ${id}, supplierItemId: ${dto.supplierItemId}`);
    return this.nats.send('commerce', 'le.purchaseOrders.addItem', { purchaseOrderId: id, ...dto });
  }

  // Updates a line item on a purchase order
  async updateItem(id: string, itemId: string, dto: UpdatePurchaseOrderItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.updateItem — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'le.purchaseOrders.updateItem', { purchaseOrderId: id, itemId, ...dto });
  }

  // Removes a line item from a purchase order
  async removeItem(id: string, itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.removeItem — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'le.purchaseOrders.removeItem', { id, itemId });
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

  // Moves a draft purchase order to another supplier, resolving a new currency against the legal entity's
  async changeSupplier(
    id: string,
    dto: ChangePurchaseOrderSupplierDto,
    legalEntityId: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.changeSupplier — id: ${id}, supplier: ${dto.supplierId}`);
    return this.nats.send('commerce', 'le.purchaseOrders.changeSupplier', {
      id,
      ...dto,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
  }

  // Changes the exchange rate of a purchase order in another currency than the legal entity's
  async changeExchangeRate(
    id: string,
    dto: ChangePurchaseOrderExchangeRateDto,
    legalEntityId: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.changeExchangeRate — id: ${id}, rate: ${dto.exchangeRate}`);
    return this.nats.send('commerce', 'le.purchaseOrders.changeExchangeRate', {
      id,
      ...dto,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
  }

  // Sets the rate from another of the supplier's currencies into the PO currency
  async setConversionRate(id: string, dto: SetPurchaseOrderConversionRateDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.setConversionRate — id: ${id}, currency: ${dto.currencyCode}`);
    return this.nats.send('commerce', 'le.purchaseOrders.setConversionRate', { id, ...dto });
  }

  // Closes a purchase order short — no further receipts expected
  async closePurchaseOrder(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.closeShort — id: ${id}`);
    return this.nats.send('commerce', 'le.purchaseOrders.closeShort', { id });
  }

  // Updates a purchase order status
  async updateStatus(id: string, status: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.updateStatus — id: ${id}, status: ${status}`);
    return this.nats.send('commerce', 'le.purchaseOrders.updateStatus', { id, status });
  }

  // Emails the purchase order with its PDF to the supplier and marks a draft as sent
  async sendEmail(id: string, dto: SendPurchaseOrderEmailDto): Promise<SuccessResponseDto> {
    const [po, items] = await Promise.all([this.findPurchaseOrder(id), this.findItems(id)]);
    const recipientEmail = await this.documents.email(po, items, dto.email);
    if (po.status === 'DRAFT') await this.updateStatus(id, 'SENT');

    this.logger.log(`le.purchaseOrders.sendEmail — id: ${id}, recipient: ${recipientEmail}`);
    return { success: true, message: `Purchase order "${po.poNumber}" emailed to ${recipientEmail}.` };
  }

  // Deletes a purchase order by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.delete — id: ${id}`);
    return this.nats.send('commerce', 'le.purchaseOrders.delete', { id });
  }

  // Returns the invoices billing a purchase order for the data table
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

  // Rolls a purchase order's invoices up into counts and the share of the ordered quantity billed
  findInvoicesSummary(purchaseOrderId: string): Promise<PurchaseOrderInvoiceSummaryResponseDto> {
    this.logger.log(`le.purchaseOrders.invoices.summary — purchaseOrderId: ${purchaseOrderId}`);
    return this.nats.send('commerce', 'le.purchaseOrders.invoices.summary', { purchaseOrderId });
  }

  // Records a draft invoice billing the purchase order
  createInvoice(
    purchaseOrderId: string,
    dto: CreatePurchaseOrderInvoiceDto,
  ): Promise<CreateResponseDto<SupplierInvoiceResponseDto>> {
    this.logger.log(
      `le.purchaseOrders.invoices.create — purchaseOrderId: ${purchaseOrderId}, number: ${dto.invoiceNumber}`,
    );
    return this.nats.send('commerce', 'le.purchaseOrders.invoices.create', { ...dto, purchaseOrderId });
  }

  // Renders the purchase order as a PDF for download
  async downloadPdf(id: string): Promise<PurchaseOrderPdf> {
    this.logger.log(`le.purchaseOrders.downloadPdf — id: ${id}`);
    const [po, items] = await Promise.all([this.findPurchaseOrder(id), this.findItems(id)]);
    return this.documents.renderPdf(po, items);
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

  // Resolves the legal entity's currency a PO rate converts into and invoices are costed in; an LE request carries no site
  // context to read it from
  private async leCurrencyCode(legalEntityId: string | undefined): Promise<string> {
    const legalEntity = legalEntityId ? await this.siteRepository.findLegalEntityById(legalEntityId) : undefined;
    if (!legalEntity) throw new NotFoundException('Legal entity not found.');
    return legalEntity.currencyCode;
  }
}

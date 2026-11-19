import type { CancelPurchaseDto } from '@commerce/purchases/dto/request/cancel-purchase.dto';
import type { CancelSupplierDto } from '@commerce/purchases/dto/request/cancel-supplier.dto';
import type { ChangePurchaseMinQuotationsDto } from '@commerce/purchases/dto/request/change-purchase-min-quotations.dto';
import type { ChangePurchaseNotesDto } from '@commerce/purchases/dto/request/change-purchase-notes.dto';
import type { ClosePurchaseDto } from '@commerce/purchases/dto/request/close-purchase.dto';
import type { CloseSupplierDto } from '@commerce/purchases/dto/request/close-supplier.dto';
import type { CreateLegGoodsReceiptDto } from '@commerce/purchases/dto/request/create-leg-goods-receipt.dto';
import type { CreateLegInboundDeliveryDto } from '@commerce/purchases/dto/request/create-leg-inbound-delivery.dto';
import type { CreateLegPurchaseOrderDto } from '@commerce/purchases/dto/request/create-leg-purchase-order.dto';
import type { CreatePurchaseDto } from '@commerce/purchases/dto/request/create-purchase.dto';
import type { CreatePurchaseAllocationDto } from '@commerce/purchases/dto/request/create-purchase-allocation.dto';
import type { CreatePurchaseAllocationsFromQuotationDto } from '@commerce/purchases/dto/request/create-purchase-allocations-from-quotation.dto';
import type { CreatePurchaseItemDto } from '@commerce/purchases/dto/request/create-purchase-item.dto';
import type { CreatePurchaseSupplierInvoiceDto } from '@commerce/purchases/dto/request/create-purchase-supplier-invoice.dto';
import type { DisablePurchaseQuotationsDto } from '@commerce/purchases/dto/request/disable-purchase-quotations.dto';
import type { EnablePurchaseQuotationsDto } from '@commerce/purchases/dto/request/enable-purchase-quotations.dto';
import type { ReceiveWithInvoiceDto } from '@commerce/purchases/dto/request/receive-with-invoice.dto';
import type { ReceiveWithInvoiceOpenLinesQueryDto } from '@commerce/purchases/dto/request/receive-with-invoice-open-lines-query.dto';
import type { RejectPurchaseLegDto } from '@commerce/purchases/dto/request/reject-purchase-leg.dto';
import type { RequestPurchaseQuotationDto } from '@commerce/purchases/dto/request/request-purchase-quotation.dto';
import type { UpdatePurchaseAllocationDto } from '@commerce/purchases/dto/request/update-purchase-allocation.dto';
import type { UpdatePurchaseItemDto } from '@commerce/purchases/dto/request/update-purchase-item.dto';
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
import type {
  PurchaseQuotationResponseDto,
  PurchaseQuotationTableResponseDto,
} from '@commerce/purchases/dto/response/purchase-quotation-response.dto';
import type { PurchaseResponseDto } from '@commerce/purchases/dto/response/purchase-response.dto';
import type { PurchaseSettingsResponseDto } from '@commerce/purchases/dto/response/purchase-settings-response.dto';
import type { PurchaseTableResponseDto } from '@commerce/purchases/dto/response/purchase-table-response.dto';
import type { PurchaseTableRowResponseDto } from '@commerce/purchases/dto/response/purchase-table-row-response.dto';
import type { ReceiveWithInvoiceDetailResponseDto } from '@commerce/purchases/dto/response/receive-with-invoice-detail-response.dto';
import type { ReceiveWithInvoiceOpenLineResponseDto } from '@commerce/purchases/dto/response/receive-with-invoice-open-line-response.dto';
import type { RequestedPurchaseQuotationResponseDto } from '@commerce/purchases/dto/response/requested-purchase-quotation-response.dto';
import {
  PurchaseNamesService,
  type UnnamedPurchase,
  type UnnamedPurchaseLeg,
} from '@commerce/purchases/services/purchase-names.service';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class PurchasesGatewayService {
  private readonly logger = new Logger(PurchasesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly ownerNames: OwnerNameService,
    private readonly purchaseNames: PurchaseNamesService,
  ) {}

  // Creates a purchase at the site, optionally with its items
  create(dto: CreatePurchaseDto): Promise<CreateResponseDto<PurchaseResponseDto>> {
    this.logger.log('site.purchases.create');
    return this.nats.send('commerce', 'site.purchases.create', dto);
  }

  // Adds an item the purchase does not have yet
  createItem(id: string, dto: CreatePurchaseItemDto): Promise<CreateResponseDto<PurchaseItemResponseDto>> {
    this.logger.log(`site.purchases.items.create — id: ${id}, inventoryItemId: ${dto.inventoryItemId}`);
    return this.nats.send('commerce', 'site.purchases.items.create', { id, ...dto });
  }

  // Creates a draft legal-entity quotation from a supplier for the purchase's items
  requestQuotation(
    id: string,
    dto: RequestPurchaseQuotationDto,
  ): Promise<CreateResponseDto<RequestedPurchaseQuotationResponseDto>> {
    this.logger.log(`site.purchases.quotations.request — id: ${id}, supplierId: ${dto.supplierId}`);
    return this.nats.send('commerce', 'site.purchases.quotations.request', { id, ...dto });
  }

  // Allocates part of an item to a supplier, opening its leg on the first allocation
  createAllocation(
    id: string,
    dto: CreatePurchaseAllocationDto,
  ): Promise<CreateResponseDto<PurchaseAllocationResponseDto>> {
    this.logger.log(
      `site.purchases.allocations.create — id: ${id}, purchaseItemId: ${dto.purchaseItemId}, supplierId: ${dto.supplierId}`,
    );
    return this.nats.send('commerce', 'site.purchases.allocations.create', { id, ...dto });
  }

  // Allocates items from posted quotation lines
  createAllocationsFromQuotation(
    id: string,
    dto: CreatePurchaseAllocationsFromQuotationDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(
      `site.purchases.allocations.createFromQuotation — id: ${id}, quotation: ${dto.supplierQuotationId ?? 'lines'}`,
    );
    return this.nats.send('commerce', 'site.purchases.allocations.createFromQuotation', { id, ...dto });
  }

  // Creates a leg's purchase orders, one per currency of its allocations
  createLegPurchaseOrder(
    id: string,
    legId: string,
    dto: CreateLegPurchaseOrderDto,
  ): Promise<CreateResponseDto<CreatedLegPurchaseOrdersResponseDto>> {
    this.logger.log(
      `site.purchases.legs.createPurchaseOrder — id: ${id}, legId: ${legId}, orderDate: ${dto.orderDate}`,
    );
    return this.nats.send('commerce', 'site.purchases.legs.createPurchaseOrder', { id, legId, ...dto });
  }

  // Creates an inbound delivery of a leg's confirmed purchase order lines
  createLegInboundDelivery(
    id: string,
    legId: string,
    dto: CreateLegInboundDeliveryDto,
  ): Promise<CreateResponseDto<CreatedLegInboundDeliveryResponseDto>> {
    this.logger.log(
      `site.purchases.legs.createInboundDelivery — id: ${id}, legId: ${legId}, lines: ${dto.lines.length}`,
    );
    return this.nats.send('commerce', 'site.purchases.legs.createInboundDelivery', { id, legId, ...dto });
  }

  // Creates a draft goods receipt of a leg, from one of its inbound deliveries or its open lines
  createLegGoodsReceipt(
    id: string,
    legId: string,
    dto: CreateLegGoodsReceiptDto,
  ): Promise<CreateResponseDto<CreatedLegGoodsReceiptResponseDto>> {
    this.logger.log(
      `site.purchases.legs.createGoodsReceipt — id: ${id}, legId: ${legId}, inboundDeliveryId: ${dto.inboundDeliveryId ?? 'none'}`,
    );
    return this.nats.send('commerce', 'site.purchases.legs.createGoodsReceipt', { id, legId, ...dto });
  }

  // Drafts a supplier invoice for the received, uninvoiced goods of the supplier's open legs
  createSupplierInvoice(
    dto: CreatePurchaseSupplierInvoiceDto,
  ): Promise<CreateResponseDto<CreatedPurchaseSupplierInvoiceResponseDto>> {
    this.logger.log(
      `site.purchases.supplierInvoices.create — supplierId: ${dto.supplierId}, invoice: ${dto.invoiceNumber}`,
    );
    return this.nats.send('commerce', 'site.purchases.supplierInvoices.create', dto);
  }

  // Drafts a Receive with Invoice: the inbound deliveries, goods receipts and supplier invoice of the supplier's invoice
  createReceiveWithInvoice(
    dto: ReceiveWithInvoiceDto,
  ): Promise<CreateResponseDto<CreatedPurchaseSupplierInvoiceResponseDto>> {
    this.logger.log(
      `site.purchases.receiveWithInvoices.create — supplierId: ${dto.supplierId}, invoice: ${dto.invoiceNumber}, lines: ${dto.lines.length}`,
    );
    return this.nats.send('commerce', 'site.purchases.receiveWithInvoices.create', dto);
  }

  // Changes an open purchase's notes
  changeNotes(id: string, dto: ChangePurchaseNotesDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.changeNotes — id: ${id}`);
    return this.nats.send('commerce', 'site.purchases.changeNotes', { id, ...dto });
  }

  // Requires quotations on a purchase none of whose suppliers is submitted yet
  enableQuotations(id: string, dto: EnablePurchaseQuotationsDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.enableQuotations — id: ${id}, minQuotations: ${dto.minQuotations}`);
    return this.nats.send('commerce', 'site.purchases.enableQuotations', { id, ...dto });
  }

  // Stops requiring quotations on an open purchase, with why
  disableQuotations(id: string, dto: DisablePurchaseQuotationsDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.disableQuotations — id: ${id}`);
    return this.nats.send('commerce', 'site.purchases.disableQuotations', { id, ...dto });
  }

  // Changes how many posted quotations each item needs before its supplier is submitted
  changeMinQuotations(id: string, dto: ChangePurchaseMinQuotationsDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.changeMinQuotations — id: ${id}, minQuotations: ${dto.minQuotations}`);
    return this.nats.send('commerce', 'site.purchases.changeMinQuotations', { id, ...dto });
  }

  // Changes an item
  updateItem(id: string, itemId: string, dto: UpdatePurchaseItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.items.update — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.purchases.items.update', { id, itemId, ...dto });
  }

  // Changes an allocation
  updateAllocation(id: string, allocationId: string, dto: UpdatePurchaseAllocationDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.allocations.update — id: ${id}, allocationId: ${allocationId}`);
    return this.nats.send('commerce', 'site.purchases.allocations.update', { id, allocationId, ...dto });
  }

  // Replaces a draft Receive with Invoice
  updateReceiveWithInvoice(invoiceId: string, dto: ReceiveWithInvoiceDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.receiveWithInvoices.update — invoiceId: ${invoiceId}, lines: ${dto.lines.length}`);
    return this.nats.send('commerce', 'site.purchases.receiveWithInvoices.update', { invoiceId, ...dto });
  }

  // Cancels a purchase with a reason
  cancel(id: string, dto: CancelPurchaseDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.cancel — id: ${id}`);
    return this.nats.send('commerce', 'site.purchases.cancel', { id, ...dto });
  }

  // Starts every leg still in sourcing
  submit(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.submit — id: ${id}`);
    return this.nats.send('commerce', 'site.purchases.submit', { id });
  }
  // Closes a purchase: suppliers with goods received stop expecting more, the others are cancelled
  close(id: string, dto: ClosePurchaseDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.close — id: ${id}`);
    return this.nats.send('commerce', 'site.purchases.close', { id, ...dto });
  }

  // Submits one supplier's leg still in sourcing
  submitSupplier(id: string, legId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.legs.submitSupplier — id: ${id}, legId: ${legId}`);
    return this.nats.send('commerce', 'site.purchases.legs.submitSupplier', { id, legId });
  }

  // Approves a leg waiting for approval
  approveLeg(id: string, legId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.legs.approve — id: ${id}, legId: ${legId}`);
    return this.nats.send('commerce', 'site.purchases.legs.approve', { id, legId });
  }

  // Rejects a leg waiting for approval, returning only that leg to sourcing
  rejectLeg(id: string, legId: string, dto: RejectPurchaseLegDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.legs.reject — id: ${id}, legId: ${legId}`);
    return this.nats.send('commerce', 'site.purchases.legs.reject', { id, legId, ...dto });
  }

  // Confirms a sent purchase order of a leg
  confirmLegPurchaseOrder(id: string, legId: string, purchaseOrderId: string): Promise<SuccessResponseDto> {
    this.logger.log(
      `site.purchases.legs.confirmPurchaseOrder — id: ${id}, legId: ${legId}, purchaseOrderId: ${purchaseOrderId}`,
    );
    return this.nats.send('commerce', 'site.purchases.legs.confirmPurchaseOrder', { id, legId, purchaseOrderId });
  }

  // Closes a supplier's leg, marking its open purchase orders delivery completed
  closeSupplier(id: string, legId: string, dto: CloseSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.legs.closeSupplier — id: ${id}, legId: ${legId}`);
    return this.nats.send('commerce', 'site.purchases.legs.closeSupplier', { id, legId, ...dto });
  }
  // Cancels a leg nothing is received or invoiced on, returning its quantity to sourcing or dropping it
  cancelSupplier(id: string, legId: string, dto: CancelSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.legs.cancelSupplier — id: ${id}, legId: ${legId}`);
    return this.nats.send('commerce', 'site.purchases.legs.cancelSupplier', { id, legId, ...dto });
  }

  // Posts a draft Receive with Invoice's goods receipts and its supplier invoice
  postReceiveWithInvoice(invoiceId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.receiveWithInvoices.post — invoiceId: ${invoiceId}`);
    return this.nats.send('commerce', 'site.purchases.receiveWithInvoices.post', { invoiceId });
  }

  // Returns one purchase, its site named
  async findById(id: string, orgId: string): Promise<PurchaseDetailResponseDto> {
    this.logger.log(`site.purchases.findById — id: ${id}`);
    const purchase = await this.nats.send<UnnamedPurchase>('commerce', 'site.purchases.findById', { id });
    return this.purchaseNames.withSiteName(orgId, purchase);
  }

  // Returns a Receive with Invoice with its lines, purchases, receipts and holds
  findReceiveWithInvoiceById(invoiceId: string): Promise<ReceiveWithInvoiceDetailResponseDto> {
    this.logger.log(`site.purchases.receiveWithInvoices.findById — invoiceId: ${invoiceId}`);
    return this.nats.send('commerce', 'site.purchases.receiveWithInvoices.findById', { invoiceId });
  }
  // Returns one purchase item as its own page shows it
  findItemById(id: string, itemId: string): Promise<PurchaseItemViewResponseDto> {
    this.logger.log(`site.purchases.items.findById — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.purchases.items.findById', { id, itemId });
  }

  // Returns one supplier leg of a purchase with its approvers and rejecting user named
  async findSupplierById(id: string, legId: string, orgId: string): Promise<PurchaseLegResponseDto> {
    this.logger.log(`site.purchases.suppliers.findById — id: ${id}, legId: ${legId}`);
    const leg = await this.nats.send<UnnamedPurchaseLeg>('commerce', 'site.purchases.suppliers.findById', {
      id,
      legId,
    });
    const [named] = await this.purchaseNames.withLegNames(orgId, [leg]);
    return named;
  }

  // Returns the site's purchases for the data table with their site named
  async findForTable(userId: string, orgId: string): Promise<PurchaseTableResponseDto> {
    this.logger.log('site.purchases.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-site-purchases');
    const { result, count } = await this.nats.send<{
      result: Omit<PurchaseTableRowResponseDto, 'siteName' | 'siteCode'>[];
      count: number;
    }>('commerce', 'site.purchases.table', state);
    return { result: await this.ownerNames.withSiteNames(orgId, result), count, state, activeViewId };
  }
  // Returns one page of a purchase's items with how far each has got, with server-stored table state
  async findItemsTable(id: string, userId: string): Promise<PurchaseItemTableResponseDto> {
    this.logger.log(`site.purchases.items.table — id: ${id}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-purchase-${id}-items`,
    );
    const { result, count } = await this.nats.send<Omit<PurchaseItemTableResponseDto, 'state' | 'activeViewId'>>(
      'commerce',
      'site.purchases.items.table',
      { id, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns one page of a purchase's items with the quotation lines quoting each, with server-stored table state
  async findItemComparisonTable(id: string, userId: string): Promise<PurchaseItemComparisonTableResponseDto> {
    this.logger.log(`site.purchases.items.findComparison — id: ${id}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-purchase-${id}-comparison`,
    );
    const { result, count } = await this.nats.send<
      Omit<PurchaseItemComparisonTableResponseDto, 'state' | 'activeViewId'>
    >('commerce', 'site.purchases.items.findComparison', { id, ...state });
    return { result, count, state, activeViewId };
  }
  // Returns one page of a purchase item's allocations, with server-stored table state
  async findItemAllocationsTable(
    id: string,
    itemId: string,
    userId: string,
  ): Promise<PurchaseItemAllocationTableResponseDto> {
    this.logger.log(`site.purchases.items.allocations.table — id: ${id}, itemId: ${itemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-purchase-${id}-item-${itemId}-allocations`,
    );
    const { result, count } = await this.nats.send<
      Omit<PurchaseItemAllocationTableResponseDto, 'state' | 'activeViewId'>
    >('commerce', 'site.purchases.items.allocations.table', { id, itemId, ...state });
    return { result, count, state, activeViewId };
  }

  // Returns one page of the quotation lines quoting a purchase item, the cheapest marked, with server-stored table state
  async findItemQuotesTable(id: string, itemId: string, userId: string): Promise<PurchaseItemQuoteTableResponseDto> {
    this.logger.log(`site.purchases.items.quotes.table — id: ${id}, itemId: ${itemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-purchase-${id}-item-${itemId}-quotes`,
    );
    const { result, count } = await this.nats.send<Omit<PurchaseItemQuoteTableResponseDto, 'state' | 'activeViewId'>>(
      'commerce',
      'site.purchases.items.quotes.table',
      { id, itemId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns one page of the document lines that move a purchase item, with server-stored table state
  async findItemDocumentsTable(
    id: string,
    itemId: string,
    userId: string,
  ): Promise<PurchaseItemDocumentTableResponseDto> {
    this.logger.log(`site.purchases.items.documents.table — id: ${id}, itemId: ${itemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-purchase-${id}-item-${itemId}-documents`,
    );
    const { result, count } = await this.nats.send<
      Omit<PurchaseItemDocumentTableResponseDto, 'state' | 'activeViewId'>
    >('commerce', 'site.purchases.items.documents.table', { id, itemId, ...state });
    return { result, count, state, activeViewId };
  }

  // Returns one page of a purchase's supplier legs, approvers and rejecting user named, with server-stored table state
  async findSuppliersTable(id: string, userId: string, orgId: string): Promise<PurchaseLegTableResponseDto> {
    this.logger.log(`site.purchases.suppliers.table — id: ${id}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-purchase-${id}-suppliers`,
    );
    const { result, count } = await this.nats.send<{ result: UnnamedPurchaseLeg[]; count: number }>(
      'commerce',
      'site.purchases.suppliers.table',
      { id, ...state },
    );
    return { result: await this.purchaseNames.withLegNames(orgId, result), count, state, activeViewId };
  }

  // Returns one page of the quotations linked to a purchase, each owner named, with server-stored table state
  async findQuotationsTable(id: string, userId: string, orgId: string): Promise<PurchaseQuotationTableResponseDto> {
    this.logger.log(`site.purchases.quotations.table — id: ${id}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-purchase-${id}-quotations`,
    );
    const { result, count } = await this.nats.send<{
      result: Omit<PurchaseQuotationResponseDto, 'ownerName'>[];
      count: number;
    }>('commerce', 'site.purchases.quotations.table', { id, ...state });
    return { result: await this.ownerNames.resolve(orgId, result), count, state, activeViewId };
  }

  // Counts a purchase's item lines, suppliers and requested quotations
  findCounts(id: string): Promise<PurchaseCountsResponseDto> {
    this.logger.log(`site.purchases.findCounts — id: ${id}`);
    return this.nats.send('commerce', 'site.purchases.findCounts', { id });
  }

  // Returns how far a purchase's items have got and where it stands as a whole
  findProgress(id: string): Promise<PurchaseProgressSummaryResponseDto> {
    this.logger.log(`site.purchases.findProgress — id: ${id}`);
    return this.nats.send('commerce', 'site.purchases.findProgress', { id });
  }

  // Returns the actions a purchase offers and why the others are blocked
  findActions(id: string): Promise<PurchaseActionsResponseDto> {
    this.logger.log(`site.purchases.findActions — id: ${id}`);
    return this.nats.send('commerce', 'site.purchases.findActions', { id });
  }

  // Counts a purchase's items in each bucket of the items table
  findItemFacets(id: string): Promise<PurchaseItemFacetsResponseDto> {
    this.logger.log(`site.purchases.items.findFacets — id: ${id}`);
    return this.nats.send('commerce', 'site.purchases.items.findFacets', { id });
  }
  // Counts what a purchase item's page lists
  findItemCounts(id: string, itemId: string): Promise<PurchaseItemCountsResponseDto> {
    this.logger.log(`site.purchases.items.findCounts — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.purchases.items.findCounts', { id, itemId });
  }

  // Returns how far a purchase item has got, in all and per supplier
  findItemProgress(id: string, itemId: string): Promise<PurchaseItemProgressResponseDto> {
    this.logger.log(`site.purchases.items.findProgress — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.purchases.items.findProgress', { id, itemId });
  }

  // Returns a purchase item's stock at the purchase's site, or null while the site does not carry it
  findItemSiteStock(id: string, itemId: string): Promise<PurchaseItemSiteStockResponseDto | null> {
    this.logger.log(`site.purchases.items.findSiteStock — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.purchases.items.findSiteStock', { id, itemId });
  }

  // Counts a purchase's supplier legs and their lines by step and status
  findSupplierCounts(id: string): Promise<PurchaseLegCountResponseDto[]> {
    this.logger.log(`site.purchases.suppliers.findCounts — id: ${id}`);
    return this.nats.send('commerce', 'site.purchases.suppliers.findCounts', { id });
  }

  // Returns the documents of every supplier leg of a purchase
  findDocuments(id: string): Promise<PurchaseSupplierDocumentsResponseDto[]> {
    this.logger.log(`site.purchases.suppliers.findDocuments — id: ${id}`);
    return this.nats.send('commerce', 'site.purchases.suppliers.findDocuments', { id });
  }

  // Returns the supplier's allocations still open to receive and invoice at once
  findReceiveWithInvoiceOpenLines(
    query: ReceiveWithInvoiceOpenLinesQueryDto,
  ): Promise<ReceiveWithInvoiceOpenLineResponseDto[]> {
    this.logger.log(`site.purchases.receiveWithInvoices.openLines — supplierId: ${query.supplierId}`);
    return this.nats.send('commerce', 'site.purchases.receiveWithInvoices.openLines', query);
  }

  // Returns the purchasing rules the legal entity set for the session site
  findSettings(): Promise<PurchaseSettingsResponseDto> {
    this.logger.log('site.purchases.settings.findForSite');
    return this.nats.send('commerce', 'site.purchases.settings.findForSite', {});
  }

  // Deletes a purchase that is still open and Requesting with nothing beyond items
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.purchases.delete', { id });
  }

  // Removes an item
  deleteItem(id: string, itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.items.delete — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.purchases.items.delete', { id, itemId });
  }

  // Removes an allocation, closing its leg when it was the last one
  deleteAllocation(id: string, allocationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.allocations.delete — id: ${id}, allocationId: ${allocationId}`);
    return this.nats.send('commerce', 'site.purchases.allocations.delete', { id, allocationId });
  }

  // Discards a draft Receive with Invoice and the documents it drafted
  discardReceiveWithInvoice(invoiceId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.receiveWithInvoices.discard — invoiceId: ${invoiceId}`);
    return this.nats.send('commerce', 'site.purchases.receiveWithInvoices.discard', { invoiceId });
  }
}

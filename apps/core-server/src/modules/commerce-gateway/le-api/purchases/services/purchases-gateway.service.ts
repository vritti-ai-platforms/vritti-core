import type { CancelPurchaseDto } from '@commerce/purchases/dto/request/cancel-purchase.dto';
import type { CloseSupplierDto } from '@commerce/purchases/dto/request/close-supplier.dto';
import type { CreateLegGoodsReceiptDto } from '@commerce/purchases/dto/request/create-leg-goods-receipt.dto';
import type { CreateLegInboundDeliveryDto } from '@commerce/purchases/dto/request/create-leg-inbound-delivery.dto';
import type { CreateLegPurchaseOrderDto } from '@commerce/purchases/dto/request/create-leg-purchase-order.dto';
import type { CreatePurchaseAllocationDto } from '@commerce/purchases/dto/request/create-purchase-allocation.dto';
import type { CreatePurchaseAllocationsFromQuotationDto } from '@commerce/purchases/dto/request/create-purchase-allocations-from-quotation.dto';
import type { CreatePurchaseItemDto } from '@commerce/purchases/dto/request/create-purchase-item.dto';
import type { LeCreatePurchaseDto } from '@commerce/purchases/dto/request/le-create-purchase.dto';
import type { LeCreatePurchaseSupplierInvoiceDto } from '@commerce/purchases/dto/request/le-create-purchase-supplier-invoice.dto';
import type { LeCreateReceiveWithInvoiceDto } from '@commerce/purchases/dto/request/le-create-receive-with-invoice.dto';
import type { LeReceiveWithInvoiceDto } from '@commerce/purchases/dto/request/le-receive-with-invoice.dto';
import type { ReceiveWithInvoiceOpenLinesQueryDto } from '@commerce/purchases/dto/request/receive-with-invoice-open-lines-query.dto';
import type { RejectPurchaseLegDto } from '@commerce/purchases/dto/request/reject-purchase-leg.dto';
import type { RequestPurchaseQuotationDto } from '@commerce/purchases/dto/request/request-purchase-quotation.dto';
import type { UpdatePurchaseDto } from '@commerce/purchases/dto/request/update-purchase.dto';
import type { UpdatePurchaseAllocationDto } from '@commerce/purchases/dto/request/update-purchase-allocation.dto';
import type { UpdatePurchaseItemDto } from '@commerce/purchases/dto/request/update-purchase-item.dto';
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
import type { PurchaseTableRowResponseDto } from '@commerce/purchases/dto/response/purchase-table-row-response.dto';
import type { ReceiveWithInvoiceDetailResponseDto } from '@commerce/purchases/dto/response/receive-with-invoice-detail-response.dto';
import type { ReceiveWithInvoiceOpenLineResponseDto } from '@commerce/purchases/dto/response/receive-with-invoice-open-line-response.dto';
import type { RequestedPurchaseQuotationResponseDto } from '@commerce/purchases/dto/response/requested-purchase-quotation-response.dto';
import {
  PurchaseNamesService,
  type UnnamedPurchaseHeader,
  type UnnamedPurchaseLeg,
} from '@commerce/purchases/services/purchase-names.service';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class LePurchasesGatewayService {
  private readonly logger = new Logger(LePurchasesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly ownerNames: OwnerNameService,
    private readonly purchaseNames: PurchaseNamesService,
  ) {}

  // Creates a purchase at one of the legal entity's sites
  create(dto: LeCreatePurchaseDto): Promise<CreateResponseDto<PurchaseResponseDto>> {
    this.logger.log(`le.purchases.create — site: ${dto.siteId}`);
    return this.nats.send('commerce', 'le.purchases.create', dto);
  }

  // Adds an item, or adds the quantity to the item already on the purchase
  createItem(id: string, dto: CreatePurchaseItemDto): Promise<CreateResponseDto<PurchaseItemResponseDto>> {
    this.logger.log(`le.purchases.items.create — id: ${id}, inventoryItemId: ${dto.inventoryItemId}`);
    return this.nats.send('commerce', 'le.purchases.items.create', { id, ...dto });
  }

  // Creates a draft legal-entity quotation from a supplier for the purchase's items
  requestQuotation(
    id: string,
    dto: RequestPurchaseQuotationDto,
  ): Promise<CreateResponseDto<RequestedPurchaseQuotationResponseDto>> {
    this.logger.log(`le.purchases.quotations.request — id: ${id}, supplierId: ${dto.supplierId}`);
    return this.nats.send('commerce', 'le.purchases.quotations.request', { id, ...dto });
  }

  // Allocates part of an item to a supplier, opening its leg on the first allocation
  createAllocation(
    id: string,
    dto: CreatePurchaseAllocationDto,
  ): Promise<CreateResponseDto<PurchaseAllocationResponseDto>> {
    this.logger.log(
      `le.purchases.allocations.create — id: ${id}, purchaseItemId: ${dto.purchaseItemId}, supplierId: ${dto.supplierId}`,
    );
    return this.nats.send('commerce', 'le.purchases.allocations.create', { id, ...dto });
  }

  // Allocates items from posted quotation lines
  createAllocationsFromQuotation(
    id: string,
    dto: CreatePurchaseAllocationsFromQuotationDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.purchases.allocations.createFromQuotation — id: ${id}, lines: ${dto.supplierQuotationItemIds.length}`,
    );
    return this.nats.send('commerce', 'le.purchases.allocations.createFromQuotation', { id, ...dto });
  }

  // Creates a leg's purchase orders, one per currency of its allocations, converted against the legal entity's currency
  createLegPurchaseOrder(
    id: string,
    legId: string,
    dto: CreateLegPurchaseOrderDto,
  ): Promise<CreateResponseDto<CreatedLegPurchaseOrdersResponseDto>> {
    this.logger.log(`le.purchases.legs.createPurchaseOrder — id: ${id}, legId: ${legId}, orderDate: ${dto.orderDate}`);
    return this.nats.send('commerce', 'le.purchases.legs.createPurchaseOrder', { id, legId, ...dto });
  }

  // Creates an inbound delivery of a leg's confirmed purchase order lines
  createLegInboundDelivery(
    id: string,
    legId: string,
    dto: CreateLegInboundDeliveryDto,
  ): Promise<CreateResponseDto<CreatedLegInboundDeliveryResponseDto>> {
    this.logger.log(`le.purchases.legs.createInboundDelivery — id: ${id}, legId: ${legId}, lines: ${dto.lines.length}`);
    return this.nats.send('commerce', 'le.purchases.legs.createInboundDelivery', { id, legId, ...dto });
  }

  // Creates a draft goods receipt of a leg, from one of its inbound deliveries or its open lines
  createLegGoodsReceipt(
    id: string,
    legId: string,
    dto: CreateLegGoodsReceiptDto,
  ): Promise<CreateResponseDto<CreatedLegGoodsReceiptResponseDto>> {
    this.logger.log(
      `le.purchases.legs.createGoodsReceipt — id: ${id}, legId: ${legId}, inboundDeliveryId: ${dto.inboundDeliveryId ?? 'none'}`,
    );
    return this.nats.send('commerce', 'le.purchases.legs.createGoodsReceipt', { id, legId, ...dto });
  }

  // Drafts a supplier invoice for the received, uninvoiced goods of the supplier's open legs at one of the legal
  // entity's sites
  createSupplierInvoice(
    dto: LeCreatePurchaseSupplierInvoiceDto,
  ): Promise<CreateResponseDto<CreatedPurchaseSupplierInvoiceResponseDto>> {
    this.logger.log(
      `le.purchases.supplierInvoices.create — site: ${dto.siteId}, supplierId: ${dto.supplierId}, invoice: ${dto.invoiceNumber}`,
    );
    return this.nats.send('commerce', 'le.purchases.supplierInvoices.create', dto);
  }

  // Drafts a Receive with Invoice at one of the legal entity's sites: the inbound deliveries, goods receipts and supplier invoice it records
  createReceiveWithInvoice(
    dto: LeCreateReceiveWithInvoiceDto,
  ): Promise<CreateResponseDto<CreatedPurchaseSupplierInvoiceResponseDto>> {
    this.logger.log(
      `le.purchases.receiveWithInvoices.create — site: ${dto.siteId}, supplierId: ${dto.supplierId}, invoice: ${dto.invoiceNumber}, lines: ${dto.lines.length}`,
    );
    return this.nats.send('commerce', 'le.purchases.receiveWithInvoices.create', dto);
  }

  // Changes a purchase's header while it is Requesting
  update(id: string, dto: UpdatePurchaseDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.update — id: ${id}`);
    return this.nats.send('commerce', 'le.purchases.update', { id, ...dto });
  }

  // Changes an item
  updateItem(id: string, itemId: string, dto: UpdatePurchaseItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.items.update — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'le.purchases.items.update', { id, itemId, ...dto });
  }

  // Changes an allocation
  updateAllocation(id: string, allocationId: string, dto: UpdatePurchaseAllocationDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.allocations.update — id: ${id}, allocationId: ${allocationId}`);
    return this.nats.send('commerce', 'le.purchases.allocations.update', { id, allocationId, ...dto });
  }

  // Replaces a draft Receive with Invoice, at the site it was drafted for
  updateReceiveWithInvoice(invoiceId: string, dto: LeReceiveWithInvoiceDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.receiveWithInvoices.update — invoiceId: ${invoiceId}, lines: ${dto.lines.length}`);
    return this.nats.send('commerce', 'le.purchases.receiveWithInvoices.update', { invoiceId, ...dto });
  }

  // Cancels a purchase with a reason
  cancel(id: string, dto: CancelPurchaseDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.cancel — id: ${id}`);
    return this.nats.send('commerce', 'le.purchases.cancel', { id, ...dto });
  }

  // Submits the items, moving the purchase to Quoting or Sourcing
  submitItems(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.submitItems — id: ${id}`);
    return this.nats.send('commerce', 'le.purchases.submitItems', { id });
  }

  // Completes quotations, moving the purchase to sourcing
  completeQuotations(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.quotations.complete — id: ${id}`);
    return this.nats.send('commerce', 'le.purchases.quotations.complete', { id });
  }

  // Starts every leg still in sourcing, routing each to approval against the legal entity's currency
  submit(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.submit — id: ${id}`);
    return this.nats.send('commerce', 'le.purchases.submit', { id });
  }

  // Submits one supplier's leg still in sourcing, routing it to approval against the legal entity's currency
  submitSupplier(id: string, legId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.legs.submitSupplier — id: ${id}, legId: ${legId}`);
    return this.nats.send('commerce', 'le.purchases.legs.submitSupplier', { id, legId });
  }

  // Approves a leg waiting for approval
  approveLeg(id: string, legId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.legs.approve — id: ${id}, legId: ${legId}`);
    return this.nats.send('commerce', 'le.purchases.legs.approve', { id, legId });
  }

  // Rejects a leg waiting for approval, returning only that leg to sourcing
  rejectLeg(id: string, legId: string, dto: RejectPurchaseLegDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.legs.reject — id: ${id}, legId: ${legId}`);
    return this.nats.send('commerce', 'le.purchases.legs.reject', { id, legId, ...dto });
  }

  // Confirms a sent purchase order of a leg
  confirmLegPurchaseOrder(id: string, legId: string, purchaseOrderId: string): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.purchases.legs.confirmPurchaseOrder — id: ${id}, legId: ${legId}, purchaseOrderId: ${purchaseOrderId}`,
    );
    return this.nats.send('commerce', 'le.purchases.legs.confirmPurchaseOrder', { id, legId, purchaseOrderId });
  }

  // Closes a supplier's leg, marking its open purchase orders delivery completed
  closeSupplier(id: string, legId: string, dto: CloseSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.legs.closeSupplier — id: ${id}, legId: ${legId}`);
    return this.nats.send('commerce', 'le.purchases.legs.closeSupplier', { id, legId, ...dto });
  }

  // Posts a draft Receive with Invoice's goods receipts and its supplier invoice in the legal entity's currency
  postReceiveWithInvoice(invoiceId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.receiveWithInvoices.post — invoiceId: ${invoiceId}`);
    return this.nats.send('commerce', 'le.purchases.receiveWithInvoices.post', { invoiceId });
  }

  // Returns a purchase's header with its counts, progress and available actions, its site named
  async findById(id: string, orgId: string): Promise<PurchaseHeaderResponseDto> {
    this.logger.log(`le.purchases.findById — id: ${id}`);
    const header = await this.nats.send<UnnamedPurchaseHeader>('commerce', 'le.purchases.findById', { id });
    return this.purchaseNames.withHeaderNames(orgId, header);
  }

  // Returns a Receive with Invoice with its lines, purchases, receipts and holds
  findReceiveWithInvoiceById(invoiceId: string): Promise<ReceiveWithInvoiceDetailResponseDto> {
    this.logger.log(`le.purchases.receiveWithInvoices.findById — invoiceId: ${invoiceId}`);
    return this.nats.send('commerce', 'le.purchases.receiveWithInvoices.findById', { invoiceId });
  }

  // Returns the purchases of the legal entity's site chosen in the context bar, with their site named
  async findForTable(userId: string, orgId: string): Promise<PurchaseTableResponseDto> {
    this.logger.log('le.purchases.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-le-purchases');
    const { result, count } = await this.nats.send<{
      result: Omit<PurchaseTableRowResponseDto, 'siteName' | 'siteCode'>[];
      count: number;
    }>('commerce', 'le.purchases.table', state);
    return { result: await this.ownerNames.withSiteNames(orgId, result), count, state, activeViewId };
  }

  // Returns a purchase's items
  findItems(id: string): Promise<PurchaseItemResponseDto[]> {
    this.logger.log(`le.purchases.items.findByPurchase — id: ${id}`);
    return this.nats.send('commerce', 'le.purchases.items.findByPurchase', { id });
  }

  // Returns the quotations linked to a purchase, read in the legal entity's context
  async findQuotations(id: string, orgId: string): Promise<PurchaseQuotationResponseDto[]> {
    this.logger.log(`le.purchases.quotations.findByPurchase — id: ${id}`);
    const quotations = await this.nats.send<Omit<PurchaseQuotationResponseDto, 'ownerName'>[]>(
      'commerce',
      'le.purchases.quotations.findByPurchase',
      { id },
    );
    return this.ownerNames.resolve(orgId, quotations);
  }

  // Returns a purchase's items with their allocations across every leg
  findSourcingItems(id: string): Promise<PurchaseSourcingItemResponseDto[]> {
    this.logger.log(`le.purchases.sourcing.items — id: ${id}`);
    return this.nats.send('commerce', 'le.purchases.sourcing.items', { id });
  }

  // Returns a purchase's supplier legs with their approvers and rejecting user named
  async findSuppliers(id: string, orgId: string): Promise<PurchaseLegResponseDto[]> {
    this.logger.log(`le.purchases.suppliers.findByPurchase — id: ${id}`);
    const legs = await this.nats.send<UnnamedPurchaseLeg[]>('commerce', 'le.purchases.suppliers.findByPurchase', {
      id,
    });
    return this.purchaseNames.withLegNames(orgId, legs);
  }

  // Returns the supplier's allocations still open to receive and invoice at once at one of the legal entity's sites
  findReceiveWithInvoiceOpenLines(
    siteId: string,
    query: ReceiveWithInvoiceOpenLinesQueryDto,
  ): Promise<ReceiveWithInvoiceOpenLineResponseDto[]> {
    this.logger.log(`le.purchases.receiveWithInvoices.openLines — site: ${siteId}, supplierId: ${query.supplierId}`);
    return this.nats.send('commerce', 'le.purchases.receiveWithInvoices.openLines', { ...query, siteId });
  }

  // Deletes a purchase that is still open and Requesting with nothing beyond items
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.delete — id: ${id}`);
    return this.nats.send('commerce', 'le.purchases.delete', { id });
  }

  // Removes an item
  deleteItem(id: string, itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.items.delete — id: ${id}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'le.purchases.items.delete', { id, itemId });
  }

  // Removes an allocation, closing its leg when it was the last one
  deleteAllocation(id: string, allocationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.allocations.delete — id: ${id}, allocationId: ${allocationId}`);
    return this.nats.send('commerce', 'le.purchases.allocations.delete', { id, allocationId });
  }

  // Discards a draft Receive with Invoice and the documents it drafted
  discardReceiveWithInvoice(invoiceId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.receiveWithInvoices.discard — invoiceId: ${invoiceId}`);
    return this.nats.send('commerce', 'le.purchases.receiveWithInvoices.discard', { invoiceId });
  }
}

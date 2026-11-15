import { CancelPurchaseDto } from '@commerce/purchases/dto/request/cancel-purchase.dto';
import { CloseSupplierDto } from '@commerce/purchases/dto/request/close-supplier.dto';
import { CreateLegGoodsReceiptDto } from '@commerce/purchases/dto/request/create-leg-goods-receipt.dto';
import { CreateLegInboundDeliveryDto } from '@commerce/purchases/dto/request/create-leg-inbound-delivery.dto';
import { CreateLegPurchaseOrderDto } from '@commerce/purchases/dto/request/create-leg-purchase-order.dto';
import { CreatePurchaseAllocationDto } from '@commerce/purchases/dto/request/create-purchase-allocation.dto';
import { CreatePurchaseAllocationsFromQuotationDto } from '@commerce/purchases/dto/request/create-purchase-allocations-from-quotation.dto';
import { CreatePurchaseItemDto } from '@commerce/purchases/dto/request/create-purchase-item.dto';
import { LeCreatePurchaseDto } from '@commerce/purchases/dto/request/le-create-purchase.dto';
import { LeCreatePurchaseSupplierInvoiceDto } from '@commerce/purchases/dto/request/le-create-purchase-supplier-invoice.dto';
import { LeCreateReceiveWithInvoiceDto } from '@commerce/purchases/dto/request/le-create-receive-with-invoice.dto';
import { LeReceiveWithInvoiceDto } from '@commerce/purchases/dto/request/le-receive-with-invoice.dto';
import { RejectPurchaseLegDto } from '@commerce/purchases/dto/request/reject-purchase-leg.dto';
import { RequestPurchaseQuotationDto } from '@commerce/purchases/dto/request/request-purchase-quotation.dto';
import { UpdatePurchaseDto } from '@commerce/purchases/dto/request/update-purchase.dto';
import { UpdatePurchaseAllocationDto } from '@commerce/purchases/dto/request/update-purchase-allocation.dto';
import { UpdatePurchaseItemDto } from '@commerce/purchases/dto/request/update-purchase-item.dto';
import { CreatedLegGoodsReceiptResponseDto } from '@commerce/purchases/dto/response/created-leg-goods-receipt-response.dto';
import { CreatedLegInboundDeliveryResponseDto } from '@commerce/purchases/dto/response/created-leg-inbound-delivery-response.dto';
import { CreatedLegPurchaseOrdersResponseDto } from '@commerce/purchases/dto/response/created-leg-purchase-orders-response.dto';
import { CreatedPurchaseSupplierInvoiceResponseDto } from '@commerce/purchases/dto/response/created-purchase-supplier-invoice-response.dto';
import { PurchaseAllocationResponseDto } from '@commerce/purchases/dto/response/purchase-allocation-response.dto';
import { PurchaseHeaderResponseDto } from '@commerce/purchases/dto/response/purchase-header-response.dto';
import { PurchaseItemResponseDto } from '@commerce/purchases/dto/response/purchase-item-response.dto';
import { PurchaseLegResponseDto } from '@commerce/purchases/dto/response/purchase-leg-response.dto';
import { PurchaseQuotationResponseDto } from '@commerce/purchases/dto/response/purchase-quotation-response.dto';
import { PurchaseResponseDto } from '@commerce/purchases/dto/response/purchase-response.dto';
import { PurchaseSourcingItemResponseDto } from '@commerce/purchases/dto/response/purchase-sourcing-item-response.dto';
import { PurchaseTableResponseDto } from '@commerce/purchases/dto/response/purchase-table-response.dto';
import { ReceiveWithInvoiceDetailResponseDto } from '@commerce/purchases/dto/response/receive-with-invoice-detail-response.dto';
import { ReceiveWithInvoiceOpenLineResponseDto } from '@commerce/purchases/dto/response/receive-with-invoice-open-line-response.dto';
import { RequestedPurchaseQuotationResponseDto } from '@commerce/purchases/dto/response/requested-purchase-quotation-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';

export function ApiGetTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List purchases',
      description:
        "Returns a page of the purchases of the legal entity's site chosen in the context bar, with their legs, using the user's saved table state.",
    }),
    ApiResponse({ status: 200, description: 'Purchases retrieved.', type: PurchaseTableResponseDto }),
  );
}

export function ApiCreate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a purchase',
      description: "Creates a Requesting purchase at one of the legal entity's sites, optionally with its items.",
    }),
    ApiBody({ type: LeCreatePurchaseDto }),
    ApiResponse({ status: 201, description: 'Purchase created.', type: PurchaseResponseDto }),
    ApiResponse({ status: 400, description: "Validation failed, or the site is not one of the legal entity's." }),
    ApiResponse({ status: 404, description: 'Site not found.' }),
  );
}

export function ApiFindById() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a purchase',
      description:
        "Returns the purchase's header: its site, item, quotation and supplier counts, its progress and the purchase-level actions available to the caller.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiResponse({ status: 200, description: 'Purchase retrieved.', type: PurchaseHeaderResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase not found.' }),
  );
}

export function ApiFindItems() {
  return applyDecorators(
    ApiOperation({
      summary: "List a purchase's items",
      description: 'Returns the items requested on the purchase — the Requesting view.',
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiResponse({ status: 200, description: 'Items retrieved.', type: [PurchaseItemResponseDto] }),
    ApiResponse({ status: 404, description: 'Purchase not found.' }),
  );
}

export function ApiFindQuotations() {
  return applyDecorators(
    ApiOperation({
      summary: "List a purchase's quotations",
      description: 'Returns the supplier quotations linked to the purchase with their lines — the Quoting view.',
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiResponse({ status: 200, description: 'Quotations retrieved.', type: [PurchaseQuotationResponseDto] }),
    ApiResponse({ status: 404, description: 'Purchase not found.' }),
  );
}

export function ApiFindSourcingItems() {
  return applyDecorators(
    ApiOperation({
      summary: "List a purchase's items with their allocations",
      description:
        "Returns each item with its allocations across every supplier leg, each naming its supplier, its leg's step and status, and whether it can still change — the Sourcing view's Items tab.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiResponse({ status: 200, description: 'Sourcing items retrieved.', type: [PurchaseSourcingItemResponseDto] }),
    ApiResponse({ status: 404, description: 'Purchase not found.' }),
  );
}

export function ApiFindSuppliers() {
  return applyDecorators(
    ApiOperation({
      summary: "List a purchase's supplier legs",
      description:
        "Returns one leg per supplier with its allocations, documents, progress, approvers, last rejection and the actions available to the caller — the Sourcing view's Suppliers tab and the Procuring view.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiResponse({ status: 200, description: 'Supplier legs retrieved.', type: [PurchaseLegResponseDto] }),
    ApiResponse({ status: 404, description: 'Purchase not found.' }),
  );
}

export function ApiUpdate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a purchase',
      description: "Changes the purchase's header while it is Requesting.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiBody({ type: UpdatePurchaseDto }),
    ApiResponse({ status: 200, description: 'Purchase updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase not found.' }),
    ApiResponse({ status: 409, description: 'The purchase is no longer Requesting.' }),
  );
}

export function ApiCancel() {
  return applyDecorators(
    ApiOperation({ summary: 'Cancel a purchase', description: 'Cancels the purchase with a reason.' }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiBody({ type: CancelPurchaseDto }),
    ApiResponse({ status: 200, description: 'Purchase cancelled.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase not found.' }),
    ApiResponse({ status: 409, description: 'The purchase can no longer be cancelled.' }),
  );
}

export function ApiDelete() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a purchase',
      description:
        'Deletes the purchase and its items. Only possible while the purchase is open and Requesting with no quotations, allocations or suppliers; cancel it otherwise.',
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiResponse({ status: 200, description: 'Purchase deleted.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase not found.' }),
    ApiResponse({
      status: 409,
      description: 'The purchase is no longer Requesting or has quotations, allocations or suppliers.',
    }),
  );
}

export function ApiCreateItem() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add an item',
      description: 'Adds an inventory item to the purchase; an item already on it gets the quantity added.',
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiBody({ type: CreatePurchaseItemDto }),
    ApiResponse({ status: 201, description: 'Item added.', type: PurchaseItemResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase not found.' }),
    ApiResponse({ status: 409, description: 'The purchase is no longer Requesting.' }),
  );
}

export function ApiUpdateItem() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an item', description: "Changes an item's quantity, date or notes." }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiParam({ name: 'itemId', description: 'Purchase item ID' }),
    ApiBody({ type: UpdatePurchaseItemDto }),
    ApiResponse({ status: 200, description: 'Item updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase or item not found.' }),
    ApiResponse({ status: 409, description: 'The purchase is no longer Requesting.' }),
  );
}

export function ApiDeleteItem() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove an item', description: 'Removes an item from the purchase.' }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiParam({ name: 'itemId', description: 'Purchase item ID' }),
    ApiResponse({ status: 200, description: 'Item removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase or item not found.' }),
    ApiResponse({ status: 409, description: 'The purchase is no longer Requesting.' }),
  );
}

export function ApiSubmitItems() {
  return applyDecorators(
    ApiOperation({
      summary: 'Submit the items',
      description: 'Moves the purchase to Quoting when quotations are required, otherwise to Sourcing.',
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiResponse({ status: 200, description: 'Items submitted.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase not found.' }),
    ApiResponse({ status: 409, description: 'The purchase is not Requesting or has no items.' }),
  );
}

export function ApiRequestQuotation() {
  return applyDecorators(
    ApiOperation({
      summary: 'Request a quotation',
      description:
        "Creates a draft legal-entity quotation from the supplier linked to the purchase, one line per item. It is priced and posted in the legal entity's supplier quotations.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiBody({ type: RequestPurchaseQuotationDto }),
    ApiResponse({ status: 201, description: 'Quotation requested.', type: RequestedPurchaseQuotationResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase or supplier not found.' }),
    ApiResponse({ status: 409, description: 'The purchase is not collecting quotations.' }),
  );
}

export function ApiCompleteQuotations() {
  return applyDecorators(
    ApiOperation({
      summary: 'Complete quotations',
      description: 'Moves the purchase to sourcing once enough suppliers have posted a quotation.',
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiResponse({ status: 200, description: 'Quotations completed.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase not found.' }),
    ApiResponse({ status: 409, description: 'Not enough posted quotations, or the purchase is not Quoting.' }),
  );
}

export function ApiCreateAllocation() {
  return applyDecorators(
    ApiOperation({
      summary: 'Allocate an item',
      description: "Sources part of an item from an enrolled supplier; the supplier's first allocation opens its leg.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiBody({ type: CreatePurchaseAllocationDto }),
    ApiResponse({ status: 201, description: 'Allocation created.', type: PurchaseAllocationResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase, item or supplier enrollment not found.' }),
    ApiResponse({ status: 409, description: "The purchase or the supplier's leg is not in sourcing." }),
  );
}

export function ApiCreateAllocationsFromQuotation() {
  return applyDecorators(
    ApiOperation({
      summary: 'Allocate from quotation lines',
      description: "Sources items from posted quotation lines, at the quotation's unit, price and scheme.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiBody({ type: CreatePurchaseAllocationsFromQuotationDto }),
    ApiResponse({ status: 201, description: 'Allocations created.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase or quotation line not found.' }),
    ApiResponse({ status: 409, description: 'The purchase is not in sourcing.' }),
  );
}

export function ApiUpdateAllocation() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update an allocation',
      description: "Changes an allocation's unit, quantity, price or scheme.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiParam({ name: 'allocationId', description: 'Allocation ID' }),
    ApiBody({ type: UpdatePurchaseAllocationDto }),
    ApiResponse({ status: 200, description: 'Allocation updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase or allocation not found.' }),
    ApiResponse({ status: 409, description: "The allocation's leg is not in sourcing." }),
  );
}

export function ApiDeleteAllocation() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove an allocation',
      description: "Removes an allocation; the supplier's leg closes with its last one.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiParam({ name: 'allocationId', description: 'Allocation ID' }),
    ApiResponse({ status: 200, description: 'Allocation removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase or allocation not found.' }),
    ApiResponse({ status: 409, description: "The allocation's leg is not in sourcing." }),
  );
}

export function ApiSubmit() {
  return applyDecorators(
    ApiOperation({
      summary: 'Submit the purchase',
      description: 'Starts every leg still in sourcing — into approval when its enrollment requires it.',
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiResponse({ status: 200, description: 'Purchase submitted.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase not found.' }),
    ApiResponse({ status: 409, description: 'The purchase is not in sourcing or has nothing to submit.' }),
  );
}

export function ApiSubmitSupplier() {
  return applyDecorators(
    ApiOperation({
      summary: 'Submit a supplier',
      description: "Starts one supplier's leg still in sourcing, after a rejection or when it was opened later.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiParam({ name: 'legId', description: 'Leg ID' }),
    ApiResponse({ status: 200, description: 'Supplier submitted.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase or leg not found.' }),
    ApiResponse({ status: 409, description: 'The leg is not in sourcing.' }),
  );
}

export function ApiApproveLeg() {
  return applyDecorators(
    ApiOperation({
      summary: 'Approve a leg',
      description: "Approves a leg waiting for approval; only one of the enrollment's approvers who did not submit it.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiParam({ name: 'legId', description: 'Leg ID' }),
    ApiResponse({ status: 200, description: 'Leg approved.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase or leg not found.' }),
    ApiResponse({ status: 409, description: 'The leg is not waiting for approval, or the caller may not approve it.' }),
  );
}

export function ApiRejectLeg() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reject a leg',
      description: 'Returns only this leg to sourcing with a reason; the other legs carry on.',
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiParam({ name: 'legId', description: 'Leg ID' }),
    ApiBody({ type: RejectPurchaseLegDto }),
    ApiResponse({ status: 200, description: 'Leg rejected.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase or leg not found.' }),
    ApiResponse({ status: 409, description: 'The leg is not waiting for approval, or the caller may not reject it.' }),
  );
}

export function ApiCreateLegPurchaseOrder() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create purchase orders',
      description:
        "Creates and sends one purchase order per currency of the leg's allocations, at their units, prices and schemes, with the payment term of the supplier's enrollment. Each line is expected on the given date, otherwise the order date plus the item's lead time.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiParam({ name: 'legId', description: 'Leg ID' }),
    ApiBody({ type: CreateLegPurchaseOrderDto }),
    ApiResponse({ status: 201, description: 'Purchase orders created.', type: CreatedLegPurchaseOrdersResponseDto }),
    ApiResponse({
      status: 400,
      description: "An exchange rate is missing for a currency of the allocations other than the legal entity's.",
    }),
    ApiResponse({ status: 404, description: 'Purchase or leg not found.' }),
    ApiResponse({
      status: 409,
      description: 'The leg does not order, is not in its purchase order step or already has its purchase orders.',
    }),
  );
}

export function ApiConfirmLegPurchaseOrder() {
  return applyDecorators(
    ApiOperation({
      summary: "Confirm a leg's purchase order",
      description: 'Confirms a sent purchase order of the leg, as confirming it on the purchase order page does.',
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiParam({ name: 'legId', description: 'Leg ID' }),
    ApiParam({ name: 'purchaseOrderId', description: 'Purchase order ID' }),
    ApiResponse({ status: 200, description: 'Purchase order confirmed.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase, leg or purchase order not found.' }),
    ApiResponse({ status: 409, description: 'The purchase order is not a sent order of the leg.' }),
  );
}

export function ApiCreateLegInboundDelivery() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create an inbound delivery',
      description:
        "Creates an announced inbound delivery of the leg's confirmed purchase order lines, each within its open quantity. An announced-type leg needs one before receiving.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiParam({ name: 'legId', description: 'Leg ID' }),
    ApiBody({ type: CreateLegInboundDeliveryDto }),
    ApiResponse({ status: 201, description: 'Inbound delivery created.', type: CreatedLegInboundDeliveryResponseDto }),
    ApiResponse({
      status: 400,
      description: "A line is not one of the leg's confirmed lines or exceeds its open quantity.",
    }),
    ApiResponse({ status: 404, description: 'Purchase or leg not found.' }),
    ApiResponse({ status: 409, description: 'The leg does not order or has nothing confirmed to deliver.' }),
  );
}

export function ApiCreateLegGoodsReceipt() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a goods receipt',
      description:
        "Creates a draft goods receipt of the leg, completed in Goods Receipts: from the given inbound delivery, otherwise from an inbound delivery of the leg's open confirmed lines. A direct-receipt leg is ordered first, confirmed at its allocation prices.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiParam({ name: 'legId', description: 'Leg ID' }),
    ApiBody({ type: CreateLegGoodsReceiptDto }),
    ApiResponse({ status: 201, description: 'Goods receipt created.', type: CreatedLegGoodsReceiptResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'An announced-type leg was received without an inbound delivery, or a direct-receipt allocation has no price.',
    }),
    ApiResponse({ status: 404, description: 'Purchase, leg or delivery not found.' }),
    ApiResponse({
      status: 409,
      description: 'The leg is not receiving, or the delivery is received, cancelled or already has a draft receipt.',
    }),
  );
}

export function ApiCloseSupplier() {
  return applyDecorators(
    ApiOperation({
      summary: 'Close a supplier',
      description:
        "Closes the supplier's leg, marking its open purchase orders delivery completed; the purchase completes when its last leg closes.",
    }),
    ApiParam({ name: 'id', description: 'Purchase ID' }),
    ApiParam({ name: 'legId', description: 'Leg ID' }),
    ApiBody({ type: CloseSupplierDto }),
    ApiResponse({ status: 200, description: 'Supplier closed.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase or leg not found.' }),
    ApiResponse({ status: 409, description: 'The leg is closed or has a draft receipt or draft invoice.' }),
  );
}

export function ApiCreateSupplierInvoice() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a supplier invoice',
      description:
        "Drafts a supplier invoice at one of the legal entity's sites with one line per posted receipt lot of the supplier's open legs still to invoice, at the order line price; only the given purchases when named. It is edited and posted in Supplier Invoices.",
    }),
    ApiBody({ type: LeCreatePurchaseSupplierInvoiceDto }),
    ApiResponse({
      status: 201,
      description: 'Supplier invoice drafted.',
      type: CreatedPurchaseSupplierInvoiceResponseDto,
    }),
    ApiResponse({
      status: 400,
      description:
        "Nothing is left to invoice, or the exchange rate is missing, or the site is not one of the legal entity's.",
    }),
    ApiResponse({ status: 404, description: 'Site not found.' }),
    ApiResponse({ status: 409, description: 'The supplier already has an invoice with this number.' }),
  );
}

export function ApiFindReceiveWithInvoiceOpenLines() {
  return applyDecorators(
    ApiOperation({
      summary: 'List Receive with Invoice open lines',
      description:
        "Returns the supplier's allocations on open Receive with Invoice legs at one of the legal entity's sites still to receive, in the allocation's unit — the Receive with Invoice line picker.",
    }),
    ApiParam({ name: 'siteId', description: "One of the legal entity's sites" }),
    ApiResponse({ status: 200, description: 'Open lines retrieved.', type: [ReceiveWithInvoiceOpenLineResponseDto] }),
    ApiResponse({ status: 400, description: "The site is not one of the legal entity's." }),
    ApiResponse({ status: 404, description: 'Site not found.' }),
  );
}

export function ApiCreateReceiveWithInvoice() {
  return applyDecorators(
    ApiOperation({
      summary: 'Draft a Receive with Invoice',
      description:
        "Enters the supplier's invoice once at one of the legal entity's sites: per purchase it touches, the leg's purchase order when needed, an inbound delivery and a draft goods receipt of the invoiced lines, and one draft invoice naming their lots.",
    }),
    ApiBody({ type: LeCreateReceiveWithInvoiceDto }),
    ApiResponse({
      status: 201,
      description: 'Receive with Invoice drafted.',
      type: CreatedPurchaseSupplierInvoiceResponseDto,
    }),
    ApiResponse({
      status: 400,
      description:
        "A line is not an open allocation of the supplier, exceeds its open quantity or misses its batch, or the exchange rate is missing, or the site is not one of the legal entity's.",
    }),
    ApiResponse({ status: 404, description: 'Site not found.' }),
    ApiResponse({ status: 409, description: 'The supplier already has an invoice with this number.' }),
  );
}

export function ApiFindReceiveWithInvoiceById() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a Receive with Invoice',
      description:
        'Returns the Receive with Invoice with its lines, the purchases and goods receipts it covers and, once posted, its holds.',
    }),
    ApiParam({ name: 'invoiceId', description: 'Supplier invoice ID of the Receive with Invoice' }),
    ApiResponse({
      status: 200,
      description: 'Receive with Invoice retrieved.',
      type: ReceiveWithInvoiceDetailResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Receive with Invoice not found.' }),
  );
}

export function ApiUpdateReceiveWithInvoice() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a Receive with Invoice',
      description: 'Replaces a draft Receive with Invoice and every document it drafted.',
    }),
    ApiParam({ name: 'invoiceId', description: 'Supplier invoice ID of the Receive with Invoice' }),
    ApiBody({ type: LeReceiveWithInvoiceDto }),
    ApiResponse({ status: 200, description: 'Receive with Invoice updated.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'A line is not an open allocation of the supplier, exceeds its open quantity or misses its batch, or the exchange rate is missing.',
    }),
    ApiResponse({ status: 404, description: 'Receive with Invoice not found.' }),
    ApiResponse({
      status: 409,
      description: 'The Receive with Invoice is posted, or the invoice number is already used.',
    }),
  );
}

export function ApiPostReceiveWithInvoice() {
  return applyDecorators(
    ApiOperation({
      summary: 'Post a Receive with Invoice',
      description:
        "Posts the Receive with Invoice's draft goods receipts, landing the stock, then posts its invoice and computes its holds, in one transaction; holds never block posting.",
    }),
    ApiParam({ name: 'invoiceId', description: 'Supplier invoice ID of the Receive with Invoice' }),
    ApiResponse({ status: 200, description: 'Receive with Invoice posted.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Receive with Invoice not found.' }),
    ApiResponse({ status: 409, description: 'The Receive with Invoice is already posted.' }),
  );
}

export function ApiDiscardReceiveWithInvoice() {
  return applyDecorators(
    ApiOperation({
      summary: 'Discard a Receive with Invoice',
      description:
        'Deletes the draft Receive with Invoice, its draft goods receipts and inbound deliveries, and a purchase order it created that nothing else uses.',
    }),
    ApiParam({ name: 'invoiceId', description: 'Supplier invoice ID of the Receive with Invoice' }),
    ApiResponse({ status: 200, description: 'Receive with Invoice discarded.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Receive with Invoice not found.' }),
    ApiResponse({ status: 409, description: 'The Receive with Invoice is posted.' }),
  );
}

import { GoodsReceiptTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-table-response.dto';
import { InboundDeliveryTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-table-response.dto';
import { AddPurchaseOrderItemDto } from '@commerce/purchase-orders/dto/request/add-purchase-order-item.dto';
import { ChangePurchaseOrderExchangeRateDto } from '@commerce/purchase-orders/dto/request/change-purchase-order-exchange-rate.dto';
import { ChangePurchaseOrderSupplierDto } from '@commerce/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import { LeCreatePurchaseOrderDto } from '@commerce/purchase-orders/dto/request/le-create-purchase-order.dto';
import { SendPurchaseOrderEmailDto } from '@commerce/purchase-orders/dto/request/send-purchase-order-email.dto';
import { SetPurchaseOrderConversionRateDto } from '@commerce/purchase-orders/dto/request/set-purchase-order-conversion-rate.dto';
import { UpdatePurchaseOrderItemDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-item.dto';
import { UpdatePurchaseOrderNotesDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-notes.dto';
import { UpdatePurchaseOrderStatusDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-status.dto';
import { UpdatePurchaseOrderTaxDateDto } from '@commerce/purchase-orders/dto/request/update-purchase-order-tax-date.dto';
import { LePurchaseOrderResponseDto } from '@commerce/purchase-orders/dto/response/le-purchase-order-response.dto';
import { LePurchaseOrderTableResponseDto } from '@commerce/purchase-orders/dto/response/le-purchase-order-table-response.dto';
import { PurchaseOrderItemTableResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-item-table-response.dto';
import { PurchaseOrderProblemsResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-problems-response.dto';
import { PurchaseOrderResponseDto } from '@commerce/purchase-orders/dto/response/purchase-order-response.dto';
import { PurchaseOrderInvoiceSummaryResponseDto } from '@commerce/supplier-invoices/dto/response/purchase-order-invoice-summary-response.dto';
import { SupplierInvoiceTableResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';

export function ApiGetTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List purchase orders',
      description:
        "Returns a page of the purchase orders of the legal entity's sites with site names, using the user's saved table state; the sites picked in the table's context bar (`filters.context`) narrow it.",
    }),
    ApiResponse({ status: 200, description: 'Purchase orders retrieved.', type: LePurchaseOrderTableResponseDto }),
  );
}

export function ApiCreate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a purchase order',
      description:
        "Creates a draft purchase order at one of the legal entity's sites in one of the supplier's currencies; the exchange rate into the legal entity's currency is required only when the two differ.",
    }),
    ApiBody({ type: LeCreatePurchaseOrderDto }),
    ApiResponse({ status: 201, description: 'Purchase order created.', type: PurchaseOrderResponseDto }),
    ApiResponse({
      status: 400,
      description: 'The supplier is not purchasable at the site, or does not trade in the currency.',
    }),
    ApiResponse({ status: 404, description: 'Supplier is not enrolled for this site.' }),
    ApiResponse({ status: 422, description: 'The exchange rate is missing for a foreign-currency order.' }),
  );
}

export function ApiDownloadPdf() {
  return applyDecorators(
    ApiOperation({
      summary: 'Download a purchase order PDF',
      description: "Streams the purchase order as an A4 PDF headed with its site's name.",
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiProduces('application/pdf'),
    ApiResponse({ status: 200, description: 'PDF streamed.' }),
    ApiResponse({ status: 404, description: 'Purchase order not found.' }),
  );
}

export function ApiFindById() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a purchase order',
      description: 'Returns the purchase order header with whether a goods receipt of it is posted.',
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiResponse({ status: 200, description: 'Purchase order retrieved.', type: LePurchaseOrderResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase order not found.' }),
  );
}

export function ApiFindItemIds() {
  return applyDecorators(
    ApiOperation({
      summary: 'List the inventory items on a purchase order',
      description: 'Returns the ids of the inventory items the purchase order orders.',
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiResponse({ status: 200, description: 'Inventory item ids retrieved.', type: [String] }),
  );
}

export function ApiFindItemsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List the lines of a purchase order',
      description:
        "Returns a page of the order's lines with their received, rejected, invoiced, returned and cancelled counters and what is open to receive and to invoice, using the user's saved table state.",
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiResponse({
      status: 200,
      description: 'Purchase order lines retrieved.',
      type: PurchaseOrderItemTableResponseDto,
    }),
  );
}

export function ApiFindGoodsReceiptTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List the goods receipts of a purchase order',
      description:
        "Returns a page of the goods receipts counted against the order, using the user's saved table state.",
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiResponse({ status: 200, description: 'Goods receipts retrieved.', type: GoodsReceiptTableResponseDto }),
  );
}

export function ApiFindInboundDeliveryTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List the inbound deliveries of a purchase order',
      description:
        "Returns a page of the inbound deliveries carrying a line of the order, using the user's saved table state.",
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiResponse({ status: 200, description: 'Inbound deliveries retrieved.', type: InboundDeliveryTableResponseDto }),
  );
}

export function ApiFindProblems() {
  return applyDecorators(
    ApiOperation({
      summary: 'List the problems on a purchase order',
      description:
        "Returns the flags raised on the order's goods receipts (over-received, short expiry, rejected) and the open holds on the live supplier invoice lines on it, grouped by order line. Receipt flags are information only; a hold that blocks payment can be released from its invoice.",
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiResponse({ status: 200, description: 'Problems retrieved.', type: PurchaseOrderProblemsResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase order not found.' }),
  );
}

export function ApiAddItem() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a line to a purchase order',
      description:
        "Orders one of the supplier's items set up at the order's site; a price in another of the supplier's currencies is converted at the order's rate for it. The line follows the order's tax date, and its expected delivery defaults to the order date plus the item's lead time at the site.",
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiBody({ type: AddPurchaseOrderItemDto }),
    ApiResponse({ status: 201, description: 'Line added.', type: PurchaseOrderResponseDto }),
    ApiResponse({
      status: 400,
      description:
        "The lines are locked, the item has no stock levels set at the order's site, or the delivery is before the order date.",
    }),
    ApiResponse({
      status: 409,
      description:
        'The item is already ordered in the same unit; or the order belongs to a Purchase, which manages its lines (Belongs to a Purchase).',
    }),
  );
}

export function ApiUpdateItem() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a purchase order line',
      description:
        "Changes the item, quantity, price, scheme, expected delivery or tax date of a line until a goods receipt of the order is posted. The expected delivery is the line's own and stays editable; the tax date is locked once a posted receipt or a posted invoice counts the line.",
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiParam({ name: 'itemId', description: 'Purchase order line ID' }),
    ApiBody({ type: UpdatePurchaseOrderItemDto }),
    ApiResponse({ status: 200, description: 'Line updated.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description:
        "The lines are locked, the item has no stock levels set at the order's site, the delivery is before the order date, or the tax date is locked or both set and followed.",
    }),
    ApiResponse({ status: 404, description: 'Purchase order line not found.' }),
    ApiResponse({
      status: 409,
      description: 'The order belongs to a Purchase, which manages its lines (Belongs to a Purchase).',
    }),
  );
}

export function ApiRemoveItem() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a purchase order line',
      description: 'Removes a line no goods receipt counts goods against.',
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiParam({ name: 'itemId', description: 'Purchase order line ID' }),
    ApiResponse({ status: 200, description: 'Line removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The lines are locked or a goods receipt counts goods against the line.' }),
    ApiResponse({ status: 404, description: 'Purchase order line not found.' }),
    ApiResponse({
      status: 409,
      description: 'The order belongs to a Purchase, which manages its lines (Belongs to a Purchase).',
    }),
  );
}

export function ApiUpdateNotes() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update purchase order notes',
      description: 'Replaces the notes on the purchase order.',
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiBody({ type: UpdatePurchaseOrderNotesDto }),
    ApiResponse({ status: 200, description: 'Notes updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Purchase order not found.' }),
  );
}

export function ApiUpdateTaxDate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change the tax date of a purchase order',
      description:
        'Sets the date tax is determined on while the order is a draft, sent or confirmed and none of its receipts is posted, and moves every line that follows it in the same transaction. Lines with their own tax date keep it.',
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiBody({ type: UpdatePurchaseOrderTaxDateDto }),
    ApiResponse({ status: 200, description: 'Tax date updated.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'The order is past confirmation or has a posted receipt, or a following line is counted by a posted receipt or a posted invoice.',
    }),
    ApiResponse({ status: 404, description: 'Purchase order not found.' }),
  );
}

export function ApiChangeSupplier() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change the supplier of a purchase order',
      description:
        "Moves a draft order without lines to another supplier and to the payment term of its enrollment at the order's site; a currency the new supplier does not trade in becomes its default, with the exchange rate resolved again.",
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiBody({ type: ChangePurchaseOrderSupplierDto }),
    ApiResponse({ status: 200, description: 'Supplier changed.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The order is not a draft, has lines or has a posted goods receipt.' }),
    ApiResponse({ status: 422, description: 'The exchange rate is missing for the new currency.' }),
    ApiResponse({
      status: 409,
      description: 'The order belongs to a Purchase, which sets its supplier and currency (Belongs to a Purchase).',
    }),
  );
}

export function ApiChangeExchangeRate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change the exchange rate of a purchase order',
      description:
        "Changes how much 1 unit of a foreign-currency order's currency is in the legal entity's, until a goods receipt of it is posted.",
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiBody({ type: ChangePurchaseOrderExchangeRateDto }),
    ApiResponse({ status: 200, description: 'Exchange rate changed.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description: "The order is in the legal entity's own currency or a goods receipt of it is posted.",
    }),
    ApiResponse({
      status: 409,
      description: 'The order belongs to a Purchase, which sets its rates (Belongs to a Purchase).',
    }),
  );
}

export function ApiSetConversionRate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Set a conversion rate on a purchase order',
      description:
        "Records how much 1 unit of another of the supplier's currencies is in the order's, converting the lines priced in it again.",
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiBody({ type: SetPurchaseOrderConversionRateDto }),
    ApiResponse({ status: 200, description: 'Conversion rate set.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: "The currency is the order's own or not one of the supplier's." }),
    ApiResponse({
      status: 409,
      description: 'The order belongs to a Purchase, which sets its rates (Belongs to a Purchase).',
    }),
  );
}

export function ApiCompleteDelivery() {
  return applyDecorators(
    ApiOperation({
      summary: 'Mark a purchase order delivery completed',
      description:
        'Marks a confirmed order delivery completed: every line cancels what is still open to receive and the receipt and invoice statuses are recomputed; no further receipts are expected.',
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiResponse({ status: 200, description: 'Purchase order delivery completed.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The order is not confirmed.' }),
  );
}

export function ApiUpdateStatus() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update the status of a purchase order',
      description:
        'Moves the order along its manual workflow: a draft is sent or cancelled, a sent order confirmed or cancelled, a confirmed order cancelled while nothing is received. Delivery completion goes through complete-delivery.',
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiBody({ type: UpdatePurchaseOrderStatusDto }),
    ApiResponse({ status: 200, description: 'Status updated.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description: 'The order cannot move to that status, or it cannot be cancelled once anything is received.',
    }),
  );
}

export function ApiSendEmail() {
  return applyDecorators(
    ApiOperation({
      summary: 'Email a purchase order',
      description: "Emails the order with its PDF to the given address or the supplier's, and marks a draft as sent.",
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiBody({ type: SendPurchaseOrderEmailDto }),
    ApiResponse({ status: 200, description: 'Purchase order emailed.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The draft has no priced lines or there is no recipient address.' }),
  );
}

export function ApiDelete() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a purchase order',
      description: 'Deletes a draft purchase order.',
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiResponse({ status: 200, description: 'Purchase order deleted.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The order is not a draft.' }),
    ApiResponse({ status: 404, description: 'Purchase order not found.' }),
    ApiResponse({ status: 409, description: 'The order belongs to a Purchase (Belongs to a Purchase).' }),
  );
}

export function ApiFindForTablePurchaseOrderInvoices() {
  return applyDecorators(
    ApiOperation({
      summary: 'List the invoices for a purchase order',
      description:
        "Returns a page of the invoices with a line invoicing the order, with their open hold counts, using the user's saved table state.",
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiResponse({ status: 200, description: 'Supplier invoices retrieved.', type: SupplierInvoiceTableResponseDto }),
  );
}

export function ApiFindPurchaseOrderInvoicesSummary() {
  return applyDecorators(
    ApiOperation({
      summary: "Summarize a purchase order's invoices",
      description:
        "Counts the live invoices with a line on the order and the held ones, and the invoiced quantity posted against the order's lines as a share of what is due.",
    }),
    ApiParam({ name: 'id', description: 'Purchase order ID' }),
    ApiResponse({ status: 200, description: 'Summary retrieved.', type: PurchaseOrderInvoiceSummaryResponseDto }),
  );
}

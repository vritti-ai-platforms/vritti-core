import { LeCreateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/le-create-supplier-invoice.dto';
import { ReleaseSupplierInvoiceHoldDto } from '@commerce/supplier-invoices/dto/request/release-supplier-invoice-hold.dto';
import { SupplierInvoiceLineDto } from '@commerce/supplier-invoices/dto/request/supplier-invoice-line.dto';
import { UpdateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/update-supplier-invoice.dto';
import { InvoiceableGoodsReceiptResponseDto } from '@commerce/supplier-invoices/dto/response/invoiceable-goods-receipt-response.dto';
import {
  SupplierInvoiceDetailResponseDto,
  SupplierInvoiceResponseDto,
} from '@commerce/supplier-invoices/dto/response/supplier-invoice-response.dto';
import { SupplierInvoiceTableResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';

export function ApiFindForTableSupplierInvoices() {
  return applyDecorators(
    ApiOperation({
      summary: 'List supplier invoices for the data table',
      description:
        "Returns a page of the legal entity's supplier invoices with the purchase orders their lines invoice and their open hold counts, using the user's saved table state; the sites picked in the table's context bar (`filters.context`) narrow it.",
    }),
    ApiResponse({ status: 200, description: 'Supplier invoices retrieved.', type: SupplierInvoiceTableResponseDto }),
  );
}

export function ApiFindSupplierInvoiceInvoiceableGoodsReceipts() {
  return applyDecorators(
    ApiOperation({
      summary: "List a supplier's receipts still to invoice at a site",
      description:
        "Returns the posted receipt lots (or receipt items without lots) of the supplier's purchase orders at one of the legal entity's sites with primary quantity left to invoice, oldest receipt first — the invoice line picker.",
    }),
    ApiParam({ name: 'siteId', description: "One of the legal entity's sites" }),
    ApiResponse({
      status: 200,
      description: 'Invoiceable goods receipts retrieved.',
      type: [InvoiceableGoodsReceiptResponseDto],
    }),
    ApiResponse({ status: 400, description: "The site is not one of the legal entity's." }),
    ApiResponse({ status: 404, description: 'Site not found.' }),
  );
}

export function ApiFindSupplierInvoiceById() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a supplier invoice',
      description:
        'Returns the invoice with its item and charge lines, the receipt lot each item line invoices and every hold.',
    }),
    ApiParam({ name: 'id', description: 'Supplier invoice ID' }),
    ApiResponse({ status: 200, description: 'Supplier invoice retrieved.', type: SupplierInvoiceDetailResponseDto }),
    ApiResponse({ status: 404, description: 'Supplier invoice not found.' }),
  );
}

export function ApiCreateSupplierInvoice() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a supplier invoice',
      description:
        "Records a draft invoice of a supplier at one of the legal entity's sites. The currency defaults to the supplier's and must be one of its currencies; the rate is 1 in the legal entity's currency and required otherwise. Payment term and due date come from the supplier's enrollment at the site.",
    }),
    ApiBody({ type: LeCreateSupplierInvoiceDto }),
    ApiResponse({ status: 201, description: 'Supplier invoice created.', type: SupplierInvoiceResponseDto }),
    ApiResponse({
      status: 400,
      description:
        "The site is not one of the legal entity's, the currency is not one of the supplier's, or the exchange rate is missing or does not fit it.",
    }),
    ApiResponse({ status: 404, description: 'The site was not found or the supplier is not enrolled at it.' }),
    ApiResponse({ status: 409, description: 'The supplier already has an invoice with this number.' }),
  );
}

export function ApiUpdateSupplierInvoice() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a supplier invoice',
      description:
        'Updates the header of a draft or posted invoice; a new invoice date moves the due date, a posted invoice is re-costed and the holds are recomputed.',
    }),
    ApiParam({ name: 'id', description: 'Supplier invoice ID' }),
    ApiBody({ type: UpdateSupplierInvoiceDto }),
    ApiResponse({ status: 200, description: 'Supplier invoice updated.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'The invoice is cancelled, the exchange rate does not fit its currency, or the tax date changes on a posted invoice.',
    }),
    ApiResponse({
      status: 409,
      description:
        'The supplier already has an invoice with this number; or the invoice is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
  );
}

export function ApiPostSupplierInvoice() {
  return applyDecorators(
    ApiOperation({
      summary: 'Post a supplier invoice',
      description:
        "Posts a draft: sets the final cost of the stock it invoices, spreads its charges as landed cost, recomputes the holds and moves the order lines' invoiced quantities and the orders' invoice status.",
    }),
    ApiParam({ name: 'id', description: 'Supplier invoice ID' }),
    ApiResponse({ status: 200, description: 'Supplier invoice posted.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description:
        "The invoice is not a draft, has no lines, has a rate other than 1 in the legal entity's currency, names a receipt that is not posted, or has charges without item lines.",
    }),
    ApiResponse({
      status: 409,
      description:
        'A lot is invoiced beyond its accepted quantity across live invoices; or the invoice is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
  );
}

export function ApiCancelSupplierInvoice() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cancel a supplier invoice',
      description:
        "Cancels a draft or posted invoice; a posted invoice's costing, landed charges and the order lines' invoiced quantities are reversed.",
    }),
    ApiParam({ name: 'id', description: 'Supplier invoice ID' }),
    ApiResponse({ status: 200, description: 'Supplier invoice cancelled.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The invoice is already cancelled.' }),
  );
}

export function ApiDeleteSupplierInvoice() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a supplier invoice', description: 'Deletes a draft invoice with its lines.' }),
    ApiParam({ name: 'id', description: 'Supplier invoice ID' }),
    ApiResponse({ status: 200, description: 'Supplier invoice deleted.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The invoice is not a draft.' }),
    ApiResponse({
      status: 409,
      description:
        'The invoice is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
  );
}

export function ApiReleaseSupplierInvoiceHold() {
  return applyDecorators(
    ApiOperation({
      summary: 'Release a supplier invoice hold',
      description:
        'Releases an open hold with a reason; it stays released unless its detail changes when the holds are recomputed.',
    }),
    ApiParam({ name: 'id', description: 'Supplier invoice ID' }),
    ApiParam({ name: 'holdId', description: 'Hold ID' }),
    ApiBody({ type: ReleaseSupplierInvoiceHoldDto }),
    ApiResponse({ status: 200, description: 'Hold released.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The hold is not open, or the invoice is cancelled.' }),
    ApiResponse({ status: 404, description: 'Hold not found.' }),
  );
}

export function ApiCreateSupplierInvoiceLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a line to a supplier invoice',
      description:
        "Adds an ITEM line invoicing a posted receipt lot of an order line, or a CHARGE line for a landed cost, and recomputes the holds. On a posted invoice the stock is re-costed and the order's invoiced quantities move in the same transaction.",
    }),
    ApiParam({ name: 'id', description: 'Supplier invoice ID' }),
    ApiBody({ type: SupplierInvoiceLineDto }),
    ApiResponse({ status: 201, description: 'Line added.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'The receipt is not on the order line, not posted, of another supplier, site or currency; the lot is missing or not on the receipt; more is invoiced than received; an amount is in another currency or the discount is too large; or the category is not a charge category.',
    }),
    ApiResponse({ status: 404, description: 'Receipt item or cost category not found.' }),
    ApiResponse({
      status: 409,
      description:
        'The invoice is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
  );
}

export function ApiUpdateSupplierInvoiceLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a supplier invoice line',
      description: 'Replaces the fields of a line with the same checks as adding one and recomputes the holds.',
    }),
    ApiParam({ name: 'id', description: 'Supplier invoice ID' }),
    ApiParam({ name: 'lineId', description: 'Invoice line ID' }),
    ApiBody({ type: SupplierInvoiceLineDto }),
    ApiResponse({ status: 200, description: 'Line updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The line fails one of the checks of adding a line.' }),
    ApiResponse({ status: 404, description: 'Invoice line not found.' }),
    ApiResponse({
      status: 409,
      description:
        'The invoice is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
  );
}

export function ApiDeleteSupplierInvoiceLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a supplier invoice line',
      description: 'Removes a line and recomputes the holds.',
    }),
    ApiParam({ name: 'id', description: 'Supplier invoice ID' }),
    ApiParam({ name: 'lineId', description: 'Invoice line ID' }),
    ApiResponse({ status: 200, description: 'Line removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Invoice line not found.' }),
    ApiResponse({
      status: 409,
      description:
        'The invoice is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
  );
}

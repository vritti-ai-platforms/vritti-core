import { CreateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/create-supplier-invoice.dto';
import { SupplierInvoiceLineDto } from '@commerce/supplier-invoices/dto/request/supplier-invoice-line.dto';
import { UpdateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/update-supplier-invoice.dto';
import {
  SupplierInvoiceDetailResponseDto,
  SupplierInvoiceResponseDto,
} from '@commerce/supplier-invoices/dto/response/supplier-invoice-response.dto';
import { SupplierInvoiceTableResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';

export function ApiFindForTableSiteSupplierInvoices() {
  return applyDecorators(
    ApiOperation({
      summary: "List a supplier's invoices at the site",
      description:
        "Returns a page of the supplier's invoices at the session site with their flag counts, using the user's saved table state.",
    }),
    ApiParam({ name: 'id', description: 'Supplier ID' }),
    ApiResponse({ status: 200, description: 'Supplier invoices retrieved.', type: SupplierInvoiceTableResponseDto }),
  );
}

export function ApiFindSiteSupplierInvoiceById() {
  return applyDecorators(
    ApiOperation({
      summary: "Get one of a supplier's invoices",
      description: 'Returns the invoice with its lines, their match flags and the received stock each line bills.',
    }),
    ApiParam({ name: 'id', description: 'Supplier ID' }),
    ApiParam({ name: 'invoiceId', description: 'Supplier invoice ID' }),
    ApiResponse({ status: 200, description: 'Supplier invoice retrieved.', type: SupplierInvoiceDetailResponseDto }),
    ApiResponse({ status: 404, description: 'Supplier invoice not found.' }),
  );
}

export function ApiCreateSiteSupplierInvoice() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a supplier invoice at the site',
      description:
        "Records a draft invoice billing one of the site's confirmed purchase orders; currency and exchange rate come from the order.",
    }),
    ApiParam({ name: 'id', description: 'Supplier ID' }),
    ApiBody({ type: CreateSupplierInvoiceDto }),
    ApiResponse({ status: 201, description: 'Supplier invoice created.', type: SupplierInvoiceResponseDto }),
    ApiResponse({ status: 400, description: 'The purchase order is not confirmed.' }),
    ApiResponse({ status: 409, description: 'The supplier already has an invoice with this number.' }),
  );
}

export function ApiUpdateSiteSupplierInvoice() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a supplier invoice',
      description:
        'Updates the header of a draft or posted invoice; a posted invoice is re-costed and every change rematches.',
    }),
    ApiParam({ name: 'id', description: 'Supplier ID' }),
    ApiParam({ name: 'invoiceId', description: 'Supplier invoice ID' }),
    ApiBody({ type: UpdateSupplierInvoiceDto }),
    ApiResponse({ status: 200, description: 'Supplier invoice updated.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'The invoice is cancelled, the exchange rate does not fit its currency, or the tax date changes on a posted invoice.',
    }),
  );
}

export function ApiPostSiteSupplierInvoice() {
  return applyDecorators(
    ApiOperation({
      summary: 'Post a supplier invoice',
      description: 'Posts a draft with lines and revalues the stock it bills at the final cost.',
    }),
    ApiParam({ name: 'id', description: 'Supplier ID' }),
    ApiParam({ name: 'invoiceId', description: 'Supplier invoice ID' }),
    ApiResponse({ status: 200, description: 'Supplier invoice posted.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The invoice is not a draft, has no lines or needs an exchange rate.' }),
  );
}

export function ApiCreateSiteSupplierInvoiceLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a line to a supplier invoice',
      description: 'Adds a billed line for an order line, links it to the received stock and rematches the invoice.',
    }),
    ApiParam({ name: 'id', description: 'Supplier ID' }),
    ApiParam({ name: 'invoiceId', description: 'Supplier invoice ID' }),
    ApiBody({ type: SupplierInvoiceLineDto }),
    ApiResponse({ status: 201, description: 'Line added.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description: 'The order line is not on the order, or an amount is in another currency.',
    }),
  );
}

export function ApiUpdateSiteSupplierInvoiceLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a supplier invoice line',
      description: 'Replaces the billed fields of a line, relinks it to the received stock and rematches the invoice.',
    }),
    ApiParam({ name: 'id', description: 'Supplier ID' }),
    ApiParam({ name: 'invoiceId', description: 'Supplier invoice ID' }),
    ApiParam({ name: 'lineId', description: 'Invoice line ID' }),
    ApiBody({ type: SupplierInvoiceLineDto }),
    ApiResponse({ status: 200, description: 'Line updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Invoice line not found.' }),
  );
}

export function ApiDeleteSiteSupplierInvoiceLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a supplier invoice line',
      description: 'Removes a line and rematches the invoice.',
    }),
    ApiParam({ name: 'id', description: 'Supplier ID' }),
    ApiParam({ name: 'invoiceId', description: 'Supplier invoice ID' }),
    ApiParam({ name: 'lineId', description: 'Invoice line ID' }),
    ApiResponse({ status: 200, description: 'Line removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Invoice line not found.' }),
  );
}

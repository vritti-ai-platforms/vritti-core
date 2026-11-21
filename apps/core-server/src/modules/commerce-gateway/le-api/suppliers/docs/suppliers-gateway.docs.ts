import { SupplierEnrollmentCountsResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-counts-response.dto';
import { SupplierItemCountsResponseDto } from '@commerce/supplier-items/dto/response/supplier-item-counts-response.dto';
import { SupplierQuotationCountsResponseDto } from '@commerce/supplier-quotations/dto/response/supplier-quotation-counts-response.dto';
import { SupplierCountsResponseDto } from '@commerce/suppliers/dto/response/supplier-counts-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiFindSupplierCounts() {
  return applyDecorators(
    ApiOperation({
      summary: "Count a supplier's items, site enrollments, quotations and people",
      description:
        "One count per list tab of the supplier's detail page, so each tab can show how many rows it lists. The enrollment count is every site of the legal entity, since the Enrollments tab lists each with the supplier's enrollment there or none.",
    }),
    ApiParam({ name: 'id', description: 'Supplier ID' }),
    ApiResponse({ status: 200, type: SupplierCountsResponseDto }),
    ApiResponse({ status: 404, description: 'Supplier not found.' }),
  );
}

export function ApiFindSupplierItemCounts() {
  return applyDecorators(
    ApiOperation({
      summary: "Count a supplier item's sites and prices",
      description:
        "One count per list tab of the supplier item's detail page, so each tab can show how many rows it lists.",
    }),
    ApiParam({ name: 'id', description: 'Supplier ID' }),
    ApiParam({ name: 'itemId', description: 'Supplier item ID' }),
    ApiResponse({ status: 200, type: SupplierItemCountsResponseDto }),
    ApiResponse({ status: 404, description: 'Supplier item not found.' }),
  );
}

export function ApiFindSupplierEnrollmentCounts() {
  return applyDecorators(
    ApiOperation({
      summary: "Count a supplier's items, quotations and invoices at one of the legal entity's sites",
      description:
        "One count per list tab of the supplier's enrollment page, enrolled or not: the items the site lists and the quotations posted to it.",
    }),
    ApiParam({ name: 'id', description: 'Supplier ID' }),
    ApiParam({ name: 'siteId', description: 'Site ID' }),
    ApiResponse({ status: 200, type: SupplierEnrollmentCountsResponseDto }),
    ApiResponse({ status: 404, description: 'Supplier not found.' }),
  );
}

export function ApiFindSupplierQuotationCounts() {
  return applyDecorators(
    ApiOperation({
      summary: "Count a quotation's lines and the sites it is posted to",
      description: "One count per list tab of the quotation's page, so each tab can show how many rows it lists.",
    }),
    ApiParam({ name: 'id', description: 'Supplier ID' }),
    ApiParam({ name: 'quotationId', description: 'Supplier quotation ID' }),
    ApiResponse({ status: 200, type: SupplierQuotationCountsResponseDto }),
    ApiResponse({ status: 404, description: 'Quotation not found.' }),
  );
}

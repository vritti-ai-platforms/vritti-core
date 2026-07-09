import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

const BASE_SELECT_QUERIES = [
  ApiQuery({ name: 'search', description: 'Search term to filter by name', required: false }),
  ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false }),
  ApiQuery({ name: 'offset', description: 'Number of results to skip', required: false }),
  ApiQuery({ name: 'values', description: 'Comma-separated IDs to fetch specific options', required: false }),
  ApiQuery({ name: 'excludeIds', description: 'Comma-separated IDs to exclude', required: false }),
];

export function ApiCategoriesSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get category select options',
      description: 'Returns paginated category options for the select component, scoped to the session business unit.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiQuery({
      name: 'role',
      description: 'Category role to list (GROUP or CATEGORY; default CATEGORY)',
      required: false,
    }),
    ApiQuery({ name: 'status', description: 'active | inactive (default active)', required: false }),
    ApiResponse({ status: 200, description: 'Category select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCatalogsSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get catalog select options',
      description: 'Returns paginated catalog options for the select component, scoped to the session business unit.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiResponse({ status: 200, description: 'Catalog select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCostCategoriesSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get cost category select options',
      description: 'Returns paginated cost category options for the select component.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiResponse({ status: 200, description: 'Cost category select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCustomersSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get customer select options',
      description: 'Returns paginated customer options for the select component.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiResponse({ status: 200, description: 'Customer select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiInventoryItemLotsSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get inventory item lot select options',
      description: 'Returns paginated lot options for the select component.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiQuery({ name: 'inventoryItemId', description: 'Filter lots to a specific inventory item', required: false }),
    ApiResponse({ status: 200, description: 'Inventory item lot select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiInventoryItemQuantsSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get inventory item batch select options',
      description: 'Returns paginated batch (quant) options for the select component, scoped to an inventory item.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiQuery({
      name: 'inventoryItemId',
      description: 'Inventory item whose batches populate the select',
      required: true,
    }),
    ApiResponse({ status: 200, description: 'Inventory item batch select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiInventoryItemSerialsSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get inventory item serial select options',
      description: 'Returns paginated serial options for the select component.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiQuery({ name: 'quantId', description: 'Filter serials to a specific inventory quant', required: false }),
    ApiResponse({ status: 200, description: 'Inventory item serial select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiInventoryItemsSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get inventory item select options',
      description: 'Returns paginated inventory item options, optionally excluding those fully linked to a supplier.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiQuery({
      name: 'excludeOnSupplierId',
      description: 'Exclude items that have all UOMs already linked to this supplier',
      required: false,
    }),
    ApiResponse({ status: 200, description: 'Inventory item select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiLocationsSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get storage location select options',
      description: 'Returns paginated storage location options for the select component.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiQuery({
      name: 'locationRoles',
      description: 'Comma-separated location roles to filter options by',
      required: false,
    }),
    ApiQuery({ name: 'inventoryItemId', description: 'Optional inventory item context', required: false }),
    ApiQuery({
      name: 'excludeUsedOnGoodsReceiptItemId',
      description: 'Hide locations already used by lines on this goods receipt item',
      required: false,
    }),
    ApiQuery({
      name: 'goodsReceiptLotId',
      description: 'Lot scope for excludeUsedOnGoodsReceiptItemId',
      required: false,
    }),
    ApiResponse({ status: 200, description: 'Storage location select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiPosTerminalsSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get POS terminal select options',
      description: 'Returns paginated POS terminal options for select dropdowns.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiResponse({ status: 200, description: 'POS terminal select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiPurchaseOrderItemsSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get purchase order line select options',
      description: 'Returns paginated PO line options for the goods receipt AddItem selector.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiQuery({
      name: 'purchaseOrderId',
      description: 'Purchase order whose lines populate the select',
      required: true,
    }),
    ApiQuery({
      name: 'excludeOnGoodsReceiptId',
      description: 'Exclude PO lines whose (inventoryItemId, uomId) is already on this goods receipt',
      required: false,
    }),
    ApiResponse({ status: 200, description: 'Purchase order line select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiPurchaseOrdersSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get purchase order select options',
      description: 'Returns paginated purchase order options for select dropdowns.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiQuery({ name: 'status', description: 'Optional status filter (single or comma-separated)', required: false }),
    ApiQuery({ name: 'supplierId', description: 'Optional supplier filter', required: false }),
    ApiResponse({ status: 200, description: 'Purchase order select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSalesChannelsSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get sales channel select options',
      description: 'Returns paginated sales channel options for the select component.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiResponse({ status: 200, description: 'Sales channel select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSupplierItemsSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get supplier item select options',
      description: 'Returns paginated supplier item options for select/filter components.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiQuery({ name: 'supplierId', description: 'Filter to a specific supplier', required: false }),
    ApiQuery({
      name: 'excludeOnPurchaseOrderId',
      description: 'Exclude supplier items whose (inventoryItemId, uomId) is already on this purchase order',
      required: false,
    }),
    ApiQuery({
      name: 'excludeOnGoodsReceiptId',
      description: 'Exclude supplier items whose (inventoryItemId, uomId) is already on this goods receipt',
      required: false,
    }),
    ApiResponse({ status: 200, description: 'Supplier item select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSuppliersSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get supplier select options',
      description: 'Returns paginated supplier options for select dropdowns.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiResponse({ status: 200, description: 'Supplier select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiTaxGroupsSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'List tax groups as dropdown options',
      description: 'Returns tax groups formatted as select options (id → name), searchable and paginated.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiResponse({ status: 200, description: 'Tax group options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUomSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get UOM select options',
      description: 'Returns paginated UOM options for select dropdowns.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiQuery({
      name: 'derivedOnly',
      description: 'When true, only derived units (non-base) are returned',
      required: false,
    }),
    ApiQuery({ name: 'baseOnly', description: 'When true, only base units are returned', required: false }),
    ApiQuery({ name: 'dimensionId', description: 'Filter to UOMs sharing the given dimension', required: false }),
    ApiQuery({
      name: 'inventoryItemId',
      description: 'Restrict to UOMs the given inventory item can transact in',
      required: false,
    }),
    ApiQuery({
      name: 'supplierId',
      description: 'Restrict to UOMs the supplier offers for this item',
      required: false,
    }),
    ApiQuery({
      name: 'purchaseOrderId',
      description: 'Exclude UOMs already on this purchase order for the item',
      required: false,
    }),
    ApiResponse({ status: 200, description: 'UOM select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUomDimensionsSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get UOM dimension select options',
      description: 'Returns paginated dimension options for select dropdowns.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiResponse({ status: 200, description: 'UOM dimension select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

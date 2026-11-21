import { BulkBlockSiteItemsDto } from '@commerce/inventory-item-sites/dto/request/bulk-block-site-items.dto';
import { BulkSiteItemsDto } from '@commerce/inventory-item-sites/dto/request/bulk-site-items.dto';
import { InventoryItemLedgerTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-ledger-table-response.dto';
import { InventoryItemLotTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-lot-table-response.dto';
import { InventoryItemQuantTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-quant-table-response.dto';
import { SiteInventoryItemCountsResponseDto } from '@commerce/inventory-item-sites/dto/response/site-inventory-item-counts-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';

// Swagger decorator for POST setup/bulk
export function ApiBulkAddToSite() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add inventory items to the site',
      description:
        'Adds the selected items to the current site, each restocked manually until its levels are set. Refused whole while the site already carries any of them.',
    }),
    ApiBody({ type: BulkSiteItemsDto }),
    ApiResponse({ status: 201, description: 'Items added to the site.', type: SuccessResponseDto }),
    ApiResponse({ status: 409, description: 'The site already carries a selected item.' }),
  );
}

// Swagger decorator for POST setup/bulk/block
export function ApiBulkBlock() {
  return applyDecorators(
    ApiOperation({
      summary: 'Block purchasing of inventory items at the site',
      description:
        'Stops the current site buying the selected items it carries, with one reason for all. Items it does not carry or has already blocked are skipped; stock on hand and goods already ordered still move.',
    }),
    ApiBody({ type: BulkBlockSiteItemsDto }),
    ApiResponse({ status: 200, description: 'Purchasing blocked.', type: SuccessResponseDto }),
    ApiResponse({ status: 409, description: 'None of the selected items can be blocked.' }),
  );
}

// Swagger decorator for POST setup/bulk/unblock
export function ApiBulkUnblock() {
  return applyDecorators(
    ApiOperation({
      summary: 'Allow purchasing of inventory items at the site',
      description:
        'Lets the current site buy the selected items again where it has blocked them. Items not blocked here are skipped.',
    }),
    ApiBody({ type: BulkSiteItemsDto }),
    ApiResponse({ status: 200, description: 'Purchasing allowed.', type: SuccessResponseDto }),
    ApiResponse({ status: 409, description: 'None of the selected items is blocked here.' }),
  );
}

// Swagger decorator for GET :id/ledger/table
export function ApiGetLedgerTable() {
  return applyDecorators(
    ApiOperation({
      summary: "Get an item's ledger",
      description: "Returns the item's stock movements at the site, each quantity also in its display unit.",
    }),
    ApiParam({ name: 'id', description: 'Inventory item ID' }),
    ApiResponse({ status: 200, description: 'Ledger entries retrieved.', type: InventoryItemLedgerTableResponseDto }),
  );
}

// Swagger decorator for GET :id/quants/table
export function ApiGetQuantsTable() {
  return applyDecorators(
    ApiOperation({
      summary: "Get an item's quants",
      description: "Returns the item's stock by location and lot at the site, each quantity also in its display unit.",
    }),
    ApiParam({ name: 'id', description: 'Inventory item ID' }),
    ApiResponse({ status: 200, description: 'Quants retrieved.', type: InventoryItemQuantTableResponseDto }),
  );
}

// Swagger decorator for GET :id/lots/table
export function ApiGetLotsTable() {
  return applyDecorators(
    ApiOperation({
      summary: "Get an item's lots",
      description: "Returns the item's lots at the site, each quantity also in its display unit.",
    }),
    ApiParam({ name: 'id', description: 'Inventory item ID' }),
    ApiResponse({ status: 200, description: 'Lots retrieved.', type: InventoryItemLotTableResponseDto }),
  );
}

// Swagger decorator for GET :id/counts
export function ApiFindInventoryItemCounts() {
  return applyDecorators(
    ApiOperation({
      summary: "Count the rows of an inventory item's tabs",
      description:
        "One count per listing tab of the item's detail page at the site: its stock by location, lots, location setups, suppliers, price rows, movements and quants, each with no table filters applied.",
    }),
    ApiParam({ name: 'id', description: 'Inventory item ID' }),
    ApiResponse({ status: 200, type: SiteInventoryItemCountsResponseDto }),
    ApiResponse({ status: 404, description: 'Inventory item not found.' }),
  );
}

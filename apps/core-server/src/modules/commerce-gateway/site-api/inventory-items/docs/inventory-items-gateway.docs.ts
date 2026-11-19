import { InventoryItemLedgerTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-ledger-table-response.dto';
import { InventoryItemLotTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-lot-table-response.dto';
import { InventoryItemQuantTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-quant-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

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

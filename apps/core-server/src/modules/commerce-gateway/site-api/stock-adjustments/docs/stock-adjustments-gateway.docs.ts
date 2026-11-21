import { StockAdjustmentCountsResponseDto } from '@commerce/stock-adjustments/dto/response/stock-adjustment-counts-response.dto';
import { StockAdjustmentLineItemResponseDto } from '@commerce/stock-adjustments/dto/response/stock-adjustment-line-item-response.dto';
import { StockAdjustmentLineResponseDto } from '@commerce/stock-adjustments/dto/response/stock-adjustment-line-response.dto';
import { StockAdjustmentLineTableResponseDto } from '@commerce/stock-adjustments/dto/response/stock-adjustment-line-table-response.dto';
import { StockAdjustmentLotDetailResponseDto } from '@commerce/stock-adjustments/dto/response/stock-adjustment-lot-detail-response.dto';
import { StockAdjustmentLotResponseDto } from '@commerce/stock-adjustments/dto/response/stock-adjustment-lot-response.dto';
import { StockAdjustmentResponseDto } from '@commerce/stock-adjustments/dto/response/stock-adjustment-response.dto';
import { StockAdjustmentTableResponseDto } from '@commerce/stock-adjustments/dto/response/stock-adjustment-table-response.dto';
import { StockAdjustmentTreeNodeResponseDto } from '@commerce/stock-adjustments/dto/response/stock-adjustment-tree-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

// Swagger decorator for POST :id/lines/:lineId/items
export function ApiAddStockAdjustmentLineItem() {
  return applyDecorators(
    ApiOperation({ summary: 'Add a serial line item to a stock adjustment line' }),
    ApiCreatedResponse({ type: StockAdjustmentLineItemResponseDto }),
  );
}

// Swagger decorator for GET :id
export function ApiFindStockAdjustmentById() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a stock adjustment',
      description: "Returns one adjustment, its total quantity also in the item's display unit.",
    }),
    ApiParam({ name: 'id', description: 'Stock adjustment ID' }),
    ApiOkResponse({ type: StockAdjustmentResponseDto }),
  );
}

// Swagger decorator for GET :id/lines/:lineId
export function ApiGetStockAdjustmentLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get an adjustment line',
      description: "Returns one line, its primary-unit quantities also in the item's display unit.",
    }),
    ApiParam({ name: 'id', description: 'Stock adjustment ID' }),
    ApiParam({ name: 'lineId', description: 'Stock adjustment line ID' }),
    ApiOkResponse({ type: StockAdjustmentLineResponseDto }),
  );
}

// Swagger decorator for GET table
export function ApiGetStockAdjustmentTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get stock adjustments',
      description: "Returns one page of the site's adjustments, each total also in the item's display unit.",
    }),
    ApiOkResponse({ type: StockAdjustmentTableResponseDto }),
  );
}

// Swagger decorator for GET :id/lines/table
export function ApiGetStockAdjustmentLinesTable() {
  return applyDecorators(
    ApiOperation({
      summary: "Get an adjustment's lines",
      description:
        "Returns one page of the adjustment's lines, their primary-unit quantities also in the item's display unit.",
    }),
    ApiParam({ name: 'id', description: 'Stock adjustment ID' }),
    ApiOkResponse({ type: StockAdjustmentLineTableResponseDto }),
  );
}

// Swagger decorator for GET :id/lots/:lotId/lines/table
export function ApiGetStockAdjustmentLinesByLotTable() {
  return applyDecorators(
    ApiOperation({
      summary: "Get a lot's lines",
      description:
        "Returns one page of one lot's lines, their primary-unit quantities also in the item's display unit.",
    }),
    ApiParam({ name: 'id', description: 'Stock adjustment ID' }),
    ApiParam({ name: 'lotId', description: 'Stock adjustment lot ID' }),
    ApiOkResponse({ type: StockAdjustmentLineTableResponseDto }),
  );
}

// Swagger decorator for GET :id/lots
export function ApiGetStockAdjustmentLots() {
  return applyDecorators(
    ApiOperation({
      summary: "Get an adjustment's lots",
      description: "Returns the adjustment's lots, each total also in the item's display unit.",
    }),
    ApiParam({ name: 'id', description: 'Stock adjustment ID' }),
    ApiOkResponse({ type: [StockAdjustmentLotResponseDto] }),
  );
}

// Swagger decorator for GET :id/lots/:lotId/detail
export function ApiGetStockAdjustmentLotDetail() {
  return applyDecorators(
    ApiOperation({
      summary: "Get a lot's detail",
      description: "Returns one lot of the adjustment, its total also in the item's display unit.",
    }),
    ApiParam({ name: 'id', description: 'Stock adjustment ID' }),
    ApiParam({ name: 'lotId', description: 'Stock adjustment lot ID' }),
    ApiOkResponse({ type: StockAdjustmentLotDetailResponseDto }),
  );
}

// Swagger decorator for GET :id/tree
export function ApiGetStockAdjustmentTree() {
  return applyDecorators(
    ApiOperation({
      summary: "Get an adjustment's lot tree",
      description:
        "Returns the adjustment's lots and their lines as a tree, lot totals also in the item's display unit.",
    }),
    ApiParam({ name: 'id', description: 'Stock adjustment ID' }),
    ApiOkResponse({ type: [StockAdjustmentTreeNodeResponseDto] }),
  );
}

// Swagger decorator for GET :id/lines
export function ApiGetStockAdjustmentLines() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get every line of an adjustment',
      description:
        "Returns all of the adjustment's lines, their primary-unit quantities also in the item's display unit.",
    }),
    ApiParam({ name: 'id', description: 'Stock adjustment ID' }),
    ApiOkResponse({ type: [StockAdjustmentLineResponseDto] }),
  );
}

// Swagger decorator for GET :id/counts
export function ApiFindStockAdjustmentCounts() {
  return applyDecorators(
    ApiOperation({
      summary: "Count an adjustment's lines and draft lots",
      description:
        "The rows the adjustment's Breakdown tab lists: its lines, and the draft lots opening stock of a lot-tracked item groups them under.",
    }),
    ApiParam({ name: 'id', description: 'Stock adjustment ID' }),
    ApiOkResponse({ type: StockAdjustmentCountsResponseDto }),
  );
}

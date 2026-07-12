import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { StockAdjustmentLineItemResponseDto } from '../dto/response/stock-adjustment-line-item-response.dto';

// Swagger decorator for POST :id/lines/:lineId/items
export function ApiAddStockAdjustmentLineItem() {
  return applyDecorators(
    ApiOperation({ summary: 'Add a serial line item to a stock adjustment line' }),
    ApiCreatedResponse({ type: StockAdjustmentLineItemResponseDto }),
  );
}

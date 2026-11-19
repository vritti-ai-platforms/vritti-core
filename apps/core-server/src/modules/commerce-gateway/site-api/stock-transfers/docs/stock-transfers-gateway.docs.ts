import { StockTransferTableResponseDto } from '@commerce/stock-transfers/dto/response/stock-transfer-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

// Swagger decorator for GET table
export function ApiGetStockTransferTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get stock transfers',
      description: "Returns one page of the site's stock transfers, each quantity also in the item's display unit.",
    }),
    ApiResponse({ status: 200, description: 'Stock transfers retrieved.', type: StockTransferTableResponseDto }),
  );
}

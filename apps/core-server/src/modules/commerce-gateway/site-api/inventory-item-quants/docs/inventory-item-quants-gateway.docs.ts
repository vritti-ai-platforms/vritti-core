import { InventoryBatchResponseDto } from '@commerce/inventory-item-quants/dto/response/inventory-batch-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

// Swagger decorator for GET :id
export function ApiFindById() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a quant',
      description: "Returns one quant, its quantities also in the item's display unit.",
    }),
    ApiParam({ name: 'id', description: 'Quant ID' }),
    ApiResponse({ status: 200, description: 'Quant retrieved.', type: InventoryBatchResponseDto }),
    ApiResponse({ status: 404, description: 'Quant not found.' }),
  );
}

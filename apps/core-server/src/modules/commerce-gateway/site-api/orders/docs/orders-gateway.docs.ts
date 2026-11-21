import { OrderCountsResponseDto } from '@commerce/orders/dto/response/order-counts-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

const ID = { name: 'id', description: 'Order ID' };

export function ApiFindOrderCounts() {
  return applyDecorators(
    ApiOperation({
      summary: "Count an order's items and payments",
      description: "One count per tab of the order's detail page, so each tab can show how many rows it lists.",
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: OrderCountsResponseDto }),
    ApiResponse({ status: 404, description: 'Order not found.' }),
  );
}

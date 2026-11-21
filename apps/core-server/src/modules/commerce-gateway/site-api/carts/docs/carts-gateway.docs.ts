import { CartCountsResponseDto } from '@commerce/carts/dto/response/cart-counts-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

const ID = { name: 'id', description: 'Cart ID' };

export function ApiFindCartCounts() {
  return applyDecorators(
    ApiOperation({
      summary: "Count a cart's lines",
      description: "One count per tab of the cart's detail page, so each tab can show how many rows it lists.",
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: CartCountsResponseDto }),
    ApiResponse({ status: 404, description: 'Cart not found.' }),
  );
}

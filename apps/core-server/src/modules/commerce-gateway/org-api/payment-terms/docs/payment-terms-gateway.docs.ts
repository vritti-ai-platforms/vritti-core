import { PaymentTermCountsResponseDto } from '@commerce/payment-terms/dto/response/payment-term-counts-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiFindPaymentTermCounts() {
  return applyDecorators(
    ApiOperation({
      summary: "Count a payment term's rules",
      description: "One count per tab of the payment term's detail page, so each tab can show how many rows it lists.",
    }),
    ApiParam({ name: 'id', description: 'Payment term ID' }),
    ApiResponse({ status: 200, type: PaymentTermCountsResponseDto }),
    ApiResponse({ status: 404, description: 'Payment term not found.' }),
  );
}

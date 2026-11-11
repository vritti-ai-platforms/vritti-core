import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderPaymentAmountDto {
  @ApiProperty({ example: 'INR' })
  currency: string;

  @ApiProperty({ description: 'Major units, as a decimal string', example: '100.00' })
  value: string;
}

export class OrderPaymentResponseDto {
  @ApiProperty({ description: 'Payment intent ID' })
  id: string;

  @ApiProperty({ example: 'hdfc-razorpay' })
  gatewayCode: string;

  @ApiPropertyOptional({ example: 'card', nullable: true })
  method: string | null;

  @ApiProperty({ type: OrderPaymentAmountDto })
  amount: OrderPaymentAmountDto;

  @ApiProperty({
    description:
      'CREATED, REQUIRES_ACTION, PROCESSING, SUCCEEDED, FAILED, CANCELED, EXPIRED, REFUND_PENDING, REFUNDED or REFUND_FAILED',
    example: 'SUCCEEDED',
  })
  status: string;

  @ApiPropertyOptional({ description: "The gateway's order id", example: 'order_TyU6BB0Cz3PDbK', nullable: true })
  providerOrderId: string | null;

  @ApiPropertyOptional({ description: "The gateway's payment id", example: 'pay_TyU6ZcE3lJVWDU', nullable: true })
  providerPaymentId: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp when it was paid', nullable: true })
  succeededAt: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp when the gateway confirmed the refund', nullable: true })
  refundedAt: string | null;

  @ApiPropertyOptional({ description: "The gateway's id for the refund", example: 'rfnd_Q1x2y3z4', nullable: true })
  refundReference: string | null;

  @ApiPropertyOptional({ description: 'Why the gateway refused the last refund', nullable: true })
  refundFailureMessage: string | null;

  @ApiProperty({ description: 'True for the payment the order was paid with' })
  usedForOrder: boolean;

  @ApiProperty({ description: 'True when the gateway refused its refund — the one refund staff retry by hand' })
  refundable: boolean;

  @ApiProperty({
    description:
      "True when the payment is for more than this order — a checkout across stores is paid once, for every store's order",
  })
  coversOtherOrders: boolean;

  @ApiProperty({ description: 'ISO timestamp when it was opened' })
  createdAt: string;
}

export class OrderPaymentRefundCheckResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'What the gateway said, in words staff can read',
    example: 'Refund confirmed by Razorpay.',
  })
  message: string;

  @ApiProperty({
    description: "The payment's status after the check: REFUND_PENDING, REFUNDED or REFUND_FAILED",
    example: 'REFUNDED',
  })
  status: string;
}

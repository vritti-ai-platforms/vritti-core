import { ApiProperty } from '@nestjs/swagger';

// What the browser needs to open the gateway's checkout for the verification payment
export class WebhookCheckCheckoutDto {
  @ApiProperty({ example: 'razorpay' })
  gateway: string;

  @ApiProperty({
    description: "The public key id Razorpay's embedded checkout opens with; null for a gateway with its own page",
    nullable: true,
    example: 'rzp_test_AbCdEf123456',
  })
  keyId: string | null;

  @ApiProperty({ nullable: true, example: 'order_PqR1a2b3c4' })
  orderId: string | null;

  @ApiProperty({
    description: 'The gateway’s own page to pay on (Easebuzz); null for an embedded checkout',
    nullable: true,
    example: 'https://testpay.easebuzz.in/pay/4d49058599709b74c4616b28c3ec38a4',
  })
  url: string | null;

  @ApiProperty({ description: 'Minor units', example: 1000 })
  amount: number;

  @ApiProperty({ example: 'INR' })
  currency: string;
}

// Where a verification payment stands, for the dialog waiting on it
export class WebhookCheckStatusResponseDto {
  @ApiProperty({
    description:
      'The verification payment’s status: CREATED / REQUIRES_ACTION while open, then SUCCEEDED, FAILED, CANCELED or EXPIRED',
    example: 'SUCCEEDED',
  })
  status: string;

  @ApiProperty({ description: 'Why the payment failed, as the gateway said', nullable: true, example: null })
  failureMessage: string | null;
}

export class WebhookCheckStartedResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  paymentIntentId: string;

  @ApiProperty({ type: WebhookCheckCheckoutDto })
  checkout: WebhookCheckCheckoutDto;

  @ApiProperty({
    description: "Core's hosted callback the embedded checkout posts its result to; prefix it with core's origin",
    example: '/payments/checkout/uuid-org/uuid-intent/callback',
  })
  callbackPath: string;

  @ApiProperty({
    description: 'Where the embedded checkout sends a cancelled payment',
    example: '/payments/checkout/uuid-org/uuid-intent/cancel',
  })
  cancelPath: string;
}

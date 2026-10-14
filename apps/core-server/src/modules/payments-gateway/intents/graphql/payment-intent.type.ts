import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Money } from '@/modules/commerce-gateway/org-api/catalog-channels/graphql/catalog-listing.type';

export enum PaymentIntentStatus {
  CREATED = 'CREATED',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

registerEnumType(PaymentIntentStatus, { name: 'PaymentIntentStatus' });

@ObjectType()
export class PaymentReference {
  @Field(() => String)
  type: string;

  @Field(() => String)
  id: string;
}

@ObjectType()
export class PaymentCheckout {
  // The gateway code the client launches its checkout for, e.g. razorpay
  @Field(() => String)
  gateway: string;

  // JSON-encoded launch options for that gateway's checkout widget
  @Field(() => String)
  payload: string;

  // Path on core the gateway posts its checkout result to, set when the intent has storefront return urls
  @Field(() => String, {
    nullable: true,
    description: "Path on the core API the gateway's checkout posts its result to. Prefix it with the core origin.",
  })
  callbackPath?: string | null;

  // Path on core the gateway sends the shopper to when they abandon the checkout
  @Field(() => String, {
    nullable: true,
    description:
      "Path on the core API the gateway's checkout sends a cancelled payment to. Prefix it with the core origin.",
  })
  cancelPath?: string | null;
}

@ObjectType()
export class PaymentFailure {
  @Field(() => String, { nullable: true })
  code?: string | null;

  @Field(() => String, { nullable: true })
  message?: string | null;
}

@ObjectType()
export class PaymentIntent {
  @Field(() => ID)
  id: string;

  @Field(() => PaymentIntentStatus)
  status: PaymentIntentStatus;

  @Field(() => Money)
  amount: Money;

  @Field(() => PaymentReference)
  reference: PaymentReference;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => PaymentCheckout, { nullable: true })
  checkout?: PaymentCheckout | null;

  @Field(() => PaymentFailure, { nullable: true })
  failure?: PaymentFailure | null;

  @Field(() => String, { nullable: true })
  paidAt?: string | null;

  @Field(() => String, { nullable: true })
  expiresAt?: string | null;

  @Field(() => String)
  createdAt: string;
}

@ObjectType()
export class CheckoutOrder {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  orderNumber: string;

  @Field(() => Money)
  total: Money;
}

@ObjectType()
export class CheckoutSession {
  @Field(() => CheckoutOrder)
  order: CheckoutOrder;

  @Field(() => PaymentIntent)
  paymentIntent: PaymentIntent;
}

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
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
  REFUND_FAILED = 'REFUND_FAILED',
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

  @Field(() => String, { description: 'The gateway the payment goes through, e.g. razorpay.' })
  gatewayCode: string;

  @Field(() => String, {
    nullable: true,
    description: 'The payment method: the one the shopper chose before paying, then the one they actually paid with.',
  })
  method?: string | null;

  @Field(() => ID, { nullable: true, description: 'The checkout this payment is for, when it pays one.' })
  checkoutId?: string | null;

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

export enum CheckoutStatus {
  OPEN = 'OPEN',
  PAID = 'PAID',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(CheckoutStatus, {
  name: 'CheckoutStatus',
  description:
    'OPEN: awaiting payment. PAID: the payment landed, orders being made. CONVERTED: one order per store exists. EXPIRED: its 30-minute window closed unpaid. CANCELLED: the shopper cancelled it.',
});

// One store's share of a checkout
@ObjectType()
export class CheckoutStoreShare {
  @Field(() => ID)
  siteId: string;

  @Field(() => ID)
  legalEntityId: string;

  @Field(() => Money)
  subtotal: Money;
}

// One order a checkout became, at one store
@ObjectType()
export class CheckoutStoreOrder {
  @Field(() => ID)
  siteId: string;

  @Field(() => ID)
  orderId: string;

  @Field(() => String)
  orderNumber: string;
}

// Who the checkout's orders are for, as the checkout holds them: copied from the party when it opened, changed with
// changeCheckoutContact. The gateway's page is prefilled from these
@ObjectType()
export class CheckoutCustomer {
  @Field(() => String, { nullable: true })
  name: string | null;

  @Field(() => String, { nullable: true, description: 'In international form, e.g. +919876543210.' })
  phone: string | null;

  @Field(() => String, { nullable: true })
  email: string | null;
}

// The cart frozen at checkout — every store, or one — and what it has become. Payment intents are opened for it with
// createPaymentIntent(checkoutId); one of them pays it
@ObjectType()
export class Checkout {
  @Field(() => ID)
  id: string;

  @Field(() => CheckoutStatus)
  status: CheckoutStatus;

  @Field(() => String)
  currencyCode: string;

  @Field(() => Money)
  total: Money;

  @Field(() => [CheckoutStoreShare])
  sites: CheckoutStoreShare[];

  @Field(() => String, {
    description:
      'ISO 8601. When the checkout closes if it is not paid; once closed (EXPIRED, CANCELLED, PAID), when it did.',
  })
  expiresAt: string;

  @Field(() => String, { nullable: true, description: 'ISO 8601. When it was paid.' })
  paidAt: string | null;

  @Field(() => ID, {
    nullable: true,
    description: 'The party’s saved address the orders are delivered to; null for takeaway.',
  })
  partyAddressId: string | null;

  @Field(() => CheckoutCustomer, { description: 'Who the orders are for; the gateway’s page is prefilled from this.' })
  customer: CheckoutCustomer;

  // Empty until the payment lands
  @Field(() => [CheckoutStoreOrder])
  orders: CheckoutStoreOrder[];

  @Field(() => PaymentIntent, {
    nullable: true,
    description: 'The payment that paid it, else the latest one opened for it; null until Pay is pressed.',
  })
  paymentIntent: PaymentIntent | null;
}

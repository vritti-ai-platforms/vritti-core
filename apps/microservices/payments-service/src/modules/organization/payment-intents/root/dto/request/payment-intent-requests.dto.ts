import {
  type CheckoutMode,
  CheckoutModeValues,
  type PaymentMethodCode,
  PaymentMethodValues,
} from '@domain/gateways/gateway-transport';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { type PaymentChannelType, PaymentChannelTypeValues } from '@/db/schema';

// Money crosses NATS as a string of minor units (paise): JSON has no bigint, and a float would round
const MINOR_UNITS = /^\d{1,15}$/;

// A storefront page: http(s) only, and localhost allowed so a developer's storefront can be the target
const CHECKOUT_URL_OPTIONS = { protocols: ['http', 'https'], require_protocol: true, require_tld: false };
// A gateway on the internet posts to it, so only a public https address
const NOTIFY_URL_OPTIONS = { protocols: ['https'], require_protocol: true };

export class PaymentIntentCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

// One split leg as core worked it out: what a linked account is paid. Checked against the shares and not stored —
// payments derives the legs from the shares itself
export class PaymentIntentTransferDto {
  @IsUUID()
  linkedAccountId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  providerAccountId: string;

  @Matches(MINOR_UNITS, { message: 'amount must be a whole number of minor units' })
  amount: string;
}

// One store's share of the payment and where it is paid out, as core routed it — recorded with the intent so a
// payment always says whose sale each part was and which bank it went to
export class PaymentIntentAllocationDto {
  @IsUUID()
  legalEntityId: string;

  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsUUID()
  payoutAccountId: string;

  @IsUUID()
  bankAccountId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  gatewayAccountId: string;

  @IsBoolean()
  isMainAccount: boolean;

  @Matches(MINOR_UNITS, { message: 'grossAmount must be a whole number of minor units' })
  grossAmount: string;

  @Matches(MINOR_UNITS, { message: 'platformFeeAmount must be a whole number of minor units' })
  platformFeeAmount: string;

  @Matches(MINOR_UNITS, { message: 'netAmount must be a whole number of minor units' })
  netAmount: string;
}

export class CreatePaymentIntentDto {
  // Absent for a checkout that spans legal entities; the split legs then say who is paid
  @IsOptional()
  @IsUUID()
  legalEntityId?: string;

  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsOptional()
  @IsUUID()
  appId?: string;

  @IsOptional()
  @IsUUID()
  partyId?: string;

  // The gateway config core resolved for this request, and what it settles into
  @IsUUID()
  configId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  gatewayCode: string;

  @IsEnum(PaymentChannelTypeValues)
  type: PaymentChannelType;

  // Decrypted by core for this one call; never stored here
  @IsObject()
  credentials: Record<string, string>;

  @Matches(MINOR_UNITS, { message: 'amount must be a whole number of minor units' })
  amount: string;

  @Matches(/^[A-Z]{3}$/, { message: 'currency must be an ISO 4217 code' })
  currency: string;

  @Matches(/^[a-z0-9][a-z0-9._-]{0,99}$/, {
    message: 'referenceType must be lowercase letters, digits, dots, dashes or underscores',
  })
  referenceType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  referenceId: string;

  // The record this payment settles (a checkout, a point-of-sale sale), when the caller looks payments up by it
  @IsOptional()
  @IsUUID()
  targetId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentIntentCustomerDto)
  customer?: PaymentIntentCustomerDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  // Where the hosted checkout callback sends the shopper once paid; core has already checked its origin
  @IsOptional()
  @IsUrl(CHECKOUT_URL_OPTIONS)
  @MaxLength(2048)
  returnUrl?: string;

  // Core's webhook route for this payment's org and config, for gateways that take the URL on each order. Not stored:
  // a retried create sends it again
  @IsOptional()
  @IsUrl(NOTIFY_URL_OPTIONS)
  @MaxLength(250)
  notifyUrl?: string;

  // Core's hosted checkout callback for the organization, without the intent — `${base}/${intentId}/callback` is where a
  // gateway that takes its return URL on the order posts the payment's result. Not stored: a retried create sends it
  // again
  @IsOptional()
  @IsUrl(CHECKOUT_URL_OPTIONS)
  @MaxLength(1024)
  checkoutCallbackBase?: string;

  // The config's main account at the gateway, for a gateway whose split must cover the whole amount: what the legs
  // leave over is sent to it
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  mainAccountId?: string;

  // The method the shopper picked on the hosted checkout page; the gateway's page opens on it. Not stored
  @IsOptional()
  @IsIn(PaymentMethodValues)
  paymentMethod?: PaymentMethodCode;

  // How the browser opens the gateway, from the gateway config; written into the launch payload. HOSTED when absent
  @IsOptional()
  @IsIn(CheckoutModeValues)
  checkoutMode?: CheckoutMode;

  // Where the shopper goes back to on a failed or cancelled payment
  @IsOptional()
  @IsUrl(CHECKOUT_URL_OPTIONS)
  @MaxLength(2048)
  retryUrl?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  idempotencyKey: string;

  // When the payment can no longer be made; absent, the intent gets the default window
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PaymentIntentTransferDto)
  transfers?: PaymentIntentTransferDto[];

  // Every store's share of the payment; together they add up to the amount. Absent only from callers that predate
  // allocations
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PaymentIntentAllocationDto)
  allocations?: PaymentIntentAllocationDto[];
}

// What the gateway's checkout hands back to the browser after a payment
export class GatewayResponseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  orderId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  signature: string;
}

export class ConfirmPaymentIntentDto {
  @IsUUID()
  paymentIntentId: string;

  @IsObject()
  credentials: Record<string, string>;

  @ValidateNested()
  @Type(() => GatewayResponseDto)
  gatewayResponse: GatewayResponseDto;
}

// Asks the gateway whether an intent's order was paid and applies what it says, as a webhook would
export class SyncPaymentIntentDto {
  @IsUUID()
  paymentIntentId: string;

  @IsObject()
  credentials: Record<string, string>;
}

export class PaymentIntentRefDto {
  @IsUUID()
  paymentIntentId: string;
}

// The payment intents opened for one target — a checkout, a point-of-sale sale
export class TargetIntentsDto {
  @IsUUID()
  targetId: string;
}

// The intents opened for one thing being paid for, whatever it is — a checkout, an order, a booking
export class ReferenceIntentsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  referenceType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  referenceId: string;
}

export class ExpireStaleIntentsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

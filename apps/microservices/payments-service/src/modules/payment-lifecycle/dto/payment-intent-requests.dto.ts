import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
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

// One seller's share, recorded with the intent and sent to the gateway once the payment is captured
export class PaymentIntentTransferDto {
  @IsUUID()
  linkedAccountId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  providerAccountId: string;

  @Matches(MINOR_UNITS, { message: 'amount must be a whole number of minor units' })
  amount: string;

  @IsOptional()
  @IsBoolean()
  onHold?: boolean;

  @IsOptional()
  @IsDateString()
  onHoldUntil?: string;
}

export class CreatePaymentIntentDto {
  @IsUUID()
  legalEntityId: string;

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

  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

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

  // Where the shopper goes back to on a failed or cancelled payment
  @IsOptional()
  @IsUrl(CHECKOUT_URL_OPTIONS)
  @MaxLength(2048)
  checkoutUrl?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  idempotencyKey: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PaymentIntentTransferDto)
  transfers?: PaymentIntentTransferDto[];
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

export class PaymentIntentRefDto {
  @IsUUID()
  paymentIntentId: string;
}

export class ExecuteTransfersDto {
  @IsUUID()
  paymentIntentId: string;

  @IsObject()
  credentials: Record<string, string>;
}

export class ExpireStaleIntentsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

export class PendingPaymentEventsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

export class AckPaymentEventsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  ids: string[];
}

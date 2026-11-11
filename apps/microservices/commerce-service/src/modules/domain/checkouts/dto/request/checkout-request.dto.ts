import { CartSiteScopeDto } from '@domain/carts/dto/request/cart-request.dto';
import { IsCode } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class StartCheckoutDto {
  // The catalogue the shopper buys from — fixes which listings and prices each store's cart reads
  @IsUUID()
  appId: string;

  @IsUUID()
  partyId: string;

  // ISO 4217. The currency every store's lines are priced and the one payment is taken in
  @IsString()
  @Length(3, 3)
  currencyCode: string;

  // Accepted for older callers and ignored: the gateway is chosen per payment intent, not per checkout
  @IsOptional()
  @IsCode()
  gatewayCode?: string;

  // Accepted for older callers and ignored: the checkout's key is the cart's own fingerprint, so the same cart reaches
  // the same open checkout
  @IsOptional()
  @IsString()
  @MaxLength(100)
  checkoutKey?: string;

  // The party's open checkout core has cleared to be replaced (no payment under way, none paid at the gateway). An open
  // checkout of a different cart is replaced only when it is this one
  @IsOptional()
  @IsUUID()
  replaceCheckoutId?: string;

  // The stores to check out; absent means every store the shopper holds lines at
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  siteIds?: string[];

  // One of the party's own addresses. Present makes every order a delivery order
  @IsOptional()
  @IsUUID()
  addressId?: string;

  // The stores the storefront sells from; each cart is read under its own store's reach
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CartSiteScopeDto)
  sites: CartSiteScopeDto[];
}

// Expires the open checkouts whose window closed unpaid
export class ExpireStaleCheckoutsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

export class CompleteCheckoutDto {
  @IsUUID()
  checkoutId: string;

  @IsUUID()
  paymentIntentId: string;

  // Minor units as a decimal string, so it survives JSON without a float
  @Matches(/^\d+$/, { message: 'amountMinor must be a non-negative integer string' })
  amountMinor: string;

  // ISO 4217. The currency the payment was captured in; must match the checkout's
  @IsString()
  @Length(3, 3)
  currency: string;

  @IsISO8601()
  paidAt: string;
}

export class CancelCheckoutDto {
  @IsUUID()
  checkoutId: string;

  // The intent the cancellation came from. A payment intent ending no longer ends its checkout, so this is ignored
  @IsOptional()
  @IsUUID()
  paymentIntentId?: string;

  @IsString()
  @MaxLength(500)
  reason: string;
}

export class CheckoutRefDto {
  @IsUUID()
  checkoutId: string;

  // Whose checkout it must be; another party's is not found
  @IsUUID()
  partyId: string;
}

// Delivers an open checkout to another of the party's saved addresses
export class ChangeCheckoutAddressDto extends CheckoutRefDto {
  @IsUUID()
  addressId: string;
}

// Changes who the checkout's orders are for — the name, phone and email the checkout holds, which the orders and the
// gateway's page show. The party's own profile is left as it is
export class ChangeCheckoutContactDto extends CheckoutRefDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  // E.164, as the party's communications hold it
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phone must be an international number such as +919876543210' })
  @MaxLength(20)
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;
}

// The party's open checkout, if any
export class FindOpenCheckoutDto {
  @IsUUID()
  partyId: string;
}

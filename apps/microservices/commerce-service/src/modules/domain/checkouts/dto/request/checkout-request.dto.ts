import { CartSiteScopeDto } from '@domain/carts/dto/request/cart-request.dto';
import { IsCode } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
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

  // The gateway the shopper picked, e.g. razorpay; core has already checked every store takes it
  @IsCode()
  gatewayCode: string;

  // The storefront's key for this attempt. A repeat with the same key returns the checkout already opened for it
  @IsString()
  @MaxLength(100)
  checkoutKey: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  // The stores the storefront sells from; each cart is read under its own store's reach
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CartSiteScopeDto)
  sites: CartSiteScopeDto[];
}

export class BindCheckoutIntentDto {
  @IsUUID()
  checkoutId: string;

  @IsUUID()
  paymentIntentId: string;
}

export class CompleteCheckoutDto {
  @IsUUID()
  checkoutId: string;

  @IsUUID()
  paymentIntentId: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  method?: string;

  // The payment provider's own id for the captured payment
  @IsOptional()
  @IsString()
  @MaxLength(100)
  providerPaymentId?: string;

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

  // The intent the cancellation came from; a checkout bound to another intent is left alone
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

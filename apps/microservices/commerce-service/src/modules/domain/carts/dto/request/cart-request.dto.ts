import { IsCode } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CartScopeDto {
  @IsUUID('7')
  partyId: string;

  // ISO 4217. Fixes which of a listing's prices the cart is read at
  @IsString()
  @Length(3, 3)
  currencyCode: string;

  // The catalogue the reader reads prices from, when they have one
  @IsOptional()
  @IsUUID('7')
  appId?: string;
}

export class CartSiteScopeDto {
  @IsUUID('7')
  siteId: string;

  @IsUUID('7')
  legalEntityId: string;

  @IsString()
  timezone: string;
}

export class CartSitesScopeDto extends CartScopeDto {
  // The sites the storefront sells from; each cart is read under its own site's reach
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CartSiteScopeDto)
  sites: CartSiteScopeDto[];
}

export class AddCartItemDto extends CartScopeDto {
  // The product, by its code. Which catalogue offers it is resolved per read, never stored
  @IsCode()
  code: string;

  // Bounded here as well as by the CHECK, so an out-of-range quantity is a readable refusal rather than a constraint
  // violation surfacing as a server error.
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class UpdateCartItemDto extends CartScopeDto {
  @IsCode()
  code: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class RemoveCartItemDto extends CartScopeDto {
  @IsCode()
  code: string;
}

export class ClearCartDto {
  @IsUUID('7')
  partyId: string;
}

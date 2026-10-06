import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CartScopeDto {
  @IsUUID('7')
  partyId: string;

  // ISO 4217. Fixes which of a listing's prices the basket is read at
  @IsString()
  @Length(3, 3)
  currencyCode: string;

  // The catalogue the reader sells from, when they have one
  @IsOptional()
  @IsUUID('7')
  appId?: string;

  // The outlet whose price wins, falling back to the organization-wide row when it has none
  @IsOptional()
  @IsUUID('7')
  siteId?: string;
}

export class AddCartItemDto extends CartScopeDto {
  // The product. Which catalogue offers it is resolved per read, never stored
  @IsUUID('7')
  offeringVariantId: string;

  // Bounded here as well as by the CHECK, so an out-of-range quantity is a readable refusal rather
  // than a constraint violation surfacing as a server error.
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class UpdateCartItemDto extends CartScopeDto {
  @IsUUID('7')
  offeringVariantId: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class RemoveCartItemDto extends CartScopeDto {
  @IsUUID('7')
  offeringVariantId: string;
}

export class ClearCartDto {
  @IsUUID('7')
  partyId: string;
}

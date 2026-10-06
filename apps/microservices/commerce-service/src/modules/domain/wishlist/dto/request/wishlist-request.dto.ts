import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class WishlistScopeDto {
  @IsUUID('7')
  appId: string;

  @IsUUID('7')
  partyId: string;

  // ISO 4217, so each row can be priced as it is listed back
  @IsString()
  @Length(3, 3)
  currencyCode: string;

  // The outlet whose price wins, falling back to the organization-wide row when it has none
  @IsOptional()
  @IsUUID('7')
  siteId?: string;
}

export class AddWishlistItemDto extends WishlistScopeDto {
  // The product. Which catalogue offers it is resolved per read, never stored
  @IsUUID('7')
  offeringVariantId: string;
}

export class RemoveWishlistItemDto extends WishlistScopeDto {
  @IsUUID('7')
  offeringVariantId: string;
}

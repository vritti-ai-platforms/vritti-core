import { IsCode } from '@vritti/api-sdk/decorators';
import { IsString, IsUUID, Length } from 'class-validator';

export class WishlistScopeDto {
  @IsUUID('7')
  appId: string;

  @IsUUID('7')
  partyId: string;

  // ISO 4217, so each row can be priced as it is listed back
  @IsString()
  @Length(3, 3)
  currencyCode: string;
}

export class AddWishlistItemDto extends WishlistScopeDto {
  // The product, by its code.
  // The product, by its code. Which catalogue offers it is resolved per read, never stored
  @IsCode()
  code: string;
}

export class RemoveWishlistItemDto extends WishlistScopeDto {
  @IsCode()
  code: string;
}

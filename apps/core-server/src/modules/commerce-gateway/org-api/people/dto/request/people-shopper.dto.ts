import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

/**
 * Which storefront's basket a staff write touches.
 *
 * Required rather than inferred: a person may hold a basket in several of the organization's
 * storefronts, and guessing which one an edit meant would silently change the wrong shop's basket.
 */
export class PeopleCartWriteDto {
  @ApiProperty({ description: 'The storefront app credential whose basket this is' })
  @IsUUID()
  appId: string;
}

export class AddPersonCartItemDto extends PeopleCartWriteDto {
  @ApiProperty({ description: 'Which of their baskets to add to — one per outlet they shop at' })
  @IsUUID()
  cartId: string;

  @ApiProperty({ description: 'The offering variant to add — the listing carrying it is resolved server-side' })
  @IsUUID()
  offeringVariantId: string;

  @ApiProperty({ description: 'How many, 1–99', example: 1 })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class UpdatePersonCartItemDto extends PeopleCartWriteDto {
  @ApiProperty({ description: 'The exact quantity to set, 1–99', example: 2 })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

/** A delete carries no body, so the storefront it belongs to travels as a query parameter. */
export class RemovePersonCartItemQueryDto {
  @ApiProperty({ description: 'The storefront app credential whose basket this is' })
  @IsUUID()
  appId: string;
}

/**
 * The currency a basket or saved list is priced in.
 *
 * Optional, defaulting to INR — these storefronts sell in India, and a staff screen should not fail
 * to render because nobody passed one.
 */
export class PeopleShopperQueryDto {
  @ApiPropertyOptional({ description: 'ISO 4217 currency to price the rows in', example: 'INR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;
}

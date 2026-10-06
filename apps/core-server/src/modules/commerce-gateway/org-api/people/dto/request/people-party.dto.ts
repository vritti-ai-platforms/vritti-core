import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class PeopleCartWriteDto {
  @ApiProperty({ description: 'The storefront app credential whose basket this is' })
  @IsUUID('7')
  appId: string;
}

export class AddPersonCartItemDto extends PeopleCartWriteDto {
  @ApiProperty({ description: 'Which of their baskets to add to — one per outlet they shop at' })
  @IsUUID('7')
  cartId: string;

  @ApiProperty({ description: 'The offering variant to add — the listing carrying it is resolved server-side' })
  @IsUUID('7')
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

export class RemovePersonCartItemQueryDto {
  @ApiProperty({ description: 'The storefront app credential whose basket this is' })
  @IsUUID('7')
  appId: string;
}

export class PeopleShopperQueryDto {
  @ApiPropertyOptional({ description: 'ISO 4217 currency to price the rows in', example: 'INR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CartsQueryDto {
  @ApiPropertyOptional({ description: 'ISO 4217 the basket is priced in', example: 'INR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;
}

export class OpenCartDto {
  @ApiProperty({ description: 'The shopper this basket is for — every basket belongs to one.' })
  @IsUUID()
  partyId: string;
}

export class AddCartLineDto {
  @ApiProperty({ description: 'The shopper whose basket this is — the response is their whole list' })
  @IsUUID()
  partyId: string;

  @ApiProperty({ description: 'The product. Which catalogue offers it is resolved from this outlet.' })
  @IsUUID()
  offeringVariantId: string;

  @ApiProperty({ description: 'How many, 1–99', example: 1 })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class UpdateCartLineDto {
  @ApiProperty()
  @IsUUID()
  partyId: string;

  @ApiProperty({ description: 'The exact quantity to set, 1–99', example: 2 })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class RemoveCartLineQueryDto extends CartsQueryDto {
  @ApiProperty()
  @IsUUID()
  partyId: string;
}

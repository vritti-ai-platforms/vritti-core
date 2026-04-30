import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';

export class PriceListItemAssignmentDto {
  @ApiProperty({ description: 'Item variant ID' })
  @IsUUID()
  itemVariantId: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Whether the item is visible on POS terminal', default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Price override for this price list item (minor units)', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceOverride?: number | null;
}

export class SavePriceListItemsDto {
  @ApiProperty({ type: [PriceListItemAssignmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListItemAssignmentDto)
  items: PriceListItemAssignmentDto[];
}

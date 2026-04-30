import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';

export class PriceListItemAssignmentDto {
  @IsUUID()
  itemVariantId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceOverride?: number | null;
}

export class SavePriceListItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListItemAssignmentDto)
  items: PriceListItemAssignmentDto[];
}

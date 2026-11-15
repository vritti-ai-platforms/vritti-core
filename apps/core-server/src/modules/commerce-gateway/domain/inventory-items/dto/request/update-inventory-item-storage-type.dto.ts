import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class UpdateInventoryItemStorageTypeDto {
  @ApiPropertyOptional({
    description: 'Most of the item one location of this type holds, counted in `uomId`',
    example: 7,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  maxQuantity?: number;

  @ApiPropertyOptional({ description: 'Unit `maxQuantity` is counted in — the primary unit or one of its conversions' })
  @IsOptional()
  @IsUUID('7')
  uomId?: string;
}

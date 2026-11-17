import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { REPLENISHMENT_METHODS, type ReplenishmentMethod } from '../../constants/stock-status.constants';

export class ReplenishmentDto {
  @ApiProperty({
    description:
      'How the site restocks the item: MANUAL (bought when needed, no levels) or REORDER_POINT (bought when stock falls to the reorder point, up to the maximum)',
    enum: REPLENISHMENT_METHODS,
  })
  @IsIn(REPLENISHMENT_METHODS)
  replenishment: ReplenishmentMethod;

  @ApiPropertyOptional({
    description:
      "With REORDER_POINT, stock kept back for demand spikes, in the item's primary unit; at most the reorder point",
    example: 10,
    minimum: 0,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999_999_999.999)
  safetyStock?: number | null;

  @ApiPropertyOptional({
    description: 'With REORDER_POINT, the on-hand quantity at or below which the site reorders; above 0',
    example: 20,
    minimum: 0,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999_999_999.999)
  reorderPoint?: number | null;

  @ApiPropertyOptional({
    description: 'With REORDER_POINT, the most the site should hold; at least the reorder point',
    example: 100,
    minimum: 0,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999_999_999.999)
  maxStock?: number | null;
}

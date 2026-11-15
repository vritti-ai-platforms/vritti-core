import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateSiteStockLevelsDto {
  @ApiProperty({
    description:
      "On-hand quantity, in the item's primary unit, at or below which the site reorders the item; at most the max level, up to 3 decimals",
    example: 20,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999_999_999.999)
  reorderPoint: number;

  @ApiPropertyOptional({
    description:
      "Quantity, in the item's primary unit, the site keeps in reserve against demand spikes; at most the reorder point, 0 when left out",
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999_999_999.999)
  safetyStock?: number;

  @ApiProperty({
    description: "Most the site should hold, in the item's primary unit; above 0, the ceiling that stops over-ordering",
    example: 100,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999_999_999.999)
  maxStockLevel: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class UpdateInventoryItemUomConversionDto {
  @ApiProperty({
    description: 'Count of the item primary UOM in the ratio. 1 Strip = 14 Each → primaryUomQty=14.',
    example: 14,
  })
  @IsInt()
  @Min(1)
  primaryUomQty: number;

  @ApiProperty({ description: 'Count of the alternative UOM in the ratio. 1 Strip = 14 Each → uomQty=1.', example: 1 })
  @IsInt()
  @Min(1)
  uomQty: number;

  @ApiPropertyOptional({
    description:
      "Weight of one pack of this unit, in grams (g), greater than 0 with up to 3 decimals; null = the conversion factor × the primary unit's value",
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  weight?: number | null;

  @ApiPropertyOptional({
    description:
      "Volume of one pack of this unit, in millilitres (ml), greater than 0 with up to 3 decimals; null = the conversion factor × the primary unit's value",
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  volume?: number | null;

  @ApiPropertyOptional({
    description:
      'Length of one pack of this unit, in millimetres (mm), greater than 0 with up to 3 decimals; null = the pack is not fit-checked',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  length?: number | null;

  @ApiPropertyOptional({
    description:
      'Width of one pack of this unit, in millimetres (mm), greater than 0 with up to 3 decimals; null = the pack is not fit-checked',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  width?: number | null;

  @ApiPropertyOptional({
    description:
      'Height of one pack of this unit, in millimetres (mm), greater than 0 with up to 3 decimals; null = the pack is not fit-checked',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  height?: number | null;
}

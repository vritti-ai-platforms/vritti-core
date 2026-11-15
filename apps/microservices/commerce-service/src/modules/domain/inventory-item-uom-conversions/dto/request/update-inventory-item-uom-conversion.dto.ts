import { IsInt, IsNumber, IsOptional, IsPositive, IsUUID, Max, Min } from 'class-validator';

const MAX_MEASURE = 999_999_999.999;

export class UpdateInventoryItemUomConversionDto {
  @IsUUID('7')
  id: string;

  @IsInt()
  @Min(1)
  primaryUomQty: number;

  @IsInt()
  @Min(1)
  uomQty: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(MAX_MEASURE)
  weight?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(MAX_MEASURE)
  volume?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(MAX_MEASURE)
  length?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(MAX_MEASURE)
  width?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(MAX_MEASURE)
  height?: number | null;
}

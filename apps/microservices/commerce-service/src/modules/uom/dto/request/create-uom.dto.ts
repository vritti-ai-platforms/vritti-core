import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateUomDto {
  @IsUUID()
  dimensionId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  symbol: string;

  @IsOptional()
  @IsUUID()
  baseUnitId?: string;

  // Integer pair: `uomQty` units of THIS UOM = `baseUomQty` units of the dimension base UOM.
  // Example for 1 Box = 12 Each → baseUomQty=12, uomQty=1.
  // Both default to 1 (no conversion) when omitted.
  @IsOptional()
  @IsInt()
  @IsPositive()
  baseUomQty?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  uomQty?: number;

  @IsOptional()
  @IsBoolean()
  allowDecimal?: boolean;
}

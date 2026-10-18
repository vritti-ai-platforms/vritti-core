import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateUomDto {
  @IsUUID('7')
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
  @IsUUID('7')
  baseUnitId?: string;

  // Integer pair: `uomQty` units of THIS UOM = `baseUomQty` units of the dimension base UOM.
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

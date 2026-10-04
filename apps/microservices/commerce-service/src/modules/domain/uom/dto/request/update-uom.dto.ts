import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateUomDto {
  @IsUUID('7')
  id: string;

  @IsOptional()
  @IsUUID('7')
  dimensionId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  symbol?: string;

  @IsOptional()
  @IsUUID('7')
  baseUnitId?: string | null;

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

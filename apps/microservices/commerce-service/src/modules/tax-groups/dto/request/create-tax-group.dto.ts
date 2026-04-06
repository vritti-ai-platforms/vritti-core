import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaxGroupDto {
  @IsUUID()
  organizationId: string;

  @IsUUID()
  businessUnitId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  rate: number;

  @IsOptional()
  @IsString()
  hsnSacCode?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  cgstRate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  sgstRate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  igstRate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  cessRate?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

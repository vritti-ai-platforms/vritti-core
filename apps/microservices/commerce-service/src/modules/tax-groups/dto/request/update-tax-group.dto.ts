import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTaxGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  rate?: number;

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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTaxGroupDto {
  @ApiPropertyOptional({ description: 'Updated tax group name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated combined tax rate' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  rate?: number;

  @ApiPropertyOptional({ description: 'Updated HSN/SAC code' })
  @IsOptional()
  @IsString()
  hsnSacCode?: string;

  @ApiPropertyOptional({ description: 'Updated CGST rate' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  cgstRate?: number;

  @ApiPropertyOptional({ description: 'Updated SGST rate' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  sgstRate?: number;

  @ApiPropertyOptional({ description: 'Updated IGST rate' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  igstRate?: number;

  @ApiPropertyOptional({ description: 'Updated cess rate' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  cessRate?: number;

  @ApiPropertyOptional({ description: 'Updated default status' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Updated active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Updated display sort order' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

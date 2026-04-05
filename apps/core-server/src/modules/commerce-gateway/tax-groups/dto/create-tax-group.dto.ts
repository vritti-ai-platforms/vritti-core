import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaxGroupDto {
  @ApiProperty({ description: 'Business unit ID this tax group belongs to' })
  @IsUUID()
  businessUnitId: string;

  @ApiProperty({ description: 'Tax group name', example: 'GST 18%' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Combined tax rate', example: 18 })
  @IsNumber({ maxDecimalPlaces: 2 })
  rate: number;

  @ApiPropertyOptional({ description: 'HSN/SAC code', example: '99631100' })
  @IsOptional()
  @IsString()
  hsnSacCode?: string;

  @ApiPropertyOptional({ description: 'CGST rate', example: 9, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  cgstRate?: number;

  @ApiPropertyOptional({ description: 'SGST rate', example: 9, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  sgstRate?: number;

  @ApiPropertyOptional({ description: 'IGST rate', example: 0, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  igstRate?: number;

  @ApiPropertyOptional({ description: 'Cess rate', example: 0, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  cessRate?: number;

  @ApiPropertyOptional({ description: 'Whether this is the default tax group', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

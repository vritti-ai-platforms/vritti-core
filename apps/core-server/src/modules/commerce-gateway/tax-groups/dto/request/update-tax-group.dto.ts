import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UpdateTaxRateDto {
  @ApiPropertyOptional({ description: 'Tax rate name', example: 'CGST' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 9 })
  @IsNumber({ maxDecimalPlaces: 2 })
  rate: number;

  @ApiPropertyOptional({ description: 'Rate type', enum: ['inclusive', 'exclusive'] })
  @IsEnum(['inclusive', 'exclusive'])
  type: string;
}

export class UpdateTaxGroupDto {
  @ApiPropertyOptional({ description: 'Updated tax group name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated tax rates (replaces all existing rates)', type: [UpdateTaxRateDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTaxRateDto)
  taxRates?: UpdateTaxRateDto[];

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

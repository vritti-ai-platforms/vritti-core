import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UpdateTaxRateDto {
  @ApiPropertyOptional({ description: 'Tax rate name', example: 'CGST' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 9 })
  @IsNumber({ maxDecimalPlaces: 2 })
  rate: number;
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

  @ApiPropertyOptional({ description: 'Updated active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

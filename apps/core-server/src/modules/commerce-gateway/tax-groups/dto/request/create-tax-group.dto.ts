import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateTaxRateDto {
  @ApiProperty({ description: 'Tax rate name', example: 'CGST' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Tax rate percentage', example: 9 })
  @IsNumber({ maxDecimalPlaces: 2 })
  rate: number;
}

export class CreateTaxGroupDto {
  @ApiProperty({ description: 'Tax group name', example: 'GST 18%' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Tax rates for this group', type: [CreateTaxRateDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaxRateDto)
  taxRates?: CreateTaxRateDto[];

  @ApiPropertyOptional({ description: 'Whether this is the default tax group', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

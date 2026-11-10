import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import {
  IsBoolean,
  IsIn,
  IsISO31661Alpha2,
  IsOptional,
  IsString,
  IsUppercase,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateTaxComponentDto {
  @ApiPropertyOptional({
    description: 'Uppercase ISO 3166-1 alpha-2 country; fixed once a tax-group rate uses the component',
    example: 'IN',
  })
  @IsOptional()
  @IsISO31661Alpha2()
  @IsUppercase()
  countryCode?: string;

  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Human-readable name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Taxing authority level',
    enum: ['FEDERAL', 'STATE', 'COUNTY', 'CITY', 'SPECIAL'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['FEDERAL', 'STATE', 'COUNTY', 'CITY', 'SPECIAL'])
  authorityLevel?: string;

  @ApiPropertyOptional({
    description:
      'Component of the same country this one replaces where it has a rate of its own — e.g. UTGST stands in for SGST in a Union Territory. Null clears it.',
    nullable: true,
    example: '019a0000-0000-7000-8000-000000000000',
  })
  @IsOptional()
  @IsUUID('7')
  standsInForId?: string | null;

  @ApiPropertyOptional({ description: 'Whether the tax is recoverable (input credit)' })
  @IsOptional()
  @IsBoolean()
  isRecoverable?: boolean;

  @ApiPropertyOptional({ description: 'Whether the tax is a withholding tax' })
  @IsOptional()
  @IsBoolean()
  isWithholding?: boolean;
}

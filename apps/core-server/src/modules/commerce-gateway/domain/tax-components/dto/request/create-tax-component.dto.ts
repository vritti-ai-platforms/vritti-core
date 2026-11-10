import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import {
  IsBoolean,
  IsIn,
  IsISO31661Alpha2,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUppercase,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateTaxComponentDto {
  @ApiProperty({ description: 'Uppercase ISO 3166-1 alpha-2 country whose tax the component is', example: 'IN' })
  @IsISO31661Alpha2()
  @IsUppercase()
  countryCode: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Code, unique within the country', example: 'cgst' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Human-readable name', example: 'GST Standard' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Taxing authority level',
    enum: ['FEDERAL', 'STATE', 'COUNTY', 'CITY', 'SPECIAL'],
    example: 'STATE',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['FEDERAL', 'STATE', 'COUNTY', 'CITY', 'SPECIAL'])
  authorityLevel: string;

  @ApiPropertyOptional({
    description:
      'Component of the same country this one replaces where it has a rate of its own — e.g. UTGST stands in for SGST in a Union Territory. Null clears it.',
    nullable: true,
    example: '019a0000-0000-7000-8000-000000000000',
  })
  @IsOptional()
  @IsUUID('7')
  standsInForId?: string | null;

  @ApiProperty({ description: 'Whether the tax is recoverable (input credit)' })
  @IsBoolean()
  isRecoverable: boolean;

  @ApiProperty({ description: 'Whether the tax is a withholding tax' })
  @IsBoolean()
  isWithholding: boolean;

  @ApiProperty({ description: 'Whether the tax component is selectable' })
  @IsBoolean()
  isActive: boolean;
}

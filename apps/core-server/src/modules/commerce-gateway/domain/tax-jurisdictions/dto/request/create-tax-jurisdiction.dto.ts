import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, IsCountry, Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTaxJurisdictionDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Unique code within the org', example: 'us-ca' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Human-readable name', example: 'California' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Hierarchy level of the jurisdiction',
    enum: ['COUNTRY', 'STATE', 'COUNTY', 'CITY', 'DISTRICT'],
    example: 'STATE',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['COUNTRY', 'STATE', 'COUNTY', 'CITY', 'DISTRICT'])
  level: string;

  @ApiPropertyOptional({ description: 'Parent jurisdiction ID (for nested jurisdictions)' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiProperty({ description: 'ISO 3166-1 alpha-2 country code', example: 'US' })
  @IsCountry()
  countryCode: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Region/state code within the country' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  regionCode?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Tax union the jurisdiction belongs to (e.g. EU, GCC)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxUnion?: string | null;

  @ApiProperty({ description: 'Whether the jurisdiction is active' })
  @IsBoolean()
  isActive: boolean;
}

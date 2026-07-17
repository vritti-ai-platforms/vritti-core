import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsCountry, Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateTaxJurisdictionDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Human-readable name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Hierarchy level of the jurisdiction',
    enum: ['COUNTRY', 'STATE', 'COUNTY', 'CITY', 'DISTRICT'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['COUNTRY', 'STATE', 'COUNTY', 'CITY', 'DISTRICT'])
  level?: string;

  @ApiPropertyOptional({ description: 'Parent jurisdiction ID (for nested jurisdictions)' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-2 country code' })
  @IsOptional()
  @IsCountry()
  countryCode?: string;

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

  @ApiPropertyOptional({ description: 'Whether the jurisdiction is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

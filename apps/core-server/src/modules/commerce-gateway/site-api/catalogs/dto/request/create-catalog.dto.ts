import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCatalogDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Catalog name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Whether catalog prices are tax-inclusive', default: false })
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;

  @ApiPropertyOptional({ description: 'Whether the catalog is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sales channel IDs to map to this catalog', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  channelIds?: string[];
}

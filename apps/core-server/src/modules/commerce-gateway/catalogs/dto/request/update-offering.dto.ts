import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateOfferingDto {
  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ description: 'Variant option (axis) IDs this offering varies along', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  variantOptionIds?: string[];

  @ApiPropertyOptional({ description: 'Fulfilment type', enum: ['STOCK', 'SERVICE', 'COMPOSITE'] })
  @IsOptional()
  @IsEnum(['STOCK', 'SERVICE', 'COMPOSITE'])
  fulfilmentType?: string;

  @ApiPropertyOptional({ description: 'Updated offering name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ description: 'Sales tax group ID' })
  @IsUUID()
  salesTaxGroupId: string;

  @ApiPropertyOptional({ description: 'Whether the offering is available' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Display sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

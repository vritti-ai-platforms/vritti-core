import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class SupplierItemPriceHistoryQueryDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Sites to include (comma-separated or repeated); all when omitted',
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : String(value).split(',').filter(Boolean)))
  @IsArray()
  @IsUUID('7', { each: true })
  siteIds?: string[];

  @ApiPropertyOptional({ description: 'Only windows still in force on or after this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Only windows starting on or before this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

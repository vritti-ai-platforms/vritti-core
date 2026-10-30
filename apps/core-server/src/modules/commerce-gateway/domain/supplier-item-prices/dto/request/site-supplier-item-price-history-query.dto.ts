import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class SiteSupplierItemPriceHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Only windows still in force on or after this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Only windows starting on or before this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

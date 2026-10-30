import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsDateString, IsOptional } from 'class-validator';

export class InventoryItemPriceOptionsQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Only options with a price still in force on or after this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Only options with a price starting on or before this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

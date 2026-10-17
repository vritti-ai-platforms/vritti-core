import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsBoolean, IsOptional } from 'class-validator';

export class SetItemVisibilityDto {
  @ApiProperty({ description: 'False excludes the item from this channel' })
  @IsBoolean()
  availableHere: boolean;

  @ApiPropertyOptional({
    example: 'USD',
    description: 'Excludes it from callers asking in this currency only; omit to exclude it outright',
  })
  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;
}

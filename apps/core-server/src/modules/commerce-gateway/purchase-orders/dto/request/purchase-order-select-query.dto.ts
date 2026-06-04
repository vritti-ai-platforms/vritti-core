import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk';
import { IsOptional, IsString } from 'class-validator';

export class PurchaseOrderSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({
    description: 'Optional status filter. Accepts a single value or comma-separated list.',
    example: 'CONFIRMED,PARTIALLY_RECEIVED',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Optional supplier filter', example: '86dc66cf-d1a0-4016-8f5e-1c1fd889c384' })
  @IsOptional()
  @IsString()
  supplierId?: string;
}

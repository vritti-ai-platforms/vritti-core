import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk';
import { IsOptional, IsString } from 'class-validator';

export class PurchaseOrderSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Optional status filter', example: 'CONFIRMED' })
  @IsOptional()
  @IsString()
  status?: string;
}

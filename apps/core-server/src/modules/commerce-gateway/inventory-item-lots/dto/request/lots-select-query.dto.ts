import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk';
import { IsOptional, IsUUID } from 'class-validator';

export class LotsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Filter lots to a specific inventory item' })
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;
}

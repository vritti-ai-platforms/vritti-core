import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { PURCHASE_EVENT_KINDS, type PurchaseEventKind } from '../../constants/purchase.constants';

export class PurchaseEventsQueryDto {
  @ApiPropertyOptional({ description: 'Events to return', minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 50;

  @ApiPropertyOptional({ description: 'Newest events to skip', minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @ApiPropertyOptional({ description: 'Only the events of this kind', enum: PURCHASE_EVENT_KINDS })
  @IsOptional()
  @IsIn(PURCHASE_EVENT_KINDS)
  kind?: PurchaseEventKind;

  @ApiPropertyOptional({ description: 'Only the events of this supplier leg' })
  @IsOptional()
  @IsUUID('7')
  purchaseSupplierId?: string;
}

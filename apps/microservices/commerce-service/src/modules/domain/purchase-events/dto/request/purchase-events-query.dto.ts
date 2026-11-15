import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { type PurchaseEventKind, PurchaseEventKindValues } from '../entity/purchase-event.dto';

export const PURCHASE_EVENTS_PAGE_SIZE = 50;
export const PURCHASE_EVENTS_PAGE_SIZE_MAX = 200;

export class PurchaseEventsQueryDto {
  @IsUUID('7')
  id: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PURCHASE_EVENTS_PAGE_SIZE_MAX)
  limit: number = PURCHASE_EVENTS_PAGE_SIZE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @IsOptional()
  @IsIn(Object.values(PurchaseEventKindValues))
  kind?: PurchaseEventKind;

  @IsOptional()
  @IsUUID('7')
  purchaseSupplierId?: string;
}

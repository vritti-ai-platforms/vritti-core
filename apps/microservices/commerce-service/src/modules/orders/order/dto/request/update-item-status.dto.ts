import { IsEnum, IsUUID } from 'class-validator';
import { OrderItemStatusValues } from '@/db/schema';

export class UpdateItemStatusDto {
  @IsUUID()
  itemId: string;

  @IsEnum(OrderItemStatusValues)
  status: string;
}

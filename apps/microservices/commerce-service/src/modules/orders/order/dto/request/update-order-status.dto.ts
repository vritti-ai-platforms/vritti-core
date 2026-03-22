import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatusValues } from '@/db/schema';

export class UpdateOrderStatusDto {
  @IsUUID()
  id: string;

  @IsEnum(OrderStatusValues)
  status: string;
}

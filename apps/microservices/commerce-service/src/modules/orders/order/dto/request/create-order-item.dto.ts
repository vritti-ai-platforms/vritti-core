import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  name: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  stationId?: string;
}

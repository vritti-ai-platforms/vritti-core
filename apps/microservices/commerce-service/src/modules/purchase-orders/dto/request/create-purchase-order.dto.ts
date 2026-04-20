import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { IsZonedIsoDateString } from '@vritti/api-sdk';

export class CreatePurchaseOrderDto {
  @IsUUID()
  supplierId: string;

  @IsNotEmpty()
  @IsString()
  orderDate: string;

  @IsOptional()
  @IsZonedIsoDateString()
  expectedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGoodsReceiptFromDeliveryDto {
  @IsUUID('7')
  inboundDeliveryId: string;

  @IsDateString()
  receivedDate: string;

  @Trim()
  @IsOptional()
  @IsString()
  notes?: string | null;
}

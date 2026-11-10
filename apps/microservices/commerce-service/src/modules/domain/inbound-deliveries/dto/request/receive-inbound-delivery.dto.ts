import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class ReceiveInboundDeliveryDto {
  @IsUUID('7')
  id: string;

  @IsDateString()
  receivedDate: string;

  @Trim()
  @IsOptional()
  @IsString()
  notes?: string | null;
}

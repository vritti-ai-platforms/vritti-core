import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateLegGoodsReceiptDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  legId: string;

  @IsOptional()
  @IsUUID('7')
  inboundDeliveryId?: string;

  @IsDateString()
  receivedDate: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierDeliveryNoteNumber?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'supplierDeliveryNoteDate must be YYYY-MM-DD' })
  supplierDeliveryNoteDate?: string | null;
}

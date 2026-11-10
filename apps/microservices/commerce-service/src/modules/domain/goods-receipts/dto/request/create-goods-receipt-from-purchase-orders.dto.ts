import { Trim } from '@vritti/api-sdk/decorators';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateGoodsReceiptFromPurchaseOrdersDto {
  @IsUUID('7')
  supplierId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('7', { each: true })
  purchaseOrderIds: string[];

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  carrier?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierDeliveryNoteNumber?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'supplierDeliveryNoteDate must be YYYY-MM-DD' })
  supplierDeliveryNoteDate?: string | null;

  @IsDateString()
  receivedDate: string;

  @Trim()
  @IsOptional()
  @IsString()
  notes?: string | null;
}

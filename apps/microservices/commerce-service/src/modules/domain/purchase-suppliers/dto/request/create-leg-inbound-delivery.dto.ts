import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class LegInboundDeliveryLineDto {
  @IsUUID('7')
  purchaseOrderItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity: number;
}

export class CreateLegInboundDeliveryDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  legId: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expectedDeliveryDate must be YYYY-MM-DD' })
  expectedDeliveryDate: string;

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

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((line: LegInboundDeliveryLineDto) => line.purchaseOrderItemId)
  @ValidateNested({ each: true })
  @Type(() => LegInboundDeliveryLineDto)
  lines: LegInboundDeliveryLineDto[];
}

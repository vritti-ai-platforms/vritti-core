import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Supplier the goods arrived from' })
  @IsUUID('7')
  supplierId: string;

  @ApiProperty({
    type: [String],
    description:
      "The supplier's confirmed or partially received purchase orders at one site; every open line of each is received at its open quantity",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('7', { each: true })
  purchaseOrderIds: string[];

  @Trim()
  @ApiPropertyOptional({ description: 'Carrier that brought the goods', nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  carrier?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: "Carrier's tracking number", nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string | null;

  @Trim()
  @ApiPropertyOptional({
    description:
      "Number on the supplier's delivery note (challan); unique per supplier across non-cancelled deliveries, case-insensitive",
    nullable: true,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierDeliveryNoteNumber?: string | null;

  @ApiPropertyOptional({
    description: "Date on the supplier's delivery note (YYYY-MM-DD)",
    nullable: true,
    example: '2026-11-08',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'supplierDeliveryNoteDate must be YYYY-MM-DD' })
  supplierDeliveryNoteDate?: string | null;

  @ApiProperty({ description: 'Date the goods were received (ISO string)', example: '2026-11-08' })
  @IsDateString()
  receivedDate: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

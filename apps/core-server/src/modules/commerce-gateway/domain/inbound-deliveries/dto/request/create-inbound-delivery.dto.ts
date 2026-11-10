import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateInboundDeliveryDto {
  @ApiProperty({ description: 'Supplier announcing the delivery; it must be enrolled and purchasable at the site' })
  @IsUUID('7')
  supplierId: string;

  @ApiProperty({ description: 'Date the goods are expected at the site (YYYY-MM-DD)', example: '2026-11-15' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expectedDeliveryDate must be YYYY-MM-DD' })
  expectedDeliveryDate: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Carrier bringing the goods', nullable: true, maxLength: 100 })
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
    description: "Date on the supplier's delivery note (YYYY-MM-DD); not after the expected delivery date",
    nullable: true,
    example: '2026-11-08',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'supplierDeliveryNoteDate must be YYYY-MM-DD' })
  supplierDeliveryNoteDate?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

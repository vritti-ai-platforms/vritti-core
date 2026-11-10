import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateInboundDeliveryDto {
  @ApiPropertyOptional({
    description: 'New expected date (YYYY-MM-DD); the PO lines on the delivery follow it',
    example: '2026-11-18',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expectedDeliveryDate must be YYYY-MM-DD' })
  expectedDeliveryDate?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Carrier bringing the goods; null clears it', nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  carrier?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: "Carrier's tracking number; null clears it", nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string | null;

  @Trim()
  @ApiPropertyOptional({
    description:
      "Number on the supplier's delivery note (challan); unique per supplier across non-cancelled deliveries, case-insensitive; null clears it",
    nullable: true,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierDeliveryNoteNumber?: string | null;

  @ApiPropertyOptional({
    description:
      "Date on the supplier's delivery note (YYYY-MM-DD), not after the expected delivery date; null clears it",
    nullable: true,
    example: '2026-11-08',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'supplierDeliveryNoteDate must be YYYY-MM-DD' })
  supplierDeliveryNoteDate?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Notes; null clears them', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

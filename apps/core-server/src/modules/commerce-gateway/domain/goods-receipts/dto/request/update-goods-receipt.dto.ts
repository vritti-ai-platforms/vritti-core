import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateGoodsReceiptDto {
  @Trim()
  @ApiPropertyOptional({
    description:
      "Number on the supplier's delivery note (challan), written to the inbound delivery the receipt created; unique per supplier across non-cancelled deliveries, case-insensitive; null clears it",
    nullable: true,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierDeliveryNoteNumber?: string | null;

  @ApiPropertyOptional({
    description:
      "Date on the supplier's delivery note (YYYY-MM-DD), written to the inbound delivery the receipt created; null clears it",
    nullable: true,
    example: '2026-11-08',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'supplierDeliveryNoteDate must be YYYY-MM-DD' })
  supplierDeliveryNoteDate?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Notes of the receipt; null clears them', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

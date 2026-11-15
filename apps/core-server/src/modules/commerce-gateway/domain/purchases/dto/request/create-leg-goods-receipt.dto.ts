import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateLegGoodsReceiptDto {
  @ApiPropertyOptional({
    description:
      "The leg's delivery to receive, not received or cancelled and without a draft receipt; otherwise the open confirmed lines are received",
  })
  @IsOptional()
  @IsUUID('7')
  inboundDeliveryId?: string;

  @ApiProperty({ description: 'When the goods were received (ISO string)', example: '2026-11-11T10:30:00.000Z' })
  @IsDateString()
  receivedDate: string;

  @Trim()
  @ApiPropertyOptional({
    description: "Number on the supplier's delivery note (challan)",
    nullable: true,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierDeliveryNoteNumber?: string | null;

  @ApiPropertyOptional({ description: "Date on the supplier's delivery note (YYYY-MM-DD)", nullable: true })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'supplierDeliveryNoteDate must be YYYY-MM-DD' })
  supplierDeliveryNoteDate?: string | null;
}

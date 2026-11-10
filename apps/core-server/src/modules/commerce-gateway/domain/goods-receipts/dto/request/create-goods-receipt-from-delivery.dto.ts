import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGoodsReceiptFromDeliveryDto {
  @ApiProperty({
    description:
      'Announced inbound delivery of the site, not received or cancelled and without a draft receipt; the receipt carries its open lines',
  })
  @IsUUID('7')
  inboundDeliveryId: string;

  @ApiProperty({ description: 'Date the goods were received (ISO string)', example: '2026-11-08' })
  @IsDateString()
  receivedDate: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

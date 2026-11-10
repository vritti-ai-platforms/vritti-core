import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ReceiveInboundDeliveryDto {
  @ApiProperty({ description: 'Date the goods were received (ISO string)', example: '2026-11-15' })
  @IsDateString()
  receivedDate: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Notes for the goods receipt', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

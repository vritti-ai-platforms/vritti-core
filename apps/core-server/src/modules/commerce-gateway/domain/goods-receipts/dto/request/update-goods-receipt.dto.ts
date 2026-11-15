import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsOptional, IsString } from 'class-validator';

export class UpdateGoodsReceiptDto {
  @Trim()
  @ApiPropertyOptional({ description: 'Notes of the receipt; null clears them', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddGoodsReceiptLineDto {
  @ApiPropertyOptional({
    description: 'Goods-receipt lot id (required for tracking=lot/serial; null for tracking=quantity).',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  goodsReceiptLotId?: string | null;

  @ApiProperty({ description: 'Storage location id where the inventory will land.' })
  @IsUUID()
  locationId: string;

  @ApiProperty({ description: 'Quantity received for this line. For tracking=serial, pass 0 — quantity grows as serials are added.' })
  @IsNumber()
  @Min(0)
  quantity: number;
}

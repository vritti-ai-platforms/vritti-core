import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateGoodsReceiptLineDto {
  @ApiPropertyOptional({ description: 'Goods-receipt lot id', nullable: true })
  @IsOptional()
  @IsUUID()
  goodsReceiptLotId?: string | null;

  @ApiPropertyOptional({ description: 'Storage location id' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Line quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;
}

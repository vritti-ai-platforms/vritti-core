import { CreateLegGoodsReceiptDto } from '@domain/purchase-suppliers/dto/request/create-leg-goods-receipt.dto';
import { IsOptional, IsTimeZone } from 'class-validator';

export class LeCreateLegGoodsReceiptDto extends CreateLegGoodsReceiptDto {
  // The purchase's site timezone, which a purchase order created here is dated in
  @IsOptional()
  @IsTimeZone()
  timezone?: string;
}

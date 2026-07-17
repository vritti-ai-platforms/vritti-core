import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateGoodsReceiptLotDto {
  @IsUUID()
  goodsReceiptId: string;

  @IsUUID()
  itemId: string;

  @IsUUID()
  lotId: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lotNumber?: string;

  @IsOptional()
  @IsDateString()
  manufacturingDate?: string | null;

  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  expiryDate?: string;

  @IsOptional()
  @IsNumberString()
  mrp?: string | null;
}

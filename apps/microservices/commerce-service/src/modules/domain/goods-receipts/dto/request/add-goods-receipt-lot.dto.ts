import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AddGoodsReceiptLotDto {
  @IsUUID('7')
  goodsReceiptId: string;

  @IsUUID('7')
  itemId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lotNumber: string;

  @IsOptional()
  @IsDateString()
  manufacturingDate?: string | null;

  @IsDateString()
  @IsNotEmpty()
  expiryDate: string;

  @IsOptional()
  @IsNumberString()
  mrp?: string | null;
}

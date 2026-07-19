import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsNumber, IsNumberString, IsOptional, IsPositive, IsString, IsUUID, Min } from 'class-validator';

export class AddGoodsReceiptItemFromPurchaseOrderItemDto {
  @IsUUID()
  goodsReceiptId: string;

  @IsUUID()
  purchaseOrderItemId: string;

  @IsNumber()
  @IsPositive()
  orderedQty: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  // Printed MRP object forwarded by the gateway; accepted for whitelisting but not consumed here.
  @IsOptional()
  @IsCurrency()
  mrp?: CurrencyAmountDto | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  schemeBuyQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  schemeFreeQty?: number;

  @IsOptional()
  @IsBoolean()
  hasScheme?: boolean;

  @IsOptional()
  @IsNumberString()
  unitPrice?: string;

  @IsOptional()
  @IsString()
  currencyCode?: string;
}

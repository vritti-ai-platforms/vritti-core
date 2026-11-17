import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsPositive, IsUUID, Matches, Min } from 'class-validator';

export class AddPurchaseOrderItemDto {
  @IsUUID('7')
  purchaseOrderId: string;

  @IsUUID('7')
  inventoryItemId: string;

  // One of the item's units; the supplier's item in it, when there is one, defaults the scheme and delivery
  @IsUUID('7')
  uomId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  uomQty: number;

  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  conversionRate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number;

  @IsOptional()
  @IsBoolean()
  hasScheme?: boolean;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expectedDeliveryDate must be YYYY-MM-DD' })
  expectedDeliveryDate?: string;
}

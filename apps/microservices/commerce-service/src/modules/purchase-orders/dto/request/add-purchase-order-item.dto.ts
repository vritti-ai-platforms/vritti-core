import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddPurchaseOrderItemDto {
  @IsUUID()
  inventoryItemId: string;

  @IsUUID()
  uomId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity: number;

  @IsCurrency()
  supplierUnitPrice: CurrencyAmountDto;

  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;
}

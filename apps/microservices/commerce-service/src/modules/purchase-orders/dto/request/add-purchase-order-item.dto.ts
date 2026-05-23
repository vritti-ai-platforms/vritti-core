import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class AddPurchaseOrderItemDto {
  @IsUUID()
  supplierItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity: number;

  @IsCurrency()
  unitPrice: CurrencyAmountDto;
}

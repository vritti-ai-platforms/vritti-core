import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsUUID } from 'class-validator';

export class AddInventoryItemMrpDto {
  @IsUUID()
  inventoryItemId: string;

  @IsUUID()
  uomId: string;

  @IsCurrency()
  amount: CurrencyAmountDto;
}

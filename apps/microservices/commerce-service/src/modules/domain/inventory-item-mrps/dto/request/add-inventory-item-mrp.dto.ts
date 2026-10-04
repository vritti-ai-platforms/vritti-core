import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsUUID } from 'class-validator';

export class AddInventoryItemMrpDto {
  @IsUUID('7')
  inventoryItemId: string;

  @IsUUID('7')
  uomId: string;

  @IsCurrency()
  amount: CurrencyAmountDto;
}

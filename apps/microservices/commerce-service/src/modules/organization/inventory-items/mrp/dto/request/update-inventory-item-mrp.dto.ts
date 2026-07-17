import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsUUID } from 'class-validator';

export class UpdateInventoryItemMrpDto {
  @IsUUID()
  id: string;

  @IsCurrency()
  amount: CurrencyAmountDto;
}

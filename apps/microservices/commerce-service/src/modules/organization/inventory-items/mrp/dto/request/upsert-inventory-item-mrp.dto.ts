import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsOptional, IsUUID } from 'class-validator';

export class UpsertInventoryItemMrpDto {
  @IsUUID()
  inventoryItemId: string;

  @IsCurrency()
  amount: CurrencyAmountDto;

  @IsOptional()
  @IsUUID()
  sourceLotId?: string | null;
}

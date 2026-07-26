import { ApiProperty } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';

export class UpdateInventoryItemMrpDto {
  @ApiProperty({ type: CurrencyAmountDto, description: 'MRP amount (with currency)' })
  @IsCurrency()
  amount: CurrencyAmountDto;
}

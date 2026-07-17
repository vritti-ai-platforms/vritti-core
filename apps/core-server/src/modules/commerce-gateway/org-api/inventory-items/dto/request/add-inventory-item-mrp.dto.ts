import { ApiProperty } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsUUID } from 'class-validator';

export class AddInventoryItemMrpDto {
  @ApiProperty({ description: 'UOM the MRP is quoted in' })
  @IsUUID()
  uomId: string;

  @ApiProperty({ type: CurrencyAmountDto, description: 'MRP amount (with currency)' })
  @IsCurrency()
  amount: CurrencyAmountDto;
}

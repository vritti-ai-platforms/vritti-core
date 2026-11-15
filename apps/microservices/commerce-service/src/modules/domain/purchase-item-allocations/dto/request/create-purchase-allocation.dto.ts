import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsNumber, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';

export class CreatePurchaseAllocationDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  purchaseItemId: string;

  @IsUUID('7')
  supplierId: string;

  @IsUUID('7')
  uomId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  uomQty: number;

  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number;
}

import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsNumber, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';

export class UpdatePurchaseAllocationDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  allocationId: string;

  @IsOptional()
  @IsUUID('7')
  uomId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  uomQty?: number;

  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number | null;
}

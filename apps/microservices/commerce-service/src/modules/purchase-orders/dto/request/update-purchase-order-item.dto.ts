import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdatePurchaseOrderItemDto {
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsCurrency()
  supplierUnitPrice?: CurrencyAmountDto;

  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

}

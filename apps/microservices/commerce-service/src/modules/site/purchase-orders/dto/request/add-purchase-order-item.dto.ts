import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddPurchaseOrderItemDto {
  @IsUUID()
  supplierItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  uomQty: number;

  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  // Free-goods scheme override; prefilled from the supplier item, editable at PO creation.
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasScheme?: boolean;
}

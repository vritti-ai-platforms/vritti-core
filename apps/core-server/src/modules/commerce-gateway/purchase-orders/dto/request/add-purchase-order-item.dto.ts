import { ApiProperty } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class AddPurchaseOrderItemDto {
  @ApiProperty({ description: 'Supplier item ID' })
  @IsUUID()
  supplierItemId: string;

  @ApiProperty({ description: 'Ordered quantity', example: 100 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity: number;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Unit price in PO/supplier currency' })
  @IsCurrency()
  unitPrice: CurrencyAmountDto;
}

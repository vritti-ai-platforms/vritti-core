import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsNumber, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';

export class CreatePurchaseAllocationDto {
  @ApiProperty({ description: 'Item the allocation sources' })
  @IsUUID('7')
  purchaseItemId: string;

  @ApiProperty({ description: 'Enrolled supplier the quantity is sourced from' })
  @IsUUID('7')
  supplierId: string;

  @ApiProperty({ description: 'Unit the quantity is bought in' })
  @IsUUID('7')
  uomId: string;

  @ApiProperty({ description: 'Quantity in that unit', example: 10 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  uomQty: number;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Price per unit; may be left out for the direct purchase types, where the supplier invoice sets it',
  })
  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty (e.g. 9 in "9+1")' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1")' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsNumber, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';

export class UpdatePurchaseAllocationDto {
  @ApiPropertyOptional({ description: 'Unit the quantity is bought in' })
  @IsOptional()
  @IsUUID('7')
  uomId?: string;

  @ApiPropertyOptional({ description: 'Quantity in that unit', example: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  uomQty?: number;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Price per unit; null clears it for the direct purchase types',
    nullable: true,
  })
  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto | null;

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

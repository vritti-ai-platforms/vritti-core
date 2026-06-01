import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsIn, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export type FreeSchemeMode = 'none' | 'slab' | 'pro_rata';
const FREE_SCHEME_MODES: FreeSchemeMode[] = ['none', 'slab', 'pro_rata'];

export class AddPurchaseOrderItemDto {
  @ApiProperty({ description: 'Supplier item ID' })
  @IsUUID()
  supplierItemId: string;

  @ApiProperty({ description: 'Ordered uomQty', example: 100 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  uomQty: number;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Unit price in PO/supplier currency' })
  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  @ApiPropertyOptional({
    description: 'Free-goods scheme buy qty (e.g. 9 in "9+1"). Prefilled from the supplier item.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number;

  @ApiPropertyOptional({ enum: FREE_SCHEME_MODES, description: 'How free qty is derived: slab or pro_rata.' })
  @IsOptional()
  @IsIn(FREE_SCHEME_MODES)
  schemeMode?: FreeSchemeMode;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export type FreeSchemeMode = 'none' | 'slab' | 'pro_rata';
const FREE_SCHEME_MODES: FreeSchemeMode[] = ['none', 'slab', 'pro_rata'];

export class BulkSetSupplierItemSchemeDto {
  @ApiProperty({ type: [String], description: 'Supplier item IDs to apply the scheme to.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  supplierItemIds: string[];

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty (e.g. 9 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number;

  @ApiProperty({ enum: FREE_SCHEME_MODES, description: 'How free qty is derived: none, slab or pro_rata.' })
  @IsIn(FREE_SCHEME_MODES)
  schemeMode: FreeSchemeMode;
}

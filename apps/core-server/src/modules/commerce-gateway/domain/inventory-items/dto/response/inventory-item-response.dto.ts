import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  sku: string;

  @ApiProperty({ enum: ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'] })
  type: string;

  @ApiProperty({ enum: ['QUANTITY', 'LOT', 'LOT_SERIAL', 'SERIAL'] })
  tracking: 'QUANTITY' | 'LOT' | 'LOT_SERIAL' | 'SERIAL';

  @ApiProperty({ enum: ['NONE', 'FIFO', 'FEFO'], default: 'NONE' })
  pickStrategy: 'NONE' | 'FIFO' | 'FEFO';

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  categoryName: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  uomId: string;

  @ApiProperty()
  uomSymbol: string;

  @ApiProperty({ description: "Whether the item's primary unit can be counted in fractions" })
  uomAllowDecimal: boolean;

  @ApiProperty({ description: 'Unit the item is displayed in; its primary unit until changed' })
  displayUomId: string;

  @ApiProperty()
  displayUomSymbol: string;

  @ApiPropertyOptional({
    description: 'Tax class override, or null when inheriting the category default',
    nullable: true,
  })

  @ApiPropertyOptional({ description: 'HSN code for tax reporting', nullable: true })
  hsnCode: string | null;

  @ApiProperty({ description: 'Tax class the goods are bought under' })
  taxClassId: string;

  @ApiProperty()
  taxClassName: string;

  @ApiProperty({
    description: 'Weight of one primary unit, in grams (g); null when not maintained',
    type: Number,
    nullable: true,
  })
  weight: number | null;

  @ApiProperty({
    description: 'Volume of one primary unit, in millilitres (ml); null when not maintained',
    type: Number,
    nullable: true,
  })
  volume: number | null;

  @ApiProperty({
    description: 'Length of one primary unit, in millimetres (mm); null when not maintained',
    type: Number,
    nullable: true,
  })
  length: number | null;

  @ApiProperty({
    description: 'Width of one primary unit, in millimetres (mm); null when not maintained',
    type: Number,
    nullable: true,
  })
  width: number | null;

  @ApiProperty({
    description: 'Height of one primary unit, in millimetres (mm); null when not maintained',
    type: Number,
    nullable: true,
  })
  height: number | null;

  @ApiProperty({ description: 'Whether this item can be deleted' })
  canDelete: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

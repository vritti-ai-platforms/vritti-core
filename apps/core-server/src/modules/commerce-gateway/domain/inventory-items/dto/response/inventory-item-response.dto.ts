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

  @ApiPropertyOptional({ nullable: true })
  categoryName: string | null;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  uomId: string;

  @ApiPropertyOptional({ nullable: true })
  uomSymbol: string | null;

  @ApiPropertyOptional({
    description: 'Tax class override, or null when inheriting the category default',
    nullable: true,
  })

  @ApiPropertyOptional({ description: 'HSN code for tax reporting', nullable: true })
  hsnCode: string | null;

  @ApiProperty({ description: 'Tax class the goods are bought under' })
  taxClassId: string;

  @ApiPropertyOptional({ nullable: true })
  taxClassName: string | null;

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

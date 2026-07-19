import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ enum: ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'] })
  type: string;

  @ApiProperty({ enum: ['quantity', 'lot', 'lot_serial', 'serial'] })
  tracking: 'quantity' | 'lot' | 'lot_serial' | 'serial';

  @ApiProperty({ enum: ['none', 'fifo', 'fefo'], default: 'none' })
  pickStrategy: 'none' | 'fifo' | 'fefo';

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
  taxClassId: string | null;

  @ApiPropertyOptional({ description: 'HSN code for tax reporting', nullable: true })
  hsnCode: string | null;

  @ApiProperty({ description: 'Whether this item can be deleted' })
  canDelete: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

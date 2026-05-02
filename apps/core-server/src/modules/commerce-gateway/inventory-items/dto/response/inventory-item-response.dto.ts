import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ enum: ['MATERIAL', 'PRODUCT'] })
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

  @ApiProperty({ description: 'Whether this item can be deleted' })
  canDelete: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

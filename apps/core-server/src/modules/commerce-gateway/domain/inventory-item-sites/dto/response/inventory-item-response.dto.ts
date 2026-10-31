import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class SiteInventoryItemResponseDto {
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

  @ApiProperty({ description: 'Tax class the goods are bought under' })
  taxClassId: string;

  @ApiPropertyOptional({ nullable: true })
  taxClassName: string | null;

  @ApiPropertyOptional({ description: 'HSN sku for tax reporting', nullable: true })
  hsnCode: string | null;

  @ApiPropertyOptional({ type: () => CurrencyAmountDto, description: 'Default MRP (site currency)', nullable: true })
  defaultMrp: CurrencyAmountDto | null;

  @ApiProperty({ description: 'Whether this item can be deleted' })
  canDelete: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

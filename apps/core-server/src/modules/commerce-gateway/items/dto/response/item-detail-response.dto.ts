import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemOptionValueResponseDto {
  @ApiProperty({ description: 'Option value ID' })
  id: string;

  @ApiProperty({ description: 'Value text' })
  value: string;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;
}

export class ItemOptionResponseDto {
  @ApiProperty({ description: 'Option ID' })
  id: string;

  @ApiProperty({ description: 'Option name' })
  name: string;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Option values', type: [ItemOptionValueResponseDto] })
  values: ItemOptionValueResponseDto[];
}

export class ItemVariantResponseDto {
  @ApiProperty({ description: 'Variant ID' })
  id: string;

  @ApiProperty({ description: 'SKU code' })
  sku: string;

  @ApiProperty({ description: 'Variant name' })
  name: string;

  @ApiProperty({ description: 'Variant price' })
  price: string;

  @ApiProperty({ description: 'Whether the variant is available' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Whether inventory is managed' })
  manageInventory: boolean;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Linked option value IDs', type: [String] })
  optionValueIds: string[];

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

export class ItemDetailResponseDto {
  @ApiProperty({ description: 'Item ID' })
  id: string;

  @ApiProperty({ description: 'Business unit ID' })
  businessUnitId: string;

  @ApiPropertyOptional({ description: 'Category ID', nullable: true })
  categoryId: string | null;

  @ApiPropertyOptional({ description: 'Category name', nullable: true })
  categoryName: string | null;

  @ApiProperty({ description: 'Item type', enum: ['PRODUCT', 'SERVICE'] })
  type: string;

  @ApiProperty({ description: 'Item code' })
  code: string;

  @ApiProperty({ description: 'Item name' })
  name: string;

  @ApiPropertyOptional({ description: 'Item description', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ description: 'Tax group ID', nullable: true })
  taxGroupId: string | null;

  @ApiProperty({ description: 'Whether the item is available' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Display sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Item options', type: [ItemOptionResponseDto] })
  options: ItemOptionResponseDto[];

  @ApiProperty({ description: 'Item variants', type: [ItemVariantResponseDto] })
  variants: ItemVariantResponseDto[];

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

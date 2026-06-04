import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk';

export class OfferingOptionValueResponseDto {
  @ApiProperty({ description: 'Option value ID' })
  id: string;

  @ApiProperty({ description: 'Value text' })
  value: string;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;
}

export class OfferingOptionResponseDto {
  @ApiProperty({ description: 'Option ID' })
  id: string;

  @ApiProperty({ description: 'Option name' })
  name: string;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Option values', type: [OfferingOptionValueResponseDto] })
  values: OfferingOptionValueResponseDto[];
}

export class VariantComponentResponseDto {
  @ApiProperty({ description: 'Inventory item ID drawn down by this variant' })
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Inventory item name', nullable: true })
  inventoryItemName: string | null;

  @ApiProperty({ description: 'Quantity of the inventory item (in its stocking UOM)' })
  quantity: number;
}

export class OfferingVariantResponseDto {
  @ApiProperty({ description: 'Variant ID' })
  id: string;

  @ApiProperty({ description: 'SKU code' })
  sku: string;

  @ApiProperty({ description: 'Variant name' })
  name: string;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Variant price in the catalog currency (major units)' })
  price: CurrencyAmountDto;

  @ApiProperty({ description: 'Whether the variant is available' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Inventory components drawn down on sale', type: [VariantComponentResponseDto] })
  components: VariantComponentResponseDto[];

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Linked option value IDs', type: [String] })
  optionValueIds: string[];

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

export class OfferingDetailResponseDto {
  @ApiProperty({ description: 'Offering ID' })
  id: string;

  @ApiProperty({ description: 'Business unit ID' })
  businessUnitId: string;

  @ApiPropertyOptional({ description: 'Category ID', nullable: true })
  categoryId: string | null;

  @ApiPropertyOptional({ description: 'Category name', nullable: true })
  categoryName: string | null;

  @ApiPropertyOptional({ description: 'Human-readable category breadcrumb path', nullable: true })
  categoryPath: string | null;

  @ApiProperty({ description: 'Fulfilment type', enum: ['STOCK', 'SERVICE', 'COMPOSITE'] })
  fulfilmentType: string;

  @ApiProperty({ description: 'Offering name' })
  name: string;

  @ApiPropertyOptional({ description: 'Offering description', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ description: 'Sales tax group ID', nullable: true })
  salesTaxGroupId: string | null;

  @ApiProperty({ description: 'Catalog currency code (ISO 4217)' })
  currencyCode: string;

  @ApiProperty({ description: 'Whether the offering is available' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Display sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Offering options', type: [OfferingOptionResponseDto] })
  options: OfferingOptionResponseDto[];

  @ApiProperty({ description: 'Offering variants', type: [OfferingVariantResponseDto] })
  variants: OfferingVariantResponseDto[];

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

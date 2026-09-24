import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OfferingVariantValueRefResponseDto {
  @ApiProperty() dimensionId: string;
  @ApiProperty() dimensionName: string;
  @ApiProperty() valueId: string;
  @ApiProperty() value: string;
  @ApiProperty() valueCode: string;
}

export class OfferingBomLineResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() variantId: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() inventoryItemName: string;
  @ApiProperty() inventoryItemSku: string;
  @ApiProperty() quantity: number;
  @ApiProperty() uomId: string;
  @ApiProperty() uomName: string;
  @ApiProperty() sortOrder: number;
}

export class OfferingVariantResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() offeringId: string;
  @ApiProperty({
    description: 'Derived from the offering code and value codes; never edited',
    example: 'tshirt-classic-m-red',
  })
  sku: string;
  @ApiPropertyOptional({ nullable: true, description: 'Manufacturer part number or GTIN — the stable identifier' })
  externalSku: string | null;
  @ApiProperty() name: string;
  @ApiProperty() salesUomId: string;
  @ApiPropertyOptional({ nullable: true }) salesUomName: string | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty() sortOrder: number;
  @ApiProperty({ type: [OfferingVariantValueRefResponseDto] }) values: OfferingVariantValueRefResponseDto[];
  @ApiProperty({ type: [OfferingBomLineResponseDto] }) bom: OfferingBomLineResponseDto[];
  @ApiProperty() bomLineCount: number;
  @ApiProperty({ description: "Whether the bill of materials satisfies this variant's fulfilment type" })
  canMarkActive: boolean;
  @ApiProperty({
    enum: ['STOCK', 'ASSEMBLY', 'COMPOSITE', 'SERVICE'],
    description: "Follows the offering's unless pinned — a variety pack inside a stock offering is composite",
  })
  fulfilmentType: string;
  @ApiProperty({ description: 'Pinned to this variant, so an offering-level change no longer cascades to it' })
  isFulfilmentOverridden: boolean;
  @ApiProperty({ description: 'False once the variant appears on an order line' })
  canDelete: boolean;
  @ApiProperty({ description: "Follows the offering's tax class unless overridden" })
  taxClassId: string;
  @ApiPropertyOptional({ nullable: true }) taxClassName: string | null;
  @ApiProperty({ description: 'Pinned to this variant, so an offering-level change no longer cascades to it' })
  isTaxClassOverridden: boolean;
  @ApiPropertyOptional({
    nullable: true,
    description: "The inventory item already carrying this variant's SKU, when one exists",
  })
  inventoryItem: { id: string; name: string; uomId: string } | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

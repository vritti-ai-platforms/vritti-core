import { PriceWindowResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-item-price-history-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemSupplierPriceHistoryResponseDto {
  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Supplier item the prices belong to' })
  supplierItemId: string;

  @ApiProperty({ description: 'Supplier name' })
  supplierName: string;

  @ApiProperty({ description: 'Supplier code' })
  supplierCode: string;

  @ApiPropertyOptional({
    description: 'Unit the supplier quotes in; the windows are converted from it',
    nullable: true,
  })
  quotedUomSymbol: string | null;

  @ApiPropertyOptional({ type: PriceWindowResponseDto, description: 'Price in force today', nullable: true })
  current: PriceWindowResponseDto | null;

  @ApiPropertyOptional({
    type: PriceWindowResponseDto,
    description: 'The window the current one replaced',
    nullable: true,
  })
  previous: PriceWindowResponseDto | null;

  @ApiPropertyOptional({ type: PriceWindowResponseDto, description: 'The next scheduled window', nullable: true })
  next: PriceWindowResponseDto | null;

  @ApiProperty({ type: [PriceWindowResponseDto], description: 'Every window, oldest first, per the primary unit' })
  windows: PriceWindowResponseDto[];
}

export class InventoryItemPriceHistoryResponseDto {
  @ApiPropertyOptional({
    description: 'Site the prices are at; null when the item has no prices anywhere',
    nullable: true,
  })
  siteId: string | null;

  @ApiPropertyOptional({ description: "The item's primary unit; every price is per this unit", nullable: true })
  uomSymbol: string | null;

  @ApiProperty({
    type: [ItemSupplierPriceHistoryResponseDto],
    description:
      'The suppliers drawn: the ones asked for, or by default the preferred then most recently priced; at most 8',
  })
  suppliers: ItemSupplierPriceHistoryResponseDto[];

  @ApiProperty({ description: 'Every supplier with a price for the item at the site within the window' })
  supplierCount: number;
}

export class PriceGraphSelectionResponseDto {
  @ApiPropertyOptional({
    description: 'Site the graph is at; null when the item has no prices anywhere',
    nullable: true,
  })
  siteId: string | null;

  @ApiProperty({ description: 'Start of the window (YYYY-MM-DD)' })
  from: string;

  @ApiProperty({ description: 'End of the window (YYYY-MM-DD)' })
  to: string;

  @ApiProperty({ type: [String], description: 'Suppliers picked; empty when the server chose the ones drawn' })
  supplierIds: string[];

  @ApiProperty({ type: [String], description: 'MRPs the prices are narrowed to; empty means any' })
  mrpIds: string[];

  @ApiPropertyOptional({ description: 'Currency picked for the chart', nullable: true })
  currency: string | null;
}

export class InventoryItemPriceGraphResponseDto extends InventoryItemPriceHistoryResponseDto {
  @ApiProperty({ type: PriceGraphSelectionResponseDto, description: 'What the graph shows, from its saved state' })
  selection: PriceGraphSelectionResponseDto;
}

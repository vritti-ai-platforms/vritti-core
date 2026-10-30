import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class ItemSupplierPriceComparisonResponseDto {
  @ApiProperty() supplierItemId: string;
  @ApiProperty() supplierId: string;
  @ApiProperty() supplierName: string;
  @ApiProperty() supplierCode: string;

  @ApiPropertyOptional({ description: 'Unit the supplier quotes the item in', nullable: true })
  quotedUomSymbol: string | null;

  @ApiProperty({ description: 'Whether the supplier is preferred for the item at the site' })
  isPreferred: boolean;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Price in force on the date, per the quoted unit',
    nullable: true,
  })
  currentPrice: CurrencyAmountDto | null;

  @ApiPropertyOptional({ description: 'Start of the price in force (YYYY-MM-DD)', nullable: true })
  currentFrom: string | null;

  @ApiPropertyOptional({ description: 'End of the price in force; null when open-ended', nullable: true })
  currentTo: string | null;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Price in force after the free-goods scheme, per the quoted unit',
    nullable: true,
  })
  effectivePrice: CurrencyAmountDto | null;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: "Price in force per the item's primary unit",
    nullable: true,
  })
  pricePerPrimary: CurrencyAmountDto | null;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Price per primary unit after the free-goods scheme: price × buy ÷ (buy + free)',
    nullable: true,
  })
  effectivePricePerPrimary: CurrencyAmountDto | null;

  @ApiPropertyOptional({ nullable: true }) schemeBuyQty: number | null;
  @ApiPropertyOptional({ nullable: true }) schemeFreeQty: number | null;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'MRP the price in force was agreed against',
    nullable: true,
  })
  mrp: CurrencyAmountDto | null;

  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Price the current one replaced', nullable: true })
  previousPrice: CurrencyAmountDto | null;

  @ApiPropertyOptional({ description: 'Move from the previous price in percent, same currency only', nullable: true })
  changePercent: number | null;

  @ApiProperty({ description: 'Price windows on record at the site' })
  priceCount: number;
}

export class ItemSupplierPriceComparisonTableResponseDto extends TableResponseDto<ItemSupplierPriceComparisonResponseDto> {
  @ApiProperty({ type: [ItemSupplierPriceComparisonResponseDto] })
  declare result: ItemSupplierPriceComparisonResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;

  @ApiProperty({ type: [String], description: 'Sites the item has supplier prices at — the sites the table can show' })
  siteIds: string[];

  @ApiPropertyOptional({
    description: 'Site the table shows when none is picked: the first priced site in site order',
    nullable: true,
  })
  defaultSiteId: string | null;

  @ApiPropertyOptional({
    description: 'Site the rows are at: the one asked for when priced there, else the default',
    nullable: true,
  })
  siteId: string | null;
}

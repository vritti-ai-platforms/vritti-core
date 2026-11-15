import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class PurchaseQuotationItemResponseDto {
  @ApiProperty({ description: 'Quotation line ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Item the line quotes for', type: String, nullable: true })
  purchaseItemId: string | null;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiProperty({ description: 'Unit the price is quoted in' })
  uomId: string;

  @ApiPropertyOptional({ description: 'Symbol of that unit', type: String, nullable: true })
  uomSymbol: string | null;

  @ApiProperty({ type: () => CurrencyAmountDto, description: 'Quoted price per unit' })
  unitPrice: CurrencyAmountDto;

  @ApiProperty({ type: () => CurrencyAmountDto, description: 'Quoted price per primary unit of the item' })
  unitPricePerPrimary: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty', type: Number, nullable: true })
  schemeBuyQty: number | null;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty', type: Number, nullable: true })
  schemeFreeQty: number | null;
}

export class PurchaseQuotationResponseDto {
  @ApiProperty({ description: 'Supplier quotation ID' })
  id: string;

  @ApiProperty({ description: 'Quotation number' })
  quotationNumber: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Supplier name' })
  supplierName: string;

  @ApiProperty({ description: "Whether it is posted to the purchase's site or its whole legal entity" })
  isPosted: boolean;

  @ApiProperty({ description: 'First day the prices hold (YYYY-MM-DD)' })
  validFrom: string;

  @ApiPropertyOptional({ description: 'Last day the prices hold (YYYY-MM-DD)', type: String, nullable: true })
  validTo: string | null;

  @ApiProperty({ description: 'Currency the quotation is in', example: 'INR' })
  currencyCode: string;

  @ApiProperty({ description: 'Lines with a price' })
  pricedItemCount: number;

  @ApiProperty({ description: 'Lines on the quotation' })
  itemCount: number;

  @ApiProperty({ type: [PurchaseQuotationItemResponseDto], description: 'Quotation lines' })
  items: PurchaseQuotationItemResponseDto[];
}

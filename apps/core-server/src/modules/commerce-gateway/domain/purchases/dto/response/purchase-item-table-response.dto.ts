import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { PURCHASE_ITEM_PROBLEM_CODES, type PurchaseItemProblemCode } from '../../constants/purchase.constants';
import { PurchaseQuotationItemResponseDto } from './purchase-quotation-response.dto';
import { PurchaseSourcingAllocationResponseDto } from './purchase-sourcing-item-response.dto';

export class PurchaseItemSupplierProgressResponseDto {
  @ApiProperty({ description: 'Purchase supplier (leg) ID' })
  legId: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Supplier name' })
  supplierName: string;

  @ApiProperty({ description: 'Quantity allocated to the supplier, in primary units' })
  allocated: number;

  @ApiProperty({ description: "Quantity on the supplier's live purchase orders" })
  ordered: number;

  @ApiProperty({ description: "Quantity on the supplier's open inbound deliveries, not yet received" })
  inTransit: number;

  @ApiProperty({ description: 'Quantity received from the supplier, net of returns' })
  received: number;

  @ApiProperty({ description: 'Quantity the supplier invoiced' })
  invoiced: number;
}

export class PurchaseItemProblemResponseDto {
  @ApiProperty({ enum: PURCHASE_ITEM_PROBLEM_CODES, description: 'What stops the item being bought' })
  code: PurchaseItemProblemCode;

  @ApiProperty({ example: 'Purchasing is blocked at this site: Recalled batch' })
  detail: string;
}

export class PurchaseItemTableRowResponseDto {
  @ApiProperty({ description: 'Purchase item ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiProperty({ description: 'Inventory item code' })
  inventoryItemCode: string;

  @ApiProperty({ description: "The item's category" })
  categoryName: string;

  @ApiProperty({ description: "Symbol of the item's primary unit" })
  primaryUomSymbol: string;

  @ApiProperty({ description: "Quantity needed, in the item's primary unit" })
  primaryQty: number;

  @ApiProperty({ description: 'Quantity allocated to suppliers' })
  allocatedPrimaryQty: number;

  @ApiProperty({ description: 'Quantity on live purchase orders' })
  orderedPrimaryQty: number;

  @ApiProperty({ description: 'Quantity on open inbound deliveries, not yet received' })
  inTransitPrimaryQty: number;

  @ApiProperty({ description: 'Quantity received, net of returns' })
  receivedPrimaryQty: number;

  @ApiProperty({ description: 'Quantity invoiced' })
  invoicedPrimaryQty: number;

  @ApiProperty({ description: 'Suppliers with a posted quotation for it, valid today' })
  quotingSupplierCount: number;

  @ApiProperty({
    type: [PurchaseItemSupplierProgressResponseDto],
    description: 'Suppliers it is allocated to, by name, with how far each share has got',
  })
  suppliers: PurchaseItemSupplierProgressResponseDto[];

  @ApiProperty({
    type: [PurchaseItemProblemResponseDto],
    description: 'What needs attention before the item can be bought, such as the site having blocked buying it',
  })
  problems: PurchaseItemProblemResponseDto[];

  @ApiProperty({
    description: "Whether the purchase's site buys it only from what the legal entity set up as its suppliers' items",
  })
  supplierItemsRequired: boolean;

  @ApiPropertyOptional({ description: 'Date the item is needed by (YYYY-MM-DD)', type: String, nullable: true })
  neededBy: string | null;

  @ApiPropertyOptional({ description: 'Notes', type: String, nullable: true })
  notes: string | null;
}

export class PurchaseItemTableResponseDto extends TableResponseDto<PurchaseItemTableRowResponseDto> {
  @ApiProperty({ type: [PurchaseItemTableRowResponseDto] })
  declare result: PurchaseItemTableRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

export class PurchaseItemFacetsResponseDto {
  @ApiProperty({ description: 'Every item' })
  ALL: number;

  @ApiProperty({ description: 'Items with quantity still to allocate' })
  NOT_ALLOCATED: number;

  @ApiProperty({ description: 'Items still to allocate that lack the required quotations' })
  NEEDS_QUOTATIONS: number;

  @ApiProperty({ description: 'Items allocated but not ordered' })
  ALLOCATED: number;

  @ApiProperty({ description: 'Items ordered but not on their way' })
  ORDERED: number;

  @ApiProperty({ description: 'Items on their way' })
  IN_TRANSIT: number;

  @ApiProperty({ description: 'Items received but not invoiced' })
  RECEIVED: number;

  @ApiProperty({ description: 'Items fully invoiced' })
  INVOICED: number;
}

export class PurchaseItemQuoteResponseDto {
  @ApiProperty({ description: 'Supplier quotation ID' })
  quotationId: string;

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

  @ApiProperty({ type: () => PurchaseQuotationItemResponseDto, description: 'The line that quotes the item' })
  line: PurchaseQuotationItemResponseDto;
}

export class PurchaseItemComparisonResponseDto {
  @ApiProperty({ type: () => PurchaseItemTableRowResponseDto })
  item: PurchaseItemTableRowResponseDto;

  @ApiProperty({
    type: [PurchaseItemQuoteResponseDto],
    description: 'Quotation lines quoting the item, cheapest per primary unit first within each currency',
  })
  quotes: PurchaseItemQuoteResponseDto[];

  @ApiProperty({
    type: [PurchaseSourcingAllocationResponseDto],
    description: "The item's allocations, across suppliers",
  })
  allocations: PurchaseSourcingAllocationResponseDto[];
}

export class PurchaseItemComparisonTableResponseDto extends TableResponseDto<PurchaseItemComparisonResponseDto> {
  @ApiProperty({ type: [PurchaseItemComparisonResponseDto] })
  declare result: PurchaseItemComparisonResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

import { ItemSiteStockResponseDto } from '@commerce/inventory-items/dto/response/site-item-row-response.dto';
import {
  PURCHASE_ORDER_STATUSES,
  type PurchaseOrderStatus,
} from '@commerce/purchase-orders/dto/response/purchase-order-response.dto';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { PURCHASE_ITEM_DOCUMENT_TYPES, type PurchaseItemDocumentType } from '../../constants/purchase.constants';
import { PurchaseItemResponseDto } from './purchase-item-response.dto';
import {
  PurchaseItemProblemResponseDto,
  PurchaseItemQuoteResponseDto,
  PurchaseItemSupplierProgressResponseDto,
} from './purchase-item-table-response.dto';
import { PurchaseSourcingAllocationResponseDto } from './purchase-sourcing-item-response.dto';

export class PurchaseItemViewResponseDto extends PurchaseItemResponseDto {
  @ApiProperty({ description: "The item's category" })
  categoryName: string;

  @ApiProperty({ description: "The item's tax class" })
  taxClassName: string;

  @ApiProperty({ description: "Whether the item's primary unit can be counted in fractions" })
  primaryUomAllowDecimal: boolean;

  @ApiProperty({
    type: [PurchaseItemProblemResponseDto],
    description: "What stops the item being bought, such as the purchase's site having blocked buying it",
  })
  problems: PurchaseItemProblemResponseDto[];

  @ApiProperty({
    description: "Whether the purchase's site buys it only from what the legal entity set up as its suppliers' items",
  })
  supplierItemsRequired: boolean;
}

export class PurchaseItemCountsResponseDto {
  @ApiProperty({ description: "The item's allocations, across suppliers" })
  allocationCount: number;

  @ApiProperty({ description: "Quotation lines of the purchase's quotations that quote the item" })
  quoteCount: number;

  @ApiProperty({ description: 'Document lines that move the item: PO lines, deliveries, receipts and invoices' })
  documentCount: number;
}

export class PurchaseItemProgressResponseDto {
  @ApiProperty({ description: 'Quantity needed, in the primary unit' })
  primaryQty: number;

  @ApiProperty({ description: 'Quantity allocated to suppliers' })
  allocatedPrimaryQty: number;

  @ApiProperty({ description: 'Quantity on live purchase orders, free goods included' })
  orderedPrimaryQty: number;

  @ApiProperty({ description: 'Quantity on open inbound deliveries not yet received' })
  inTransitPrimaryQty: number;

  @ApiProperty({ description: 'Quantity received, net of returns' })
  receivedPrimaryQty: number;

  @ApiProperty({ description: 'Quantity invoiced' })
  invoicedPrimaryQty: number;

  @ApiProperty({
    type: [PurchaseItemSupplierProgressResponseDto],
    description: 'The same, per supplier the item is allocated to',
  })
  suppliers: PurchaseItemSupplierProgressResponseDto[];
}

export class PurchaseItemAllocationRowResponseDto extends PurchaseSourcingAllocationResponseDto {
  @ApiPropertyOptional({ description: 'Number of the purchase order it became', type: String, nullable: true })
  poNumber: string | null;

  @ApiPropertyOptional({ description: 'Status of that purchase order', enum: PURCHASE_ORDER_STATUSES, nullable: true })
  poStatus: PurchaseOrderStatus | null;

  @ApiPropertyOptional({
    description: 'Received on its PO line net of returns, in the primary unit',
    type: Number,
    nullable: true,
  })
  receivedPrimaryQty: number | null;

  @ApiPropertyOptional({ description: 'Invoiced on its PO line, in the primary unit', type: Number, nullable: true })
  invoicedPrimaryQty: number | null;
}

export class PurchaseItemAllocationTableResponseDto extends TableResponseDto<PurchaseItemAllocationRowResponseDto> {
  @ApiProperty({ type: [PurchaseItemAllocationRowResponseDto] })
  declare result: PurchaseItemAllocationRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

export class PurchaseItemQuoteRowResponseDto extends PurchaseItemQuoteResponseDto {
  @ApiProperty({
    description: 'Cheapest per primary unit in its currency among the posted quotes valid today',
  })
  isLowest: boolean;
}

export class PurchaseItemQuoteTableResponseDto extends TableResponseDto<PurchaseItemQuoteRowResponseDto> {
  @ApiProperty({ type: [PurchaseItemQuoteRowResponseDto] })
  declare result: PurchaseItemQuoteRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

export class PurchaseItemDocumentResponseDto {
  @ApiProperty({ description: 'Document line ID' })
  lineId: string;

  @ApiProperty({ enum: PURCHASE_ITEM_DOCUMENT_TYPES })
  type: PurchaseItemDocumentType;

  @ApiProperty({ description: 'Document ID' })
  documentId: string;

  @ApiProperty({ example: 'PO-202611-0031' })
  documentNumber: string;

  @ApiProperty({ description: "The document's status", example: 'CONFIRMED' })
  status: string;

  @ApiProperty({ description: 'Ordered, expected, received or invoiced on (YYYY-MM-DD)' })
  date: string;

  @ApiProperty()
  supplierId: string;

  @ApiProperty()
  supplierName: string;

  @ApiProperty({ description: 'Quantity on the line, in the primary unit' })
  primaryQty: number;
}

export class PurchaseItemDocumentTableResponseDto extends TableResponseDto<PurchaseItemDocumentResponseDto> {
  @ApiProperty({ type: [PurchaseItemDocumentResponseDto] })
  declare result: PurchaseItemDocumentResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

export class PurchaseItemSiteStockResponseDto extends OmitType(ItemSiteStockResponseDto, ['matchesFilter'] as const) {}

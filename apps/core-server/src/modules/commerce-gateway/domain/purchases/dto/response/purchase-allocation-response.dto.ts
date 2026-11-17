import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class PurchaseAllocationResponseDto {
  @ApiProperty({ description: 'Allocation ID' })
  id: string;

  @ApiProperty({ description: 'Item the allocation sources' })
  purchaseItemId: string;

  @ApiProperty({ description: 'Leg the allocation belongs to' })
  purchaseSupplierId: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiPropertyOptional({ description: 'Quotation line the allocation came from', type: String, nullable: true })
  supplierQuotationItemId: string | null;

  @ApiPropertyOptional({ description: 'Number of that quotation', type: String, nullable: true })
  quotationNumber: string | null;

  @ApiProperty({ description: 'Unit the quantity is bought in' })
  uomId: string;

  @ApiProperty({ description: 'Symbol of that unit' })
  uomSymbol: string;

  @ApiProperty({ description: 'Quantity in that unit' })
  uomQty: number;

  @ApiProperty({ description: "Quantity in the item's primary unit" })
  primaryUomQty: number;

  @ApiProperty({
    type: () => CurrencyAmountDto,
    description: 'Price per unit; zero when unpriced, which only the direct purchase types allow',
  })
  unitPrice: CurrencyAmountDto;

  @ApiProperty({ description: 'Whether the allocation has a price' })
  isPriced: boolean;

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty', type: Number, nullable: true })
  schemeBuyQty: number | null;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty', type: Number, nullable: true })
  schemeFreeQty: number | null;

  @ApiProperty({ description: 'Whether a free-goods scheme applies' })
  hasScheme: boolean;

  @ApiProperty({ description: "Free quantity the scheme gives, in the item's primary unit" })
  freePrimaryQty: number;

  @ApiPropertyOptional({ description: 'Purchase order line ordering it', type: String, nullable: true })
  purchaseOrderItemId: string | null;

  @ApiPropertyOptional({ description: 'Purchase order of that line', type: String, nullable: true })
  purchaseOrderId: string | null;

  @ApiProperty({
    description: "Confirmed order line quantity not yet on a non-cancelled delivery, in the allocation's unit",
  })
  openForInboundDeliveryQty: number;
}

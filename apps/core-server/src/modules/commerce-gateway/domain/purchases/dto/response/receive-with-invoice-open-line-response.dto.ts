import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { PURCHASE_TYPES, type PurchaseType } from '../../constants/purchase.constants';

export class ReceiveWithInvoiceOpenLineResponseDto {
  @ApiProperty({ description: 'Allocation still open to receive and invoice' })
  allocationId: string;

  @ApiProperty({ description: 'Purchase the allocation belongs to' })
  purchaseId: string;

  @ApiProperty({ description: 'Number of that purchase', example: 'PUR-202611-0001' })
  purchaseNumber: string;

  @ApiProperty({ description: 'Leg the allocation belongs to' })
  purchaseSupplierId: string;

  @ApiProperty({ description: "The leg's purchase type", enum: PURCHASE_TYPES })
  legType: PurchaseType;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiProperty({ description: 'Whether a batch number and expiry are required' })
  isLotTracked: boolean;

  @ApiProperty({ description: "The allocation's unit" })
  uomId: string;

  @ApiProperty({ description: 'Symbol of that unit' })
  uomSymbol: string;

  @ApiProperty({ description: "Symbol of the item's primary unit" })
  primaryUomSymbol: string;

  @ApiProperty({ description: "Quantity allocated, in the allocation's unit" })
  allocatedQty: number;

  @ApiProperty({ description: "Quantity already received, in the allocation's unit" })
  receivedQty: number;

  @ApiProperty({ description: "Quantity still open, in the allocation's unit" })
  openQty: number;

  @ApiProperty({
    type: () => CurrencyAmountDto,
    description: "The allocation's price per unit; zero when unpriced and the invoice sets it",
  })
  unitPrice: CurrencyAmountDto;

  @ApiProperty({ description: 'Whether the allocation has a price' })
  isPriced: boolean;

  @ApiPropertyOptional({
    description: 'Purchase order line ordering it, for a leg that orders first',
    type: String,
    nullable: true,
  })
  purchaseOrderItemId: string | null;

  @ApiPropertyOptional({
    description:
      'Why it cannot be received: it has no purchase order line yet and the site has blocked buying the item; null when it can',
    type: String,
    nullable: true,
    example: 'Recalled batch',
  })
  orderBlockedReason: string | null;
}

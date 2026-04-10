import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemModifierResponseDto {
  @ApiProperty({ description: 'Modifier ID' })
  id: string;

  @ApiProperty({ description: 'Modifier display name' })
  name: string;

  @ApiProperty({ description: 'Additional price for this modifier' })
  additionalPrice: number;
}

export class OrderItemResponseDto {
  @ApiProperty({ description: 'Order item ID' })
  id: string;

  @ApiProperty({ description: 'Denormalized item name' })
  itemName: string;

  @ApiPropertyOptional({ description: 'Denormalized variant name', nullable: true })
  variantName: string | null;

  @ApiProperty({ description: 'Quantity ordered' })
  quantity: number;

  @ApiProperty({ description: 'Unit price at time of order' })
  unitPrice: number;

  @ApiProperty({ description: 'Tax rate applied' })
  taxRate: number;

  @ApiProperty({ description: 'Tax amount for this line item' })
  taxAmount: number;

  @ApiProperty({ description: 'Subtotal before tax' })
  subtotal: number;

  @ApiProperty({ description: 'Total including tax' })
  total: number;

  @ApiPropertyOptional({ description: 'Special instructions', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Applied modifiers', type: [OrderItemModifierResponseDto] })
  modifiers: OrderItemModifierResponseDto[];
}

export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Sequential order number', example: 'ORD-00001' })
  orderNumber: string;

  @ApiProperty({ description: 'Order type', example: 'DINE_IN' })
  type: string;

  @ApiProperty({ description: 'Order channel', example: 'WALK_IN' })
  channel: string;

  @ApiProperty({ description: 'Current order status', example: 'PENDING' })
  status: string;

  @ApiPropertyOptional({ description: 'Customer name', nullable: true })
  customerName: string | null;

  @ApiPropertyOptional({ description: 'Customer phone', nullable: true })
  customerPhone: string | null;

  @ApiProperty({ description: 'Subtotal before tax and charges' })
  subtotal: number;

  @ApiProperty({ description: 'Total tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Service charge' })
  serviceCharge: number;

  @ApiProperty({ description: 'Delivery charge' })
  deliveryCharge: number;

  @ApiProperty({ description: 'Discount amount' })
  discountAmount: number;

  @ApiProperty({ description: 'Final total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'ISO timestamp when order was placed' })
  placedAt: string;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

export class OrderDetailResponseDto extends OrderResponseDto {
  @ApiPropertyOptional({ description: 'Delivery address', nullable: true })
  deliveryAddress: string | null;

  @ApiPropertyOptional({ description: 'Order notes', nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ description: 'External order ID from aggregator', nullable: true })
  externalOrderId: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp when order was confirmed', nullable: true })
  confirmedAt: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp when order was ready', nullable: true })
  readyAt: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp when order was completed', nullable: true })
  completedAt: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp when order was cancelled', nullable: true })
  cancelledAt: string | null;

  @ApiPropertyOptional({ description: 'Cancellation reason', nullable: true })
  cancellationReason: string | null;

  @ApiProperty({ description: 'Order line items with modifiers', type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];
}

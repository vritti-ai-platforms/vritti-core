import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockAdjustmentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'SA-2026-0001' }) code: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() inventoryItemName: string;
  @ApiProperty() inventoryItemUomId: string;
  @ApiProperty() inventoryItemUomSymbol: string;
  @ApiProperty({ enum: ['quantity', 'lot', 'lot_serial', 'serial'] }) inventoryItemTracking:
    | 'quantity'
    | 'lot'
    | 'lot_serial'
    | 'serial';
  @ApiProperty({ example: 'WASTE' }) type: string;
  @ApiProperty({ description: 'Sum of stock_adjustment_lines.quantity' }) totalQuantity: number;
  @ApiProperty({ example: 'DRAFT' }) status: string;
  @ApiPropertyOptional({ nullable: true }) reason: string | null;
  @ApiProperty() isPublishable: boolean;
  @ApiProperty() metadata: Record<string, unknown>;
  @ApiPropertyOptional({ nullable: true }) publishedAt: string | null;
  @ApiProperty() createdAt: string;
}

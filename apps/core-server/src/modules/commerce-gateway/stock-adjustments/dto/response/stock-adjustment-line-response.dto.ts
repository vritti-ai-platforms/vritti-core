import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockAdjustmentLineResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() stockAdjustmentId: string;
  @ApiProperty() createdById: string;

  // Register intent (OPENING_STOCK):
  @ApiPropertyOptional({ nullable: true }) stockAdjustmentLotId: string | null;
  @ApiPropertyOptional({ nullable: true }) locationId: string | null;
  @ApiPropertyOptional({ nullable: true }) locationName: string | null;

  // Lot info denormalized from stock_adjustment_lots (for display)
  @ApiPropertyOptional({ nullable: true }) lotNumber: string | null;
  @ApiPropertyOptional({ nullable: true }) manufacturingDate: string | null;
  @ApiPropertyOptional({ nullable: true }) expiryDate: string | null;

  // Change intent (deduct/CORRECTION):
  @ApiPropertyOptional({ nullable: true }) quantId: string | null;
  @ApiPropertyOptional({ nullable: true }) quantLotNumber: string | null;
  @ApiPropertyOptional({ nullable: true }) quantLocationId: string | null;
  @ApiPropertyOptional({ nullable: true }) quantLocationName: string | null;
  @ApiPropertyOptional({ nullable: true }) quantTotalQuantity: number | null;
  @ApiPropertyOptional({ nullable: true }) quantReservedQuantity: number | null;
  @ApiPropertyOptional({ nullable: true }) quantAvailableQuantity: number | null;

  @ApiProperty() uomId: string;
  @ApiPropertyOptional({ nullable: true }) uomName: string | null;
  @ApiPropertyOptional({ nullable: true }) uomSymbol: string | null;
  @ApiProperty({ description: 'Snapshot of (line UOM → primary UOM) factor at create/update time' })
  conversionFactor: number;

  @ApiProperty() quantity: number;
  @ApiPropertyOptional({ nullable: true, description: 'Set after publish' })
  resolvedQuantId: string | null;
  @ApiProperty() isBalanced: boolean;
  @ApiProperty() lineItemsCount: number;
  @ApiProperty() metadata: Record<string, unknown>;
  @ApiProperty() createdAt: string;
}

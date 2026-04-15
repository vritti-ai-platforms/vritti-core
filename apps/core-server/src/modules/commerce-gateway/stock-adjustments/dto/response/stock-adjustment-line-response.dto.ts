import { ApiProperty } from '@nestjs/swagger';

export class StockAdjustmentLineResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() stockAdjustmentId: string;
  @ApiProperty() createdById: string;
  @ApiProperty({ nullable: true }) batchId: string | null;
  @ApiProperty({ nullable: true }) batchNumber: string | null;
  @ApiProperty({ nullable: true }) locationId: string | null;
  @ApiProperty({ nullable: true }) locationName: string | null;
  @ApiProperty() quantity: number;
  @ApiProperty() lineItemsCount: number;
  @ApiProperty() lineItemsQuantitySum: number;
  @ApiProperty() lineItemsDelta: number;
  @ApiProperty() isBalanced: boolean;
  @ApiProperty() isLineItemsBalanced: boolean;
  @ApiProperty({ nullable: true }) manufacturingDate: string | null;
  @ApiProperty({ nullable: true }) expiryDate: string | null;
  @ApiProperty() createdAt: string;
}

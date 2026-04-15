import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockAdjustmentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'SA-2026-0001' }) code: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() inventoryItemName: string;
  @ApiProperty() inventoryItemUomSymbol: string;
  @ApiProperty({ example: 'WASTE' }) type: string;
  @ApiProperty({ example: 'DRAFT' }) status: string;
  @ApiPropertyOptional({ nullable: true }) reason: string | null;
  @ApiProperty() createdById: string;
  @ApiProperty() createdByFullName: string;
  @ApiProperty() isPublishable: boolean;
  @ApiPropertyOptional({ nullable: true }) publishedAt: string | null;
  @ApiProperty() createdAt: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockAdjustmentLotDisplayResponseDto } from './stock-adjustment-lot-response.dto';

export class StockAdjustmentLotDetailResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() stockAdjustmentId: string;
  @ApiProperty() lotNumber: string;
  @ApiPropertyOptional({ nullable: true }) manufacturingDate: string | null;
  @ApiPropertyOptional({ nullable: true }) expiryDate: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Set after publish' })
  resolvedLotId: string | null;
  @ApiProperty() linesCount: number;
  @ApiProperty() totalQuantity: number;
  @ApiProperty({ type: [String], description: 'Line ids under this lot, ordered by createdAt' })
  lineIds: string[];
  @ApiProperty() createdAt: string;

  @ApiProperty({
    type: StockAdjustmentLotDisplayResponseDto,
    description: "These quantities in the item's display unit",
  })
  display: StockAdjustmentLotDisplayResponseDto;
}

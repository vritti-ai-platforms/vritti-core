import { DisplayUomQuantityResponseDto } from '@commerce/uom/dto/response/display-uom-quantity-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockAdjustmentLotDisplayResponseDto {
  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  totalQuantity: DisplayUomQuantityResponseDto | null;
}

export class StockAdjustmentLotResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() stockAdjustmentId: string;
  @ApiProperty() lotNumber: string;
  @ApiPropertyOptional({ nullable: true }) manufacturingDate: string | null;
  @ApiPropertyOptional({ nullable: true }) expiryDate: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Set after publish' })
  resolvedLotId: string | null;
  @ApiProperty() linesCount: number;
  @ApiProperty() totalQuantity: number;
  @ApiProperty() createdAt: string;

  @ApiProperty({
    type: StockAdjustmentLotDisplayResponseDto,
    description: "These quantities in the item's display unit",
  })
  display: StockAdjustmentLotDisplayResponseDto;
}

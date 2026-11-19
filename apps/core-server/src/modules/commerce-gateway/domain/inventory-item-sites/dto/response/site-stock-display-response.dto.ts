import { DisplayUomQuantityResponseDto } from '@commerce/uom/dto/response/display-uom-quantity-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SiteStockDisplayResponseDto {
  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  onHand: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  safetyStock: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  reorderPoint: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  maxStock: DisplayUomQuantityResponseDto | null;
}

import { DisplayUomQuantityResponseDto } from '@commerce/uom/dto/response/display-uom-quantity-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SiteStockLocationDisplayResponseDto {
  @ApiProperty({ description: 'Location ID, as in the stock row’s locations' })
  locationId: string;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, description: 'The stock at the location' })
  quantity: DisplayUomQuantityResponseDto;

  @ApiProperty({
    type: DisplayUomQuantityResponseDto,
    description: 'The stock at the location and at every location after it, which holds less',
  })
  withSmaller: DisplayUomQuantityResponseDto;
}

export class SiteStockDisplayResponseDto {
  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  onHand: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  safetyStock: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  reorderPoint: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  maxStock: DisplayUomQuantityResponseDto | null;

  @ApiProperty({
    type: DisplayUomQuantityResponseDto,
    nullable: true,
    description: 'How far the stock on hand is from the safety stock, either way',
  })
  safetyStockGap: DisplayUomQuantityResponseDto | null;

  @ApiProperty({
    type: DisplayUomQuantityResponseDto,
    nullable: true,
    description: 'How far the stock on hand is from the reorder point, either way',
  })
  reorderPointGap: DisplayUomQuantityResponseDto | null;

  @ApiProperty({
    type: DisplayUomQuantityResponseDto,
    nullable: true,
    description: 'How far the stock on hand is from the maximum stock, either way',
  })
  maxStockGap: DisplayUomQuantityResponseDto | null;

  @ApiProperty({
    type: [SiteStockLocationDisplayResponseDto],
    description: 'Each location holding the stock, largest first',
  })
  locations: SiteStockLocationDisplayResponseDto[];
}

import { DisplayUomQuantityResponseDto } from '@commerce/uom/dto/response/display-uom-quantity-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

// Per-quant breakdown row for a single item within a location (cost batch level).
export class LocationItemQuantDisplayResponseDto {
  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  quantity: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  availableQuantity: DisplayUomQuantityResponseDto | null;
}

export class LocationItemQuantResponseDto {
  @ApiProperty() quantId: string;
  @ApiPropertyOptional({ nullable: true }) lotNumber: string | null;
  @ApiPropertyOptional({ nullable: true }) expiryDate: string | null;
  @ApiProperty() quantity: number;
  @ApiProperty() availableQuantity: number;
  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true }) unitCost: CurrencyAmountDto | null;
  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true }) quantValue: CurrencyAmountDto | null;

  @ApiProperty({
    type: LocationItemQuantDisplayResponseDto,
    description: "These quantities in the item's display unit",
  })
  display: LocationItemQuantDisplayResponseDto;
}

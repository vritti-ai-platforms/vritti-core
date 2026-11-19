import { DisplayUomQuantityResponseDto } from '@commerce/uom/dto/response/display-uom-quantity-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Per-quant row for the inventory item Quants tab — one row per (item, location, lot).
export class InventoryItemQuantDisplayResponseDto {
  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  quantity: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  reservedQuantity: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  availableQuantity: DisplayUomQuantityResponseDto | null;
}

export class InventoryItemQuantResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() organizationId: string;
  @ApiProperty() siteId: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() locationId: string;
  @ApiPropertyOptional({ nullable: true }) lotId: string | null;
  @ApiProperty() quantity: number;
  @ApiProperty() reservedQuantity: number;
  @ApiProperty() availableQuantity: number;
  @ApiPropertyOptional({ nullable: true }) locationName: string | null;
  @ApiPropertyOptional({ nullable: true }) locationPath: string | null;
  @ApiPropertyOptional({ nullable: true }) lotNumber: string | null;
  @ApiPropertyOptional({ nullable: true }) manufacturingDate: string | null;
  @ApiPropertyOptional({ nullable: true }) expiryDate: string | null;
  @ApiProperty() canDelete: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  @ApiProperty({
    type: InventoryItemQuantDisplayResponseDto,
    description: "These quantities in the item's display unit",
  })
  display: InventoryItemQuantDisplayResponseDto;
}

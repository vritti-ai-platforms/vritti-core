import { DisplayUomQuantityResponseDto } from '@commerce/uom/dto/response/display-uom-quantity-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockTransferResponseDto {
  @ApiProperty({ description: 'Stock transfer ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Source site ID' })
  fromSiteId: string;

  @ApiProperty({ description: 'Destination site ID' })
  toSiteId: string;

  @ApiProperty({ description: 'Transfer quantity' })
  quantity: number;

  @ApiProperty({ description: 'Transfer status', example: 'REQUESTED' })
  status: string;

  @ApiPropertyOptional({ description: 'User who requested the transfer', nullable: true })
  requestedBy: string | null;

  @ApiPropertyOptional({ description: 'User who received the transfer', nullable: true })
  receivedBy: string | null;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

export class StockTransferDisplayResponseDto {
  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  quantity: DisplayUomQuantityResponseDto | null;
}

export class StockTransferRowResponseDto extends StockTransferResponseDto {
  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiProperty({ description: 'Source site name (gateway-enriched)' })
  fromSiteName: string;

  @ApiProperty({ description: 'Destination site name (gateway-enriched)' })
  toSiteName: string;

  @ApiProperty({ type: StockTransferDisplayResponseDto, description: "The quantity in the item's display unit" })
  display: StockTransferDisplayResponseDto;
}

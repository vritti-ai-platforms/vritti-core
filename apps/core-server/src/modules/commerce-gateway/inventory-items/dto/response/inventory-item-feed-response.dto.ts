import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CursorListResponseDto } from '@vritti/api-sdk';
import { InventoryItemResponseDto } from './inventory-item-response.dto';

export class InventoryItemFeedResponseDto extends CursorListResponseDto<InventoryItemResponseDto> {
  @ApiProperty({ type: [InventoryItemResponseDto] })
  declare items: InventoryItemResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  declare nextCursor: string | null;

  @ApiProperty()
  declare hasMore: boolean;
}

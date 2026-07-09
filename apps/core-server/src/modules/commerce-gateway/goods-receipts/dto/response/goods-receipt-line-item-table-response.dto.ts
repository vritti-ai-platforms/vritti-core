import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { GoodsReceiptLineItemResponseDto } from './goods-receipt-line-item-response.dto';

export class GoodsReceiptLineItemTableResponseDto extends TableResponseDto<GoodsReceiptLineItemResponseDto> {
  @ApiProperty({ type: [GoodsReceiptLineItemResponseDto] })
  declare result: GoodsReceiptLineItemResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

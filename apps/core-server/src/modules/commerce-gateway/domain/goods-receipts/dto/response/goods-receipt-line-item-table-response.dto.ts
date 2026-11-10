import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { GoodsReceiptLineItemResponseDto } from './goods-receipt-line-item-response.dto';

export class GoodsReceiptLineItemTableResponseDto extends TableResponseDto<GoodsReceiptLineItemResponseDto> {
  @ApiProperty({ type: [GoodsReceiptLineItemResponseDto] })
  declare result: GoodsReceiptLineItemResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

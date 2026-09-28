import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { GoodsReceiptItemResponseDto } from './goods-receipt-item-response.dto';

export class GoodsReceiptItemTableResponseDto extends TableResponseDto<GoodsReceiptItemResponseDto> {
  @ApiProperty({ type: [GoodsReceiptItemResponseDto] })
  declare result: GoodsReceiptItemResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

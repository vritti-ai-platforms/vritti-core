import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { GoodsReceiptResponseDto } from './goods-receipt-response.dto';

export class GoodsReceiptTableResponseDto extends TableResponseDto<GoodsReceiptResponseDto> {
  @ApiProperty({ type: [GoodsReceiptResponseDto] })
  declare result: GoodsReceiptResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

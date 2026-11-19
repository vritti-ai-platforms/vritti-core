import { DisplayUomQuantityResponseDto } from '@commerce/uom/dto/response/display-uom-quantity-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { GoodsReceiptLineResponseDto } from './goods-receipt-line-response.dto';

export class GoodsReceiptLineDisplayResponseDto {
  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  primaryUomQty: DisplayUomQuantityResponseDto | null;
}

export class GoodsReceiptLineTableRowResponseDto extends GoodsReceiptLineResponseDto {
  @ApiProperty({
    type: GoodsReceiptLineDisplayResponseDto,
    description: "The line's primary-unit quantity in its item's display unit",
  })
  display: GoodsReceiptLineDisplayResponseDto;
}

export class GoodsReceiptLineTableResponseDto extends TableResponseDto<GoodsReceiptLineTableRowResponseDto> {
  @ApiProperty({ type: [GoodsReceiptLineTableRowResponseDto] })
  declare result: GoodsReceiptLineTableRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

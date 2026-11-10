import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { PurchaseOrderItemResponseDto } from './purchase-order-item-response.dto';

export class PurchaseOrderItemTableResponseDto extends TableResponseDto<PurchaseOrderItemResponseDto> {
  @ApiProperty({ type: [PurchaseOrderItemResponseDto] })
  declare result: PurchaseOrderItemResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

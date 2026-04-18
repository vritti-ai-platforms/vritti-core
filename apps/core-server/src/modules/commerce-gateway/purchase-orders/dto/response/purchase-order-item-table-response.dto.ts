import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk';
import { TableResponseDto } from '@vritti/api-sdk';
import { PurchaseOrderItemResponseDto } from './purchase-order-item-response.dto';

export class PurchaseOrderItemTableResponseDto extends TableResponseDto<PurchaseOrderItemResponseDto> {
  @ApiProperty({ type: [PurchaseOrderItemResponseDto] })
  declare result: PurchaseOrderItemResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { LePurchaseOrderResponseDto } from './le-purchase-order-response.dto';

export class LePurchaseOrderTableResponseDto extends TableResponseDto<LePurchaseOrderResponseDto> {
  @ApiProperty({ type: [LePurchaseOrderResponseDto] })
  declare result: LePurchaseOrderResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { PurchaseOrderResponseDto } from './purchase-order-response.dto';

export class PurchaseOrderTableResponseDto extends TableResponseDto<PurchaseOrderResponseDto> {
  @ApiProperty({ type: [PurchaseOrderResponseDto] })
  declare result: PurchaseOrderResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

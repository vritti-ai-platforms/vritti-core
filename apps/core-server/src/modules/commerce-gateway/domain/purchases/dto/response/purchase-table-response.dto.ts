import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { PurchaseTableRowResponseDto } from './purchase-table-row-response.dto';

export class PurchaseTableResponseDto extends TableResponseDto<PurchaseTableRowResponseDto> {
  @ApiProperty({ type: [PurchaseTableRowResponseDto] })
  declare result: PurchaseTableRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

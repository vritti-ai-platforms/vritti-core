import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { OrderResponseDto } from './order-response.dto';

export class OrderTableResponseDto extends TableResponseDto<OrderResponseDto> {
  @ApiProperty({ type: [OrderResponseDto] })
  declare result: OrderResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { LeInboundDeliveryResponseDto } from './le-inbound-delivery-response.dto';

export class LeInboundDeliveryTableResponseDto extends TableResponseDto<LeInboundDeliveryResponseDto> {
  @ApiProperty({ type: [LeInboundDeliveryResponseDto] })
  declare result: LeInboundDeliveryResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

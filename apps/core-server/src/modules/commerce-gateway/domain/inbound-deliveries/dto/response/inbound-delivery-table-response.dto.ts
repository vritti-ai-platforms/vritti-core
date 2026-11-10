import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { InboundDeliveryResponseDto } from './inbound-delivery-response.dto';

export class InboundDeliveryTableResponseDto extends TableResponseDto<InboundDeliveryResponseDto> {
  @ApiProperty({ type: [InboundDeliveryResponseDto] })
  declare result: InboundDeliveryResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

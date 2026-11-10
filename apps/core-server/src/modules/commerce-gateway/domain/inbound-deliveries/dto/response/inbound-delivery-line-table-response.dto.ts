import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { InboundDeliveryLineResponseDto } from './inbound-delivery-line-response.dto';

export class InboundDeliveryLineTableResponseDto extends TableResponseDto<InboundDeliveryLineResponseDto> {
  @ApiProperty({ type: [InboundDeliveryLineResponseDto] })
  declare result: InboundDeliveryLineResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

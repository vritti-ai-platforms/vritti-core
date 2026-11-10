import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { PartyCommunicationResponseDto } from './party-communication-response.dto';

export class PartyCommunicationTableResponseDto extends TableResponseDto<PartyCommunicationResponseDto> {
  @ApiProperty({ type: [PartyCommunicationResponseDto] })
  declare result: PartyCommunicationResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

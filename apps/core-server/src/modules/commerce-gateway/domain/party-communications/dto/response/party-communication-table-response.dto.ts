import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { PartyCommunicationResponseDto } from './party-communication-response.dto';

export class PartyCommunicationTableResponseDto extends TableResponseDto<PartyCommunicationResponseDto> {
  @ApiProperty({ type: [PartyCommunicationResponseDto] })
  declare result: PartyCommunicationResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

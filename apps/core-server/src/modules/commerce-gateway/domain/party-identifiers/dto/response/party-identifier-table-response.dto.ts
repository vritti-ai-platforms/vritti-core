import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { PartyIdentifierResponseDto } from './party-identifier-response.dto';

export class PartyIdentifierTableResponseDto extends TableResponseDto<PartyIdentifierResponseDto> {
  @ApiProperty({ type: [PartyIdentifierResponseDto] })
  declare result: PartyIdentifierResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

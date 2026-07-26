import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
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

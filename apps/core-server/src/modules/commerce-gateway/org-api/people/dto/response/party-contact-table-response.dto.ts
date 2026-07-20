import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { PartyContactResponseDto } from './party-contact-response.dto';

export class PartyContactTableResponseDto extends TableResponseDto<PartyContactResponseDto> {
  @ApiProperty({ type: [PartyContactResponseDto] })
  declare result: PartyContactResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

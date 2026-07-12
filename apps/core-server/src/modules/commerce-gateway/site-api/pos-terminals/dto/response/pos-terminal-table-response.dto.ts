import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/database';
import { PosTerminalResponseDto } from './pos-terminal-response.dto';

export class PosTerminalTableResponseDto extends TableResponseDto<PosTerminalResponseDto> {
  @ApiProperty({ type: [PosTerminalResponseDto] })
  declare result: PosTerminalResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

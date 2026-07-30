import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { RunResponseDto } from './run-response.dto';

// Canonical DataTable envelope. The git service applies only pagination and its four native filters
// (event, branch, status, actor) — the rest of the state round-trips through Redis for the client.
export class RunTableResponseDto extends TableResponseDto<RunResponseDto> {
  @ApiProperty({ type: [RunResponseDto] })
  declare result: RunResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { RepositoryResponseDto } from './repository-response.dto';

// Canonical DataTable envelope. `state` and `activeViewId` come from DataTableStateService (Redis), so
// column sizing, order, visibility and density round-trip like every other table in the product — even
// though the git service itself can only honour pagination.
export class RepositoryTableResponseDto extends TableResponseDto<RepositoryResponseDto> {
  @ApiProperty({ type: [RepositoryResponseDto] })
  declare result: RepositoryResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

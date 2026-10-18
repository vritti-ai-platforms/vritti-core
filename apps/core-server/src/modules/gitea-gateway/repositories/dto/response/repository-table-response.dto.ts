import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { RepositoryResponseDto } from './repository-response.dto';

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

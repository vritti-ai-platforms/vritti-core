import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { RunResponseDto } from './run-response.dto';

export class RunTableResponseDto extends TableResponseDto<RunResponseDto> {
  @ApiProperty({ type: [RunResponseDto] })
  declare result: RunResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

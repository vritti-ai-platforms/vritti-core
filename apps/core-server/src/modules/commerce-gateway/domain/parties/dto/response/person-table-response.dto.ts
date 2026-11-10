import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { PersonResponseDto } from './person-response.dto';

export class PersonTableResponseDto extends TableResponseDto<PersonResponseDto> {
  @ApiProperty({ type: [PersonResponseDto] })
  declare result: PersonResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

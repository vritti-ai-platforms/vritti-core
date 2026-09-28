import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { PersonCompanyResponseDto } from './person-company-response.dto';

export class PersonCompanyTableResponseDto extends TableResponseDto<PersonCompanyResponseDto> {
  @ApiProperty({ type: [PersonCompanyResponseDto] })
  declare result: PersonCompanyResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

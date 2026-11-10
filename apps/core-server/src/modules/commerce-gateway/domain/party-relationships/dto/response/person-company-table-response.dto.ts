import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { PersonCompanyResponseDto } from './person-company-response.dto';

export class PersonCompanyTableResponseDto extends TableResponseDto<PersonCompanyResponseDto> {
  @ApiProperty({ type: [PersonCompanyResponseDto] })
  declare result: PersonCompanyResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
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

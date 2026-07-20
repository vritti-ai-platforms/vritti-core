import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { PersonRegistrationResponseDto } from './person-registration-response.dto';

export class PersonRegistrationTableResponseDto extends TableResponseDto<PersonRegistrationResponseDto> {
  @ApiProperty({ type: [PersonRegistrationResponseDto] })
  declare result: PersonRegistrationResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

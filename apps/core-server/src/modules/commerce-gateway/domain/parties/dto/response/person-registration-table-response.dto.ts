import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { PersonRegistrationResponseDto } from './person-registration-response.dto';

export class PersonRegistrationTableResponseDto extends TableResponseDto<PersonRegistrationResponseDto> {
  @ApiProperty({ type: [PersonRegistrationResponseDto] })
  declare result: PersonRegistrationResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

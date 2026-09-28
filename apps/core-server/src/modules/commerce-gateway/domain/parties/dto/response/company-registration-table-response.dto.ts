import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { CompanyRegistrationResponseDto } from './company-registration-response.dto';

export class CompanyRegistrationTableResponseDto extends TableResponseDto<CompanyRegistrationResponseDto> {
  @ApiProperty({ type: [CompanyRegistrationResponseDto] })
  declare result: CompanyRegistrationResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

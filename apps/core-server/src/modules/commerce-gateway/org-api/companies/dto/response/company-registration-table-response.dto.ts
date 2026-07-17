import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
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

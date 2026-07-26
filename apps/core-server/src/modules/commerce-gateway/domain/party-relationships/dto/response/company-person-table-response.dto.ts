import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { CompanyPersonResponseDto } from './company-person-response.dto';

export class CompanyPersonTableResponseDto extends TableResponseDto<CompanyPersonResponseDto> {
  @ApiProperty({ type: [CompanyPersonResponseDto] })
  declare result: CompanyPersonResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
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

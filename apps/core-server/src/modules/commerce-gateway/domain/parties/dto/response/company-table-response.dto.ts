import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { CompanyResponseDto } from './company-response.dto';

export class CompanyTableResponseDto extends TableResponseDto<CompanyResponseDto> {
  @ApiProperty({ type: [CompanyResponseDto] })
  declare result: CompanyResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

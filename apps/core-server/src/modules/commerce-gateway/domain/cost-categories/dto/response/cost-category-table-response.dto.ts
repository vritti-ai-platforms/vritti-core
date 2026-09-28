import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { CostCategoryResponseDto } from './cost-category-response.dto';

export class CostCategoryTableResponseDto extends TableResponseDto<CostCategoryResponseDto> {
  @ApiProperty({ type: [CostCategoryResponseDto] })
  declare result: CostCategoryResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

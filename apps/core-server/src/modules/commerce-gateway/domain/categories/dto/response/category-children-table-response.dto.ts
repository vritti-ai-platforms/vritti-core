import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { CategoryResponseDto } from './category-response.dto';

export class CategoryChildrenTableResponseDto extends TableResponseDto<CategoryResponseDto> {
  @ApiProperty({ type: [CategoryResponseDto] })
  declare result: CategoryResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

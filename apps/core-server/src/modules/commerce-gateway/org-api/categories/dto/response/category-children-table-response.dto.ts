import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { CategoryResponseDto } from './category-response.dto';

export class CategoryChildrenTableResponseDto extends TableResponseDto<CategoryResponseDto> {
  @ApiProperty({ type: [CategoryResponseDto] })
  declare result: CategoryResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

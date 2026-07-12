import { ApiProperty } from '@nestjs/swagger';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { CategoryItemResponseDto } from './category-item-response.dto';

export class CategoryItemTableResponseDto extends TableResponseDto<CategoryItemResponseDto> {
  @ApiProperty({ type: [CategoryItemResponseDto] })
  declare result: CategoryItemResponseDto[];
}

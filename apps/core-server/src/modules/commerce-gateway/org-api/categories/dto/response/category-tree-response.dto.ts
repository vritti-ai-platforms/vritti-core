import { ApiProperty } from '@nestjs/swagger';

export class CategoryTreeResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'GROUP holds sub-categories; CATEGORY is a leaf that holds inventory items' })
  categoryRole: string;

  @ApiProperty({
    description: 'Child categories',
    type: () => CategoryTreeResponseDto,
    isArray: true,
    required: false,
  })
  children?: CategoryTreeResponseDto[];
}

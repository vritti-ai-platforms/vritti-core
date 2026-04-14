import { ApiProperty } from '@nestjs/swagger';

export class CategoryTreeResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({
    description: 'Child categories',
    type: () => CategoryTreeResponseDto,
    isArray: true,
    required: false,
  })
  children?: CategoryTreeResponseDto[];
}

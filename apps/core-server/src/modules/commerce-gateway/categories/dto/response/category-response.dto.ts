import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @ApiProperty({ description: 'Business unit ID' })
  businessUnitId: string;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Display sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Whether the category is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Whether this category can be deleted safely' })
  canDelete: boolean;

  @ApiProperty({ description: 'Parent category ID, or null for root-level categories', nullable: true })
  parentId: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}

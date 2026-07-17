import { ApiProperty } from '@nestjs/swagger';
import { CategoryRoleValues } from '../../constants/category-role.constants';

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @ApiProperty({ description: 'Site ID' })
  siteId: string;

  @ApiProperty({
    description: 'GROUP holds sub-categories; CATEGORY is a leaf that holds inventory items',
    enum: Object.values(CategoryRoleValues),
  })
  categoryRole: string;

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

  @ApiProperty({ description: 'Slugified name segment used inside the ltree path', example: 'antibiotics' })
  pathLabel: string;

  @ApiProperty({
    description: 'Full ltree path from root to this category',
    example: 'medicines.prescription.antibiotics',
  })
  path: string;

  @ApiProperty({
    description: 'Default tax class ID for items in this category (null for GROUP categories)',
    nullable: true,
  })
  defaultTaxClassId: string | null;

  @ApiProperty({
    description: 'Resolved default tax class name (null for GROUP categories or when unset)',
    nullable: true,
  })
  defaultTaxClassName: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}

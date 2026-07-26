import { ApiProperty } from '@nestjs/swagger';

export class CostCategoryResponseDto {
  @ApiProperty({ description: 'Cost category ID' })
  id: string;

  @ApiProperty({ description: 'Unique code within the org', example: 'SUPPLIER_PRICE' })
  code: string;

  @ApiProperty({ description: 'Human-readable name' })
  name: string;

  @ApiProperty({ description: 'Reporting kind', enum: ['ITEM', 'FREIGHT', 'DUTY', 'INSURANCE', 'SERVICE', 'OTHER'] })
  kind: string;

  @ApiProperty({ description: 'Whether the category is selectable' })
  isActive: boolean;

  @ApiProperty({ description: 'System-reserved (cannot be deleted)' })
  isSystem: boolean;

  @ApiProperty({ description: 'Whether hard-delete is allowed (no cost rows reference it + not system)' })
  canDelete: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

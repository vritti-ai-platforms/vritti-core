import { ApiProperty } from '@nestjs/swagger';

export class VariantOptionValueResponseDto {
  @ApiProperty({ description: 'Variant option value ID' })
  id: string;

  @ApiProperty({ description: 'Value text' })
  value: string;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Whether this value is referenced by a variant and cannot be deleted' })
  referenced: boolean;
}

export class VariantOptionResponseDto {
  @ApiProperty({ description: 'Variant option ID' })
  id: string;

  @ApiProperty({ description: 'Catalog ID' })
  catalogId: string;

  @ApiProperty({ description: 'Variant option name' })
  name: string;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Variant option values', type: [VariantOptionValueResponseDto] })
  values: VariantOptionValueResponseDto[];

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

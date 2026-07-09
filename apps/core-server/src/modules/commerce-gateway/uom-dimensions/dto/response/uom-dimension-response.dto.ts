import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UomDimensionResponseDto {
  @ApiProperty({ description: 'Dimension ID' })
  id: string;

  @ApiProperty({ description: 'Unique code', example: 'MASS' })
  code: string;

  @ApiProperty({ description: 'Display name', example: 'Mass' })
  name: string;

  @ApiPropertyOptional({ description: 'Optional description', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ description: 'Whether this dimension is editable by the current BU' })
  canEdit?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this dimension can be deleted (only set on detail/create/update responses)',
  })
  canDelete?: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

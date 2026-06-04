import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PosTerminalResponseDto {
  @ApiProperty({ description: 'Terminal ID' })
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Business unit ID' })
  businessUnitId: string;

  @ApiProperty({ description: 'Terminal name', example: 'Counter 1' })
  name: string;

  @ApiProperty({ description: 'Terminal code', example: 'POS-CTR-1' })
  code: string;

  @ApiProperty({ description: 'Linked storage location ID' })
  locationId: string;

  @ApiPropertyOptional({ description: 'Linked storage location name', nullable: true })
  locationName: string | null;

  @ApiPropertyOptional({ description: 'Human-readable breadcrumb of the location path', nullable: true })
  locationPath: string | null;

  @ApiPropertyOptional({ description: 'Catalog this terminal sells from', nullable: true })
  catalogId: string | null;

  @ApiPropertyOptional({ description: 'Terminal description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Whether the terminal is active' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

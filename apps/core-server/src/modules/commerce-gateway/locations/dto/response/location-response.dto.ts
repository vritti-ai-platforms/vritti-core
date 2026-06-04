import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationRoleValues, type LocationRole } from '../../constants/location-role.constants';

export class LocationResponseDto {
  @ApiProperty({ description: 'Location ID' })
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Business unit ID' })
  businessUnitId: string;

  @ApiProperty({ description: 'Location name', example: 'Walk-in Fridge' })
  name: string;

  @ApiProperty({ description: 'Location code', example: 'WIF' })
  code: string;

  @ApiPropertyOptional({ description: 'Parent location ID, or null for root-level locations', nullable: true })
  parentId: string | null;

  @ApiProperty({ description: 'Materialized ltree path for hierarchy traversal' })
  path: string;

  @ApiProperty({ description: 'Display sort order' })
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Location area', example: 'Kitchen', nullable: true })
  area: string | null;

  @ApiPropertyOptional({ description: 'Manager user ID', nullable: true })
  managerId: string | null;

  @ApiPropertyOptional({ description: 'Location address', nullable: true })
  address: string | null;

  @ApiProperty({ description: 'Location role', enum: Object.values(LocationRoleValues) })
  locationRole: LocationRole;

  @ApiProperty({ description: 'Whether the location is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Whether this location can be deleted' })
  canDelete: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

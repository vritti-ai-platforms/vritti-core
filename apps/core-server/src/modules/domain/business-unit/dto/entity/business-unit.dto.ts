import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { BuMetadata, BuType, BusinessUnit } from '@/db/schema';

export class BusinessUnitDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-here' })
  organizationId: string;

  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  parentId: string | null;

  @ApiProperty({ example: 'US East Region' })
  name: string;

  @ApiPropertyOptional({ example: 'US-EAST', nullable: true })
  code: string | null;

  @ApiProperty({ enum: ['ORGANIZATION', 'REGION', 'FRANCHISEE', 'BRANCH', 'TEAM', 'DEPARTMENT', 'CUSTOM'] })
  type: BuType;

  @ApiProperty({ example: 0 })
  depth: number;

  @ApiPropertyOptional({ example: '/root-id/child-id', nullable: true })
  path: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ nullable: true })
  metadata: BuMetadata | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: ['inventory', 'pos'], type: [String] })
  appCodes: string[];

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  // Creates a DTO from a BusinessUnit entity
  static from(bu: BusinessUnit): BusinessUnitDto {
    const dto = new BusinessUnitDto();
    dto.id = bu.id;
    dto.organizationId = bu.organizationId;
    dto.parentId = bu.parentId ?? null;
    dto.name = bu.name;
    dto.code = bu.code ?? null;
    dto.type = bu.type;
    dto.depth = bu.depth;
    dto.path = bu.path ?? null;
    dto.isActive = bu.isActive;
    dto.sortOrder = bu.sortOrder;
    dto.appCodes = bu.appCodes ?? [];
    dto.metadata = bu.metadata ?? null;
    dto.createdAt = bu.createdAt.toISOString();
    dto.updatedAt = bu.updatedAt.toISOString();
    return dto;
  }
}

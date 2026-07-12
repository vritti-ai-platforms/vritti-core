import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SiteGroup } from '@/db/schema';

export class SiteGroupDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-here' })
  organizationId: string;

  @ApiProperty({ example: 'South Zone' })
  name: string;

  @ApiProperty({ example: 'south-zone' })
  code: string;

  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  parentId: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  // Creates a DTO from a SiteGroup entity
  static from(group: SiteGroup): SiteGroupDto {
    const dto = new SiteGroupDto();
    dto.id = group.id;
    dto.organizationId = group.organizationId;
    dto.name = group.name;
    dto.code = group.code;
    dto.parentId = group.parentId ?? null;
    dto.isActive = group.isActive;
    dto.createdAt = group.createdAt.toISOString();
    dto.updatedAt = group.updatedAt.toISOString();
    return dto;
  }
}

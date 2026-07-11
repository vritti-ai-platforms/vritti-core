import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Site, SiteMetadata, SiteType } from '@/db/schema';

export class SiteDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-here' })
  organizationId: string;

  @ApiProperty({ example: 'Mysore Outlet' })
  name: string;

  @ApiPropertyOptional({ example: 'mysore', nullable: true })
  code: string | null;

  @ApiProperty({ enum: ['OUTLET', 'WAREHOUSE', 'PRODUCTION'] })
  type: SiteType;

  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  groupId: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: 'Asia/Kolkata' })
  timezone: string;


  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  legalEntityId: string | null;

  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  registrationId: string | null;

  @ApiPropertyOptional({ nullable: true })
  metadata: SiteMetadata | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  // Creates a DTO from a Site entity
  static from(site: Site): SiteDto {
    const dto = new SiteDto();
    dto.id = site.id;
    dto.organizationId = site.organizationId;
    dto.name = site.name;
    dto.code = site.code ?? null;
    dto.type = site.type;
    dto.groupId = site.groupId ?? null;
    dto.isActive = site.isActive;
    dto.sortOrder = site.sortOrder;
    dto.timezone = site.timezone;
    dto.legalEntityId = site.legalEntityId ?? null;
    dto.registrationId = site.registrationId ?? null;
    dto.metadata = site.metadata ?? null;
    dto.createdAt = site.createdAt.toISOString();
    dto.updatedAt = site.updatedAt.toISOString();
    return dto;
  }
}

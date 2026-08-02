import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { OrgService, ServiceType } from '@/db/schema';

export class OrgServiceDto {
  @ApiProperty({ description: 'Provisioned service code', example: 'GITEA' })
  service: ServiceType;

  @ApiPropertyOptional({ description: "The provider's own id", nullable: true })
  externalId: string | null;

  @ApiPropertyOptional({ description: "The provider's namespace/name", nullable: true })
  externalName: string | null;

  // Creates a response DTO from an OrgService entity
  static from(row: OrgService): OrgServiceDto {
    const dto = new OrgServiceDto();
    dto.service = row.service;
    dto.externalId = row.externalId ?? null;
    dto.externalName = row.externalName ?? null;
    return dto;
  }
}

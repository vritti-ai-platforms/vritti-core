import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Organization, OrgPlan, OrgSize } from '@/db/schema';

export class OrganizationDto {
  @ApiProperty({ description: 'Organization unique identifier', example: 'a1b2c3d4-...' })
  id: string;

  @ApiProperty({ description: 'Organization name', example: 'Acme Corp' })
  name: string;

  @ApiProperty({ description: 'Organization subdomain', example: 'acme-corp' })
  subdomain: string;

  @ApiPropertyOptional({ description: 'Industry ID', example: 1, nullable: true })
  industryId: string | null;

  @ApiProperty({
    description: 'Organization size',
    enum: ['0-10', '10-20', '20-50', '50-100', '100-500', '500+'],
    example: '0-10',
  })
  size: OrgSize;

  @ApiPropertyOptional({ description: 'Media asset ID', example: 42, nullable: true })
  mediaId: number | null;

  @ApiProperty({ description: 'Subscription plan', enum: ['free', 'pro', 'enterprise'], example: 'free' })
  plan: OrgPlan;

  @ApiProperty({ description: 'Organization creation timestamp', example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  // Creates a response DTO from an Organization entity
  static from(org: Organization): OrganizationDto {
    const dto = new OrganizationDto();
    dto.id = org.id;
    dto.name = org.name;
    dto.subdomain = org.subdomain;
    dto.size = org.size;
    dto.mediaId = org.mediaId ?? null;
    dto.plan = org.plan;
    dto.createdAt = org.createdAt.toISOString();
    return dto;
  }
}

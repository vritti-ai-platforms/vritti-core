import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttributeTemplateValueResponseDto {
  @ApiProperty({ description: 'Template value ID' })
  id: string;

  @ApiProperty({ description: 'Template this value belongs to' })
  templateId: string;

  @ApiProperty({ description: 'Code a storefront filters by', example: 'high-protein' })
  code: string;

  @ApiProperty({ description: 'The value itself', example: 'M' })
  value: string;

  @ApiProperty({ description: 'Sort order within the template' })
  sortOrder: number;
}

export class AttributeTemplateResponseDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Stable identifier, unique across the organization', example: 'apparel-size' })
  code: string;

  @ApiProperty({ description: 'Template name', example: 'Apparel Size' })
  name: string;

  @ApiPropertyOptional({ description: 'What the template is for', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Whether the template can be applied to new attributes' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Owning legal entity, when LE-owned', nullable: true })
  legalEntityId: string | null;

  @ApiPropertyOptional({ description: 'Owning site, when site-owned', nullable: true })
  siteId: string | null;

  @ApiProperty({ description: 'Which scope owns this template', enum: ['ORG', 'LE', 'SITE'] })
  ownerScope: 'ORG' | 'LE' | 'SITE';

  @ApiProperty({
    description: 'Name of the owning workspace — the legal entity or site, or "Organization" at org scope',
    example: 'Acme Pharma Pvt Ltd',
  })
  ownerName: string;

  @ApiProperty({ description: 'Values seeded onto an attribute', type: [AttributeTemplateValueResponseDto] })
  values: AttributeTemplateValueResponseDto[];

  @ApiProperty({ description: 'Number of values on the template' })
  valueCount: number;

  @ApiProperty({ description: 'Whether the current workspace owns this template and may change it' })
  canEdit: boolean;

  @ApiProperty({ description: 'Whether this template can be deleted' })
  canDelete: boolean;

  @ApiProperty({ description: 'When the template was created' })
  createdAt: string;

  @ApiProperty({ description: 'When the template was last updated' })
  updatedAt: string;
}

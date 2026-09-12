import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OfferingDimensionTemplateValueResponseDto {
  @ApiProperty({ description: 'Template value ID' })
  id: string;

  @ApiProperty({ description: 'Template this value belongs to' })
  templateId: string;

  @ApiProperty({ description: 'Segment this value contributes to a derived SKU', example: 'm' })
  code: string;

  @ApiProperty({ description: 'The value itself', example: 'M' })
  value: string;

  @ApiProperty({ description: 'Sort order within the template' })
  sortOrder: number;
}

export class OfferingDimensionTemplateResponseDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Stable identifier, unique across the organization', example: 'apparel-size' })
  code: string;

  @ApiProperty({ description: 'Template name', example: 'Apparel Size' })
  name: string;

  @ApiPropertyOptional({ description: 'What the template is for', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Whether the template can be applied to new dimensions' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Owning legal entity, when LE-owned', nullable: true })
  legalEntityId: string | null;

  @ApiPropertyOptional({ description: 'Owning site, when site-owned', nullable: true })
  siteId: string | null;

  @ApiProperty({ description: 'Which scope owns this template', enum: ['ORG', 'LE', 'SITE'] })
  ownerScope: 'ORG' | 'LE' | 'SITE';

  @ApiProperty({ description: 'Values seeded onto a dimension', type: [OfferingDimensionTemplateValueResponseDto] })
  values: OfferingDimensionTemplateValueResponseDto[];

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

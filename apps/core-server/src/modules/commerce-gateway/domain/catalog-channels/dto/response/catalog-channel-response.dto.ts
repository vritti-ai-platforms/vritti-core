import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CatalogChannelResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() catalogId: string;
  @ApiPropertyOptional({ nullable: true }) catalogName: string | null;
  @ApiProperty() catalogIsActive: boolean;
  @ApiProperty({ enum: ['APP', 'POS', 'B2B'] }) type: string;
  @ApiPropertyOptional({ nullable: true }) legalEntityId: string | null;
  @ApiPropertyOptional({ nullable: true }) siteId: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Named app; null means any app' }) appId: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Named till; null means any till' }) terminalId: string | null;
  @ApiPropertyOptional({ nullable: true }) terminalName: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

export class ResolvedCatalogResponseDto {
  @ApiProperty() catalogId: string;
  @ApiProperty() catalogName: string;
  @ApiProperty() taxInclusive: boolean;
  @ApiProperty() channelId: string;
  @ApiProperty({ enum: ['SITE', 'LEGAL_ENTITY', 'ORGANIZATION'] })
  matchedScope: 'SITE' | 'LEGAL_ENTITY' | 'ORGANIZATION';
  @ApiProperty({ description: 'Whether a named app or till matched rather than a wildcard' })
  matchedTarget: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/database';

export class CatalogChannelResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() catalogId: string;
  @ApiPropertyOptional({ nullable: true }) catalogName: string | null;
  @ApiProperty() catalogIsActive: boolean;
  @ApiProperty({ enum: ['APP', 'POS', 'B2B'] }) type: string;

  @ApiProperty({ description: 'Display name — the app or till, or the fallback label' })
  label: string;

  @ApiProperty({ description: 'True for the wildcard every unnamed caller falls back to' })
  isFallback: boolean;

  @ApiPropertyOptional({ nullable: true }) legalEntityId: string | null;
  @ApiPropertyOptional({ nullable: true }) siteId: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Named app; null means any app' }) appId: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Named till; null means any till' }) terminalId: string | null;
  @ApiPropertyOptional({ nullable: true }) terminalName: string | null;

  @ApiProperty({ description: 'False when inherited — the channel is read-only here' })
  isOwn: boolean;

  @ApiProperty({ enum: ['SITE', 'LEGAL_ENTITY', 'ORGANIZATION'] }) setAt: string;
  @ApiProperty() itemsTotal: number;
  @ApiProperty() itemsSelling: number;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

export class ChannelResolutionResponseDto {
  @ApiProperty({ description: 'False when nothing covers this channel' })
  resolved: boolean;

  @ApiPropertyOptional({ type: () => ResolvedCatalogResponseDto, nullable: true })
  catalog: ResolvedCatalogResponseDto | null;
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

export class ChannelOverviewResponseDto {
  @ApiProperty({ enum: ['APP', 'POS', 'B2B'] }) type: string;
  @ApiPropertyOptional({ nullable: true }) catalogId: string | null;
  @ApiPropertyOptional({ nullable: true }) catalogName: string | null;
  @ApiPropertyOptional({ nullable: true }) catalogIsActive: boolean | null;

  @ApiProperty({ description: 'Whether this workspace set it, rather than inheriting it' })
  isOverride: boolean;

  @ApiPropertyOptional({ enum: ['SITE', 'LEGAL_ENTITY', 'ORGANIZATION'], nullable: true })
  inheritedFrom: 'SITE' | 'LEGAL_ENTITY' | 'ORGANIZATION' | null;
}

export class CatalogChannelTableResponseDto extends TableResponseDto<CatalogChannelResponseDto> {
  @ApiProperty({ type: [CatalogChannelResponseDto] }) declare result: CatalogChannelResponseDto[];
  @ApiProperty() declare count: number;
  @ApiProperty() declare state: TableViewState;
  @ApiPropertyOptional({ nullable: true }) declare activeViewId: string | null;
}

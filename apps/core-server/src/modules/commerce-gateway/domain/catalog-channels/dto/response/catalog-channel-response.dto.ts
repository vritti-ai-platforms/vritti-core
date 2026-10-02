import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { type CatalogChannelTypeValue, CHANNEL_TYPES } from '../request/create-catalog-channel.dto';

export class CatalogChannelResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ['APP', 'POS', 'B2B'] }) type: string;
  @ApiPropertyOptional({ nullable: true, description: 'Named app; null means every app' }) appId: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Named terminal; null means every terminal' })
  terminalId: string | null;
  @ApiPropertyOptional({ nullable: true }) terminalName: string | null;
  @ApiPropertyOptional({ nullable: true }) legalEntityId: string | null;
  @ApiPropertyOptional({ nullable: true }) siteId: string | null;

  @ApiProperty({ description: 'False when a wider level set it — read-only here' })
  isOwn: boolean;
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

export class CatalogChannelTableResponseDto extends TableResponseDto<CatalogChannelResponseDto> {
  @ApiProperty({ type: [CatalogChannelResponseDto] }) declare result: CatalogChannelResponseDto[];
  @ApiProperty() declare count: number;
  @ApiProperty() declare state: TableViewState;
  @ApiPropertyOptional({ nullable: true }) declare activeViewId: string | null;
}

// ─── the one-list payload ───

// What commerce returns: per type, the default under DEFAULT_SLOT plus any app or terminal that
// overrides it. Only decided slots appear — core joins it to the apps and terminals that exist.
export const DEFAULT_SLOT = 'default';

export type ResolvedChannels = Record<string, Record<string, ChannelCatalogResponseDto>>;

export class ChannelCatalogResponseDto {
  @ApiProperty() channelId: string;
  @ApiProperty() catalogId: string;
  @ApiProperty() catalogName: string;
  @ApiProperty() catalogIsActive: boolean;
  @ApiPropertyOptional({ nullable: true }) legalEntityId: string | null;
  @ApiPropertyOptional({ nullable: true }) siteId: string | null;

  @ApiProperty({ enum: ['ORG', 'LE', 'SITE'], description: 'Level this assignment was made at' })
  ownerScope: 'ORG' | 'LE' | 'SITE';

  @ApiProperty({ description: 'Name of the owning workspace, resolved from core' })
  ownerName: string;

  @ApiProperty({ description: 'False when a wider level owns it — this workspace may only override' })
  isOwn: boolean;

  @ApiProperty() itemsTotal: number;
  @ApiProperty() itemsSelling: number;
}

export class ChannelTargetResponseDto {
  @ApiProperty({ description: 'App id or terminal id' }) targetId: string;
  @ApiProperty() name: string;

  @ApiProperty({
    type: ChannelCatalogResponseDto,
    description: 'What this target sells. Never null — a target with no row of its own carries the channel default.',
  })
  catalog: ChannelCatalogResponseDto;

  @ApiProperty({ description: 'Whether the catalog came from this target rather than the channel default' })
  isAssigned: boolean;
}

export class ChannelEntryResponseDto {
  @ApiProperty({ enum: CHANNEL_TYPES }) type: CatalogChannelTypeValue;

  @ApiPropertyOptional({ type: ChannelCatalogResponseDto, nullable: true })
  defaultCatalog: ChannelCatalogResponseDto | null;

  @ApiPropertyOptional({
    type: [ChannelTargetResponseDto],
    nullable: true,
    description: 'Null for B2B, which names no target. Empty above an outlet for POS.',
  })
  targets: ChannelTargetResponseDto[] | null;
}

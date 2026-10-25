import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { OfferingVariantResponseDto } from './offering-variant-response.dto';

// What commerce answers with: one row per app or till whose channel carries this offering
export interface OfferingTargetRow {
  type: string;
  targetId: string;
  targetName: string;
  targetKind: 'APP' | 'TERMINAL';
  catalogId: string;
  catalogName: string;
  isAssigned: boolean;
  isOwn: boolean;
  variants: number;
  listed: number;
  available: number;
}

export class OfferingChannelTargetResponseDto {
  @ApiProperty({ description: 'The app or till itself — what an operator recognises and clicks into' })
  targetId: string;

  @ApiProperty({ enum: ['APP', 'TERMINAL'] }) targetKind: 'APP' | 'TERMINAL';
  @ApiProperty() name: string;

  @ApiProperty() catalogId: string;
  @ApiProperty() catalogName: string;

  @ApiProperty({ description: 'True when the channel names this target; false when it inherits a default' })
  isAssigned: boolean;

  @ApiProperty({ description: 'True when this target is an app with a base url, so it has pages to ask about' })
  storefront: boolean;

  @ApiProperty({ description: 'Variants this offering has in total' })
  variants: number;

  @ApiProperty({ description: 'How many of them this target’s catalog carries' })
  listed: number;

  @ApiProperty({ description: 'How many of those it offers, rather than excluding' })
  available: number;
}

export class OfferingChannelTypeResponseDto {
  @ApiProperty({ enum: ['APP', 'POS', 'B2B'] }) type: string;

  @ApiProperty({ type: [OfferingChannelTargetResponseDto] })
  targets: OfferingChannelTargetResponseDto[];
}

export class ChannelVariantResponseDto extends OfferingVariantResponseDto {
  @ApiProperty({ description: 'Whether this channel’s catalog carries the variant' })
  listed: boolean;

  @ApiProperty({ description: 'Whether the variant is available on this channel, as opposed to excluded outright' })
  availableHere: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Whether the storefront has a page for it. Null when the channel names none, or it did not answer.',
  })
  exists: boolean | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Whether an editor marked that page finished. Null when it could not be asked.',
  })
  metadataComplete: boolean | null;
}

export class ChannelVariantPagesTableResponseDto extends TableResponseDto<ChannelVariantResponseDto> {
  @ApiProperty({ type: [ChannelVariantResponseDto] }) declare result: ChannelVariantResponseDto[];
  @ApiProperty() declare count: number;
  @ApiProperty() declare state: TableViewState;
  @ApiPropertyOptional({ nullable: true }) declare activeViewId: string | null;

  @ApiProperty({ description: 'False when this channel names no storefront, so the page columns say nothing' })
  storefront: boolean;

  @ApiProperty({ description: 'The catalog these rows are listed in, which is what availability is set on' })
  catalogName: string;

  @ApiProperty({ description: 'False when a wider workspace set the channel — availability is read-only here' })
  isOwn: boolean;
}

import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { type CatalogChannelType, CatalogChannelTypeValues } from '@/db/schema';

// One DTO per channel type, because each type names a different target and the database rejects the
// combinations the others allow. A shared DTO carrying `type` plus every target column lets
// { type: 'B2B', appId } through validation and fails it on a CHECK constraint instead.

// appId absent means the fallback every unnamed caller resolves to
export class UpsertAppChannelDto {
  @IsUUID('all')
  catalogId: string;

  @IsOptional()
  @IsUUID('all')
  appId?: string | null;
}

// terminalId absent means every terminal in reach of this workspace
export class UpsertPosChannelDto {
  @IsUUID('all')
  catalogId: string;

  @IsOptional()
  @IsUUID('all')
  terminalId?: string | null;
}

// B2B names no target: one assignment per workspace, enforced by ck_catalog_channels_target_matches_type
export class UpsertB2bChannelDto {
  @IsUUID('all')
  catalogId: string;
}

// The workspace is the request's RLS context, not a field: see `findWinningCandidate`
export class ResolveCatalogChannelDto {
  @IsEnum(CatalogChannelTypeValues)
  type: CatalogChannelType;

  @IsOptional()
  @IsUUID('all')
  appId?: string | null;

  @IsOptional()
  @IsUUID('all')
  terminalId?: string | null;
}

import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { type CatalogChannelType, CatalogChannelTypeValues } from '@/db/schema';

// appId absent means the fallback binding every unnamed caller resolves to
export class CreateCatalogChannelDto {
  @IsEnum(CatalogChannelTypeValues)
  type: CatalogChannelType;

  @IsUUID('all')
  catalogId: string;

  @IsOptional()
  @IsUUID('all')
  appId?: string | null;
}

export class UpdateCatalogChannelDto {
  @IsUUID('all')
  channelId: string;

  @IsUUID('all')
  catalogId: string;
}

export class ResolveCatalogChannelDto {
  @IsEnum(CatalogChannelTypeValues)
  type: CatalogChannelType;

  @IsOptional()
  @IsUUID('all')
  legalEntityId?: string | null;

  @IsOptional()
  @IsUUID('all')
  siteId?: string | null;

  @IsOptional()
  @IsUUID('all')
  appId?: string | null;

  @IsOptional()
  @IsUUID('all')
  terminalId?: string | null;
}

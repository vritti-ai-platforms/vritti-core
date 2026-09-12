import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { type CatalogChannelType, CatalogChannelTypeValues } from '@/db/schema';

export class CreateCatalogChannelDto {
  @IsUUID('all')
  catalogId: string;

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

export class UpdateCatalogChannelDto {
  @IsUUID('all')
  id: string;

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

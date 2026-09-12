import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

// Declared here rather than imported — the gateway forwards to commerce, it does not share its schema
const CHANNEL_TYPES = ['APP', 'POS', 'B2B'] as const;

export class CreateCatalogChannelDto {
  @ApiProperty({ description: 'Catalog this channel sells' })
  @IsUUID('all')
  catalogId: string;

  @ApiProperty({ enum: CHANNEL_TYPES })
  @IsEnum(CHANNEL_TYPES)
  type: (typeof CHANNEL_TYPES)[number];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  legalEntityId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  siteId?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Named app; omit for any app' })
  @IsOptional()
  @IsUUID('all')
  appId?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Named till; omit for any till' })
  @IsOptional()
  @IsUUID('all')
  terminalId?: string | null;
}

export class RepointCatalogChannelDto {
  @ApiProperty({ description: 'Catalog this channel should sell from now on' })
  @IsUUID('all')
  catalogId: string;
}

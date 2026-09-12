import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

const CHANNEL_TYPES = ['APP', 'POS', 'B2B'] as const;

export class ResolveCatalogChannelQueryDto {
  @ApiProperty({ enum: CHANNEL_TYPES })
  @IsEnum(CHANNEL_TYPES)
  type: (typeof CHANNEL_TYPES)[number];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  legalEntityId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  siteId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  appId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  terminalId?: string;
}

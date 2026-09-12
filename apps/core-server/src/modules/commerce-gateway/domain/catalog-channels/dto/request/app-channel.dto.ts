import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateAppChannelDto {
  @ApiProperty({ description: 'Catalog this channel should sell from now on' })
  @IsUUID('all')
  catalogId: string;
}

export class CreateAppChannelDto {
  @ApiProperty({ description: 'Catalog this channel sells' })
  @IsUUID('all')
  catalogId: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Named app. Omit for the fallback every unnamed caller resolves to.',
  })
  @IsOptional()
  @IsUUID('all')
  appId?: string | null;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateAppChannelDto {
  @ApiProperty({ description: 'Catalog this channel should sell from now on' })
  @IsUUID('all')
  catalogId: string;
}

// One DTO per channel type: each names a different target, and the database rejects the combinations
// the others allow. A shared DTO carrying every target column would accept a B2B channel with an app.
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

export class CreatePosChannelDto {
  @ApiProperty({ description: 'Catalog this channel sells' })
  @IsUUID('all')
  catalogId: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Named POS terminal. Omit to sell this catalog at every terminal this workspace covers.',
  })
  @IsOptional()
  @IsUUID('all')
  terminalId?: string | null;
}

export class CreateB2bChannelDto {
  @ApiProperty({ description: 'Catalog this channel sells' })
  @IsUUID('all')
  catalogId: string;
}

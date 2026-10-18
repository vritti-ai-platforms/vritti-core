import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

export class UpsertAppChannelDto {
  @ApiProperty({ description: 'Catalog this channel carries' })
  @IsUUID('7')
  catalogId: string;

  @ApiPropertyOptional({
    description: 'Named app. Omit for the fallback every unnamed caller resolves to.',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsUUID('7')
  appId?: string;
}

export class UpsertPosChannelDto {
  @ApiProperty({ description: 'Catalog this channel carries' })
  @IsUUID('7')
  catalogId: string;

  @ApiPropertyOptional({
    description: 'Named POS terminal. Omit to carry this catalog at every terminal this workspace covers.',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsUUID('7')
  terminalId?: string;
}

export class UpsertB2bChannelDto {
  @ApiProperty({ description: 'Catalog this channel carries' })
  @IsUUID('7')
  catalogId: string;

  @ApiPropertyOptional({
    description: 'Named wholesale site. Omit for the fallback every unnamed company buyer resolves to.',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsUUID('7')
  appId?: string;
}

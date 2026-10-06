import { IsUUID, ValidateIf } from 'class-validator';

// One DTO per channel type, because each type names a different target and the database rejects the
// combinations the others allow. A shared DTO carrying `type` plus every target column lets
// { type: 'B2B', appId } through validation and fails it on a CHECK constraint instead.

// appId absent means the fallback every unnamed caller resolves to
export class UpsertAppChannelDto {
  @IsUUID('7')
  catalogId: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsUUID('7')
  appId?: string;
}

// terminalId absent means every terminal in reach of this workspace
export class UpsertPosChannelDto {
  @IsUUID('7')
  catalogId: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsUUID('7')
  terminalId?: string;
}

// appId absent means the fallback every unnamed wholesale caller resolves to
export class UpsertB2bChannelDto {
  @IsUUID('7')
  catalogId: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsUUID('7')
  appId?: string;
}

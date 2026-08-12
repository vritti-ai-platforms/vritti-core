import { ApiProperty } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsString, Matches, MaxLength } from 'class-validator';

// The git namespace IS the org subdomain (lowercase, digits, hyphens, max 40 — Gitea's own name limit).
// Signed callers pass it in the body because there is no session host to resolve it from.
const OWNER_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

// Signed-internal package listing: the standard select query plus the gitea namespace to scope to
export class PackageSelectBodyDto extends SelectOptionsQueryDto {
  @ApiProperty({ example: 'acme', description: 'Gitea namespace (org subdomain) whose packages to list' })
  @IsString()
  @MaxLength(40)
  @Matches(OWNER_PATTERN, { message: 'Owner must be a lowercase namespace (letters, digits, hyphens)' })
  owner: string;
}

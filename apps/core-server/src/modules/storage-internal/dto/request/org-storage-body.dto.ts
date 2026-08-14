import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

// The org namespace IS the org subdomain (lowercase, digits, hyphens, max 40). Signed callers pass it in the body
// because there is no session host to resolve it from — the same identifier the gitea internal endpoints accept.
const OWNER_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

// Signed-internal storage lookup: the org subdomain whose storage descriptor to return
export class OrgStorageBodyDto {
  @ApiProperty({ example: 'acme', description: 'Organization subdomain whose storage descriptor to return' })
  @IsString()
  @MaxLength(40)
  @Matches(OWNER_PATTERN, { message: 'Owner must be a lowercase namespace (letters, digits, hyphens)' })
  owner: string;
}

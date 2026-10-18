import { ApiProperty } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsString, Matches, MaxLength } from 'class-validator';

const OWNER_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

// Signed-internal package listing: the standard select query plus the gitea namespace to scope to
export class PackageSelectBodyDto extends SelectOptionsQueryDto {
  @ApiProperty({ example: 'acme', description: 'Gitea namespace (org subdomain) whose packages to list' })
  @IsString()
  @MaxLength(40)
  @Matches(OWNER_PATTERN, { message: 'Owner must be a lowercase namespace (letters, digits, hyphens)' })
  owner: string;
}

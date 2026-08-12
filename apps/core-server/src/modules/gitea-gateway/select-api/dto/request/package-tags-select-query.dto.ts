import { ApiProperty } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsString, Matches, MaxLength } from 'class-validator';

// Container package names are lowercase image paths — letters, digits and the separators `._-/`.
// The value is sent to Gitea as the `q` name filter (never interpolated into a URL path), so this
// pattern is input hygiene rather than a traversal guard.
const PACKAGE_NAME_PATTERN = /^[a-z0-9]+(?:[._\-/][a-z0-9]+)*$/;

// The standard select query plus the container package whose tags are being listed
export class PackageTagsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiProperty({ example: 'storefront', description: 'Container package name whose tags to list' })
  @IsString()
  @MaxLength(255)
  @Matches(PACKAGE_NAME_PATTERN, { message: 'Package name must be a lowercase image path' })
  package: string;
}

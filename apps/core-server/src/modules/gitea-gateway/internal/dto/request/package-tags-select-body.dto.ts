import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';
import { PackageTagsSelectQueryDto } from '../../../select-api/dto/request/package-tags-select-query.dto';

const OWNER_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

// Signed-internal package-tag listing: the package-tags select query plus the gitea namespace to scope to
export class PackageTagsSelectBodyDto extends PackageTagsSelectQueryDto {
  @ApiProperty({ example: 'acme', description: 'Gitea namespace (org subdomain) whose package tags to list' })
  @IsString()
  @MaxLength(40)
  @Matches(OWNER_PATTERN, { message: 'Owner must be a lowercase namespace (letters, digits, hyphens)' })
  owner: string;
}

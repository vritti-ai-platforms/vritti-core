import { ApiProperty } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsString, Matches, MaxLength } from 'class-validator';

const PACKAGE_NAME_PATTERN = /^[a-z0-9]+(?:[._\-/][a-z0-9]+)*$/;

// The standard select query plus the container package whose tags are being listed
export class PackageTagsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiProperty({ example: 'storefront', description: 'Container package name whose tags to list' })
  @IsString()
  @MaxLength(255)
  @Matches(PACKAGE_NAME_PATTERN, { message: 'Package name must be a lowercase image path' })
  package: string;
}

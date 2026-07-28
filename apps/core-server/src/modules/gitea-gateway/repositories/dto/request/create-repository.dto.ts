import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// A Gitea repository name is not a Vritti entity code — it permits dots and underscores,
// so IsCode() does not apply here.
const REPOSITORY_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export class CreateRepositoryDto {
  @ApiProperty({ example: 'billing-service' })
  @Trim({ nullify: false })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(REPOSITORY_NAME_PATTERN, { message: 'Letters, numbers, dots, underscores, and hyphens only' })
  name: string;

  @ApiPropertyOptional({ example: 'Invoicing and payment runs' })
  @IsOptional()
  @Trim({ nullify: false })
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ default: true, description: 'Repositories are private unless opted out' })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

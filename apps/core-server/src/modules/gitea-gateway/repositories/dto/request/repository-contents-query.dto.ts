import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

// A repository-relative path: no leading slash, and no `..` segment. The path is interpolated into
// the Gitea request URL, so a traversal segment could climb out of the repository and reach another
// endpoint under the site-admin token. Rejected here and percent-encoded again in the service.
const SAFE_REPO_PATH_PATTERN = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$)).*$/;

// Git forbids spaces and the glob metacharacters in ref names, so this covers branches, tags and SHAs
const REF_PATTERN = /^[A-Za-z0-9._\-/]+$/;

export class RepositoryContentsQueryDto {
  @ApiPropertyOptional({ example: 'src/components', description: 'Repository-relative path; empty means the root' })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  @Matches(SAFE_REPO_PATH_PATTERN, { message: 'Path must be repository-relative and cannot contain ".."' })
  path?: string;

  @ApiPropertyOptional({
    example: 'main',
    description: "Branch, tag or commit; defaults to the repository's default branch",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(REF_PATTERN, { message: 'Letters, numbers, dots, underscores, hyphens, and slashes only' })
  ref?: string;
}

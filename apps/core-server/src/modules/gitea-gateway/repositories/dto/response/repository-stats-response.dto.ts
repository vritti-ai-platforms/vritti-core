import { ApiProperty } from '@nestjs/swagger';

// Counts only — each comes from an x-total-count header on a limit=1 request, so no payload is fetched.
export class RepositoryStatsResponseDto {
  @ApiProperty({ example: 42, description: 'Commits reachable from the requested ref' })
  commits: number;

  @ApiProperty({ example: 2 })
  branches: number;

  @ApiProperty({ example: 0 })
  tags: number;

  static from(commits: number, branches: number, tags: number): RepositoryStatsResponseDto {
    const dto = new RepositoryStatsResponseDto();
    dto.commits = commits;
    dto.branches = branches;
    dto.tags = tags;
    return dto;
  }
}

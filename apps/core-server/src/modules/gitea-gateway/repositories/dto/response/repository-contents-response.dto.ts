import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type GiteaEntryType = 'file' | 'dir' | 'symlink' | 'submodule';

// Sort rank putting directories ahead of every other entry type
const directoryFirst = (type: GiteaEntryType): number => (type === 'dir' ? 0 : 1);

// Raw contents shape returned by the Gitea REST API — snake_case mirrors the wire format.
// File content is deliberately absent: this gateway browses directories, it does not serve file bodies.
export interface GiteaApiContents {
  name: string;
  path: string;
  sha: string;
  type: GiteaEntryType;
  size: number;
  last_commit_sha?: string | null;
  last_commit_message?: string | null;
  // An LFS-tracked entry's `size` is its ~130-byte pointer's; `lfs_size` is the tracked object's
  lfs_size?: number | null;
}

// Response of /contents-ext. It also carries a `file_contents` field for single files, which this
// gateway ignores — a path resolving to a file yields an empty listing rather than its contents.
export interface GiteaApiContentsExt {
  dir_contents?: GiteaApiContents[] | null;
}

export class RepositoryEntryDto {
  @ApiProperty({ example: 'index.html' })
  name: string;

  @ApiProperty({ example: 'src/index.html' })
  path: string;

  @ApiProperty({ example: 'file', enum: ['file', 'dir', 'symlink', 'submodule'] })
  entryType: GiteaEntryType;

  @ApiProperty({ example: 2048, description: 'Size in bytes; 0 for directories' })
  size: number;

  @ApiPropertyOptional({ example: 'Add landing page hero' })
  lastCommitMessage: string | null;

  @ApiPropertyOptional({ example: 'a1b2c3d4' })
  lastCommitSha: string | null;

  // Creates a DTO from a raw Gitea contents entry
  static from(entry: GiteaApiContents): RepositoryEntryDto {
    const dto = new RepositoryEntryDto();
    dto.name = entry.name;
    dto.path = entry.path;
    dto.entryType = entry.type;
    // An LFS entry's `size` is its pointer's; report the tracked object's size instead
    dto.size = entry.lfs_size ?? entry.size;
    // Only present when the caller asked for commit metadata
    dto.lastCommitMessage = entry.last_commit_message?.trim() || null;
    dto.lastCommitSha = entry.last_commit_sha ?? null;
    return dto;
  }
}

export class RepositoryContentsResponseDto {
  @ApiProperty({ type: [RepositoryEntryDto] })
  entries: RepositoryEntryDto[];

  // Builds a directory listing, directories first and then files, alphabetically within each group
  static from(entries: GiteaApiContents[]): RepositoryContentsResponseDto {
    const dto = new RepositoryContentsResponseDto();
    dto.entries = entries
      .map(RepositoryEntryDto.from)
      .sort((a, b) => directoryFirst(a.entryType) - directoryFirst(b.entryType) || a.name.localeCompare(b.name));
    return dto;
  }
}

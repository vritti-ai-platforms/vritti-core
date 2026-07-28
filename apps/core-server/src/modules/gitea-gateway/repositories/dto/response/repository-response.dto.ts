import { ApiProperty } from '@nestjs/swagger';

// Raw repository shape returned by the Gitea REST API — snake_case mirrors the wire format.
// Kept beside the DTO that maps it so the two stay in step.
export interface GiteaApiRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  empty: boolean;
  size: number;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
}

export class RepositoryResponseDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'billing-service' })
  name: string;

  @ApiProperty({ example: 'wine-mart/billing-service' })
  fullName: string;

  @ApiProperty({ example: 'Invoicing and payment runs' })
  description: string;

  @ApiProperty({ example: true })
  isPrivate: boolean;

  @ApiProperty({ example: false })
  isEmpty: boolean;

  @ApiProperty({ example: 1024, description: 'Repository size in KiB' })
  size: number;

  @ApiProperty({ example: 'http://localhost:3300/wine-mart/billing-service' })
  htmlUrl: string;

  @ApiProperty({ example: 'http://localhost:3300/wine-mart/billing-service.git' })
  cloneUrl: string;

  @ApiProperty({ example: 'git@localhost:wine-mart/billing-service.git' })
  sshUrl: string;

  @ApiProperty({ example: 'main' })
  defaultBranch: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  // Creates a DTO from a raw Gitea repository payload
  static from(repository: GiteaApiRepository): RepositoryResponseDto {
    const dto = new RepositoryResponseDto();
    dto.id = repository.id;
    dto.name = repository.name;
    dto.fullName = repository.full_name;
    dto.description = repository.description ?? '';
    dto.isPrivate = repository.private;
    dto.isEmpty = repository.empty;
    dto.size = repository.size;
    dto.htmlUrl = repository.html_url;
    dto.cloneUrl = repository.clone_url;
    dto.sshUrl = repository.ssh_url;
    dto.defaultBranch = repository.default_branch;
    dto.createdAt = repository.created_at;
    dto.updatedAt = repository.updated_at;
    return dto;
  }
}

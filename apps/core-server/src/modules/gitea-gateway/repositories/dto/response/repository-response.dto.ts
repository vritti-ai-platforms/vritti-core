import { ApiProperty } from '@nestjs/swagger';

const GITEA_SSH_PORT = 2222;

export interface GiteaApiRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
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

  @ApiProperty({ example: 'Invoicing and payment runs', nullable: true })
  description: string | null;

  @ApiProperty({ example: true })
  isPrivate: boolean;

  @ApiProperty({ example: false })
  isEmpty: boolean;

  @ApiProperty({ example: 1024, description: 'Repository size in KiB' })
  size: number;

  @ApiProperty({ example: 'https://git.example.com/wine-mart/billing-service' })
  htmlUrl: string;

  @ApiProperty({ example: 'https://git.example.com/wine-mart/billing-service.git' })
  cloneUrl: string;

  @ApiProperty({ example: 'ssh://git@git.example.com:2222/wine-mart/billing-service.git' })
  sshUrl: string;

  @ApiProperty({ example: 'main' })
  defaultBranch: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  // Creates a DTO from a raw Gitea repository payload, deriving git URLs from BASE_DOMAIN
  static from(repository: GiteaApiRepository, baseDomain: string): RepositoryResponseDto {
    const dto = new RepositoryResponseDto();
    dto.id = repository.id;
    dto.name = repository.name;
    dto.fullName = repository.full_name;
    dto.description = repository.description;
    dto.isPrivate = repository.private;
    dto.isEmpty = repository.empty;
    dto.size = repository.size;
    const gitHost = `git.${baseDomain}`;
    dto.htmlUrl = `https://${gitHost}/${repository.full_name}`;
    dto.cloneUrl = `https://${gitHost}/${repository.full_name}.git`;
    dto.sshUrl = `ssh://git@${gitHost}:${GITEA_SSH_PORT}/${repository.full_name}.git`;
    dto.defaultBranch = repository.default_branch;
    dto.createdAt = repository.created_at;
    dto.updatedAt = repository.updated_at;
    return dto;
  }
}

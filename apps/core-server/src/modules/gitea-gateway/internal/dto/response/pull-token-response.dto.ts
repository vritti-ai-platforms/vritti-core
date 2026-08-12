import { ApiProperty } from '@nestjs/swagger';

// Pull credentials handed back to the caller for authenticating container image pulls against the
// Gitea package registry. `token` is the read:package Personal Access Token the deployment agent
// provisioned and stored — core reads it straight from the credentials row and never mints it.
export class PullTokenResponseDto {
  @ApiProperty({ description: 'Gitea container registry host', example: 'git.example.com' })
  registry: string;

  @ApiProperty({ description: 'Gitea user the token belongs to', example: 'gitea-core' })
  username: string;

  @ApiProperty({ description: 'read:package pull token provisioned by the agent', example: 'a1b2c3d4e5f6...' })
  token: string;

  // Assembles the response from its three independently sourced parts
  static from(registry: string, username: string, token: string): PullTokenResponseDto {
    const dto = new PullTokenResponseDto();
    dto.registry = registry;
    dto.username = username;
    dto.token = token;
    return dto;
  }
}

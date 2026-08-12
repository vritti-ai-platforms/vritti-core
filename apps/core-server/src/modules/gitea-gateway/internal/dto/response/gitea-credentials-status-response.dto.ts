import { ApiProperty } from '@nestjs/swagger';

// Signed agent→core existence probe result — whether the singleton credentials row is fully provisioned
export class GiteaCredentialsStatusResponseDto {
  @ApiProperty({ description: 'Whether the agent has already provisioned the Gitea credentials row' })
  exists: boolean;
}

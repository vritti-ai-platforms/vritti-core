import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

// Signed agent→core payload carrying the Gitea credentials the deployment agent just provisioned or rotated
export class GiteaCredentialsBodyDto {
  // require_tld:false so the internal stack URL the agent provisions (e.g. http://gitea:3000, a Docker
  // service hostname with no dot/TLD) is accepted — that's the endpoint core reaches Gitea at.
  @ApiProperty({ description: 'Base Gitea URL the agent provisioned', example: 'http://gitea:3000' })
  @IsUrl({ require_tld: false })
  baseUrl: string;

  @ApiProperty({ description: 'All-scopes admin PAT core authenticates every Gitea call with' })
  @IsString()
  @IsNotEmpty()
  coreToken: string;

  @ApiProperty({ description: 'read:package pull PAT served to the ws-agent for image pulls' })
  @IsString()
  @IsNotEmpty()
  pullToken: string;
}

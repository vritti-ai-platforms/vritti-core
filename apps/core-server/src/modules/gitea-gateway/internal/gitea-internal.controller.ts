import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf } from '@vritti/api-sdk/auth';
import type { SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import { AgentSignatureGuard } from '@/security/guards/agent-signature.guard';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';
import { SelectApiGatewayService } from '../select-api/services/select-api-gateway.service';
import { GiteaCredentialsService } from '../services/gitea-credentials.service';
import {
  ApiGetCredentialsStatus,
  ApiGetPullToken,
  ApiInternalSelectPackages,
  ApiInternalSelectPackageTags,
  ApiUpdateGiteaCredentials,
} from './docs/gitea-internal.docs';
import { GiteaCredentialsBodyDto } from './dto/request/gitea-credentials-body.dto';
import { PackageSelectBodyDto } from './dto/request/package-select-body.dto';
import { PackageTagsSelectBodyDto } from './dto/request/package-tags-select-body.dto';
import { GiteaCredentialsStatusResponseDto } from './dto/response/gitea-credentials-status-response.dto';
import { PullTokenResponseDto } from './dto/response/pull-token-response.dto';

// Guards are applied per-method, not class-wide: the credential-write endpoint is signed by the deployment
// agent (AgentSignatureGuard / AGENT_PUBLIC_KEY) while the reads are signed by cloud (CloudSignatureGuard).
@ApiTags('Gitea - Internal')
@Controller('gitea/internal')
@Public()
@SkipCsrf()
export class GiteaInternalController {
  private readonly logger = new Logger(GiteaInternalController.name);

  constructor(
    private readonly credentialsService: GiteaCredentialsService,
    private readonly selectApiGatewayService: SelectApiGatewayService,
  ) {}

  // Upserts the agent-provisioned Gitea credentials into the singleton row and refreshes the cache
  @Put('credentials')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AgentSignatureGuard)
  @ApiUpdateGiteaCredentials()
  async updateCredentials(@Body() body: GiteaCredentialsBodyDto): Promise<SuccessResponseDto> {
    this.logger.log('PUT /gitea/internal/credentials');
    await this.credentialsService.replace(body);
    return { success: true, message: 'Gitea credentials updated.' };
  }

  // Signed existence-probe the agent calls before minting, so a plain restart never rotates tokens
  @Get('credentials/status')
  @UseGuards(AgentSignatureGuard)
  @ApiGetCredentialsStatus()
  async credentialsStatus(): Promise<GiteaCredentialsStatusResponseDto> {
    const exists = await this.credentialsService.exists();
    this.logger.log(`GET /gitea/internal/credentials/status (exists=${exists})`);
    return { exists };
  }

  // Returns the read:package pull credential the agent stored, for website image pulls (takes no body)
  @Post('pull-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CloudSignatureGuard)
  @ApiGetPullToken()
  async getPullToken(): Promise<PullTokenResponseDto> {
    this.logger.log('POST /gitea/internal/pull-token');
    const cred = await this.credentialsService.getPullCred();
    return PullTokenResponseDto.from(cred.registry, cred.username, cred.token);
  }

  // Signed-caller equivalent of the session-gated package select; owner comes from the trusted signed body
  @Post('packages')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CloudSignatureGuard)
  @ApiInternalSelectPackages()
  selectPackages(@Body() body: PackageSelectBodyDto): Promise<SelectQueryResult> {
    this.logger.log(`POST /gitea/internal/packages (owner=${body.owner}, search=${body.search ?? 'none'})`);
    return this.selectApiGatewayService.selectPackages(body.owner, body);
  }

  // Signed-caller equivalent of the session-gated package-tags select; owner comes from the trusted signed body
  @Post('package-tags')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CloudSignatureGuard)
  @ApiInternalSelectPackageTags()
  selectPackageTags(@Body() body: PackageTagsSelectBodyDto): Promise<SelectQueryResult> {
    this.logger.log(`POST /gitea/internal/package-tags (owner=${body.owner}, package=${body.package})`);
    return this.selectApiGatewayService.selectPackageTags(body.owner, body);
  }
}

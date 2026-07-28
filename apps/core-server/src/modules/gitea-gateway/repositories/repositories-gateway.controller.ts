import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_REPOSITORIES } from '@vritti/commerce-permissions/repositories';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgSubdomain } from '@/security/decorators';
import { CreateRepositoryDto } from './dto/request/create-repository.dto';
import { ListRepositoriesQueryDto } from './dto/request/list-repositories-query.dto';
import { RepositoryContentsQueryDto } from './dto/request/repository-contents-query.dto';
import type { BranchListResponseDto } from './dto/response/branch-list-response.dto';
import type { RepositoryContentsResponseDto } from './dto/response/repository-contents-response.dto';
import type { RepositoryListResponseDto } from './dto/response/repository-list-response.dto';
import type { RepositoryResponseDto } from './dto/response/repository-response.dto';
import type { RepositoryStatsResponseDto } from './dto/response/repository-stats-response.dto';
import { RepositoriesGatewayService } from './services/repositories-gateway.service';

@ApiTags('Gitea - Repositories')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(ORG_REPOSITORIES.featureCode)
@Controller('repositories')
export class RepositoriesGatewayController {
  private readonly logger = new Logger(RepositoriesGatewayController.name);

  constructor(private readonly repositoriesGatewayService: RepositoriesGatewayService) {}

  @Get()
  @RequirePermission(ORG_REPOSITORIES.view)
  findAll(
    @OrgSubdomain() subdomain: string,
    @Query() query: ListRepositoriesQueryDto,
  ): Promise<RepositoryListResponseDto> {
    this.logger.log(`GET /gitea-api/repositories (org=${subdomain})`);
    return this.repositoriesGatewayService.findAll(subdomain, query);
  }

  @Get(':name')
  @RequirePermission(ORG_REPOSITORIES.view)
  findOne(@OrgSubdomain() subdomain: string, @Param('name') name: string): Promise<RepositoryResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/${name} (org=${subdomain})`);
    return this.repositoriesGatewayService.findOne(subdomain, name);
  }

  @Get(':name/stats')
  @RequirePermission(ORG_REPOSITORIES.view)
  getStats(
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Query('ref') ref?: string,
  ): Promise<RepositoryStatsResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/${name}/stats (org=${subdomain}, ref=${ref ?? 'default'})`);
    return this.repositoriesGatewayService.getStats(subdomain, name, ref);
  }

  @Get(':name/branches')
  @RequirePermission(ORG_REPOSITORIES.view)
  listBranches(@OrgSubdomain() subdomain: string, @Param('name') name: string): Promise<BranchListResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/${name}/branches (org=${subdomain})`);
    return this.repositoriesGatewayService.listBranches(subdomain, name);
  }

  @Get(':name/contents')
  @RequirePermission(ORG_REPOSITORIES.view)
  getContents(
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Query() query: RepositoryContentsQueryDto,
  ): Promise<RepositoryContentsResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/${name}/contents (org=${subdomain}, path=${query.path ?? ''})`);
    return this.repositoriesGatewayService.getContents(subdomain, name, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_REPOSITORIES.add)
  create(
    @OrgSubdomain() subdomain: string,
    @Body() dto: CreateRepositoryDto,
  ): Promise<CreateResponseDto<RepositoryResponseDto>> {
    this.logger.log(`POST /gitea-api/repositories (org=${subdomain}, name=${dto.name})`);
    return this.repositoriesGatewayService.create(subdomain, dto);
  }

  @Delete(':name')
  @RequirePermission(ORG_REPOSITORIES.delete)
  remove(@OrgSubdomain() subdomain: string, @Param('name') name: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /gitea-api/repositories/${name} (org=${subdomain})`);
    return this.repositoriesGatewayService.remove(subdomain, name);
  }
}

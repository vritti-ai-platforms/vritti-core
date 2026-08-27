import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/database';
import { ORG_REPOSITORIES } from '@vritti/gitea-permissions/repository';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgSubdomain } from '@/security/decorators';
import {
  ApiSelectImages,
  ApiSelectPackages,
  ApiSelectPackageTags,
  ApiSelectRepositories,
} from './docs/select-api.docs';
import { PackageTagsSelectQueryDto } from './dto/request/package-tags-select-query.dto';
import { SelectApiGatewayService } from './services/select-api-gateway.service';

@ApiTags('Gitea - Select')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_REPOSITORIES.featureCode)
@Controller('select-api')
export class SelectApiController {
  private readonly logger = new Logger(SelectApiController.name);

  constructor(private readonly selectApiGatewayService: SelectApiGatewayService) {}

  // Returns paginated repository options for select dropdowns
  @Get('repositories')
  @RequirePermission(ORG_REPOSITORIES.view)
  @ApiSelectRepositories()
  selectRepositories(
    @OrgSubdomain() subdomain: string,
    @Query() query: SelectOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    this.logger.log(`GET /gitea-api/select-api/repositories (org=${subdomain}, search=${query.search ?? 'none'})`);
    return this.selectApiGatewayService.selectRepositories(subdomain, query);
  }

  // Returns paginated container package options for select dropdowns
  @Get('packages')
  @RequirePermission(ORG_REPOSITORIES.packages.view)
  @ApiSelectPackages()
  selectPackages(@OrgSubdomain() subdomain: string, @Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`GET /gitea-api/select-api/packages (org=${subdomain}, search=${query.search ?? 'none'})`);
    return this.selectApiGatewayService.selectPackages(subdomain, query);
  }

  // Returns paginated combined image options (`name:tag`) for select dropdowns — one per package version
  @Get('images')
  @RequirePermission(ORG_REPOSITORIES.view)
  @ApiSelectImages()
  selectImages(@OrgSubdomain() subdomain: string, @Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`GET /gitea-api/select-api/images (org=${subdomain}, search=${query.search ?? 'none'})`);
    return this.selectApiGatewayService.selectImages(subdomain, query);
  }

  // Returns paginated tag (version) options for one container package
  @Get('package-tags')
  @RequirePermission(ORG_REPOSITORIES.packages.view)
  @ApiSelectPackageTags()
  selectPackageTags(
    @OrgSubdomain() subdomain: string,
    @Query() query: PackageTagsSelectQueryDto,
  ): Promise<SelectQueryResult> {
    this.logger.log(`GET /gitea-api/select-api/package-tags (org=${subdomain}, package=${query.package})`);
    return this.selectApiGatewayService.selectPackageTags(subdomain, query);
  }
}

import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession } from '@vritti/api-sdk/auth';
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/database';
import { ORG_REPOSITORIES } from '@vritti/commerce-permissions/repositories';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgSubdomain } from '@/security/decorators';
import { SelectApiGatewayService } from './services/select-api-gateway.service';

@ApiTags('Gitea - Select')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(ORG_REPOSITORIES.featureCode)
@Controller('select-api')
export class SelectApiController {
  private readonly logger = new Logger(SelectApiController.name);

  constructor(private readonly selectApiGatewayService: SelectApiGatewayService) {}

  // Returns paginated repository options for select dropdowns
  @Get('repositories')
  @RequirePermission(ORG_REPOSITORIES.view)
  selectRepositories(
    @OrgSubdomain() subdomain: string,
    @Query() query: SelectOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    this.logger.log(`GET /gitea-api/select-api/repositories (org=${subdomain}, search=${query.search ?? 'none'})`);
    return this.selectApiGatewayService.selectRepositories(subdomain, query);
  }
}

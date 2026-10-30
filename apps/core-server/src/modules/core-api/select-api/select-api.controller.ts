import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import { SessionTypeValues } from '@/db/schema';
import { AppDomainService } from '@/modules/domain/app/services/app.service';
import { SiteDomainRepository } from '@/modules/domain/site/repositories/site.repository';
import { LegalEntityId, OrgId } from '@/security/decorators';
import { ApiSelectApps } from './docs/select-api.docs';
import { SiteSelectQueryDto } from './dto/site-select-query.dto';

@ApiTags('Core - Select')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@Controller('select-api')
export class CoreSelectApiController {
  private readonly logger = new Logger(CoreSelectApiController.name);

  constructor(
    private readonly appService: AppDomainService,
    private readonly siteRepository: SiteDomainRepository,
  ) {}

  // Returns paginated app options for select dropdowns
  @Get('apps')
  @ApiSelectApps()
  selectApps(@OrgId() orgId: string, @Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`GET /select-api/apps (search=${query.search ?? 'none'})`);
    return this.appService.findForSelect(orgId, query);
  }

  // Returns the session legal entity's active sites for select dropdowns, optionally only the given ones; outside a
  // legal entity there are none
  @Get('sites')
  selectSites(
    @LegalEntityId() legalEntityId: string | undefined,
    @Query() query: SiteSelectQueryDto,
  ): Promise<SelectQueryResult> {
    this.logger.log(`GET /select-api/sites (search=${query.search ?? 'none'})`);
    if (!legalEntityId) return Promise.resolve({ options: [], hasMore: false, totalCount: 0 });
    return this.siteRepository.findForSelectOptions(legalEntityId, query, query.ids);
  }
}

import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/database';
import { SessionTypeValues } from '@/db/schema';
import { AppDomainService } from '@/modules/domain/app/services/app.service';
import { OrgId } from '@/security/decorators';
import { ApiSelectApps } from './docs/select-api.docs';

@ApiTags('Core - Select')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@Controller('select-api')
export class CoreSelectApiController {
  private readonly logger = new Logger(CoreSelectApiController.name);

  constructor(private readonly appService: AppDomainService) {}

  // Returns paginated app options for select dropdowns
  @Get('apps')
  @ApiSelectApps()
  selectApps(@OrgId() orgId: string, @Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`GET /select-api/apps (search=${query.search ?? 'none'})`);
    return this.appService.findForSelect(orgId, query);
  }
}

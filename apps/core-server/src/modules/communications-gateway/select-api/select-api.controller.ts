import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { ApiWhatsappAccountsSelect } from './docs/select-api.docs';

@ApiTags('Communications - Select')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@Controller('select-api')
// Feature is declared per route, not on the class: this controller serves selectors for the whole
// communications gateway, so a class-level @RequireFeature would gate a future selector by whichever
// feature happened to be added first.
export class SelectApiController {
  private readonly logger = new Logger(SelectApiController.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns paginated WhatsApp account options for select dropdowns
  @Get('whatsapp-accounts')
  @RequireFeature(ORG_WHATSAPP_ACCOUNTS.featureCode)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.view)
  @ApiWhatsappAccountsSelect()
  selectWhatsappAccounts(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`GET /communications-api/select-api/whatsapp-accounts (search=${query.search ?? 'none'})`);
    return this.nats.send<SelectQueryResult>('communications', 'select.whatsappAccounts', query);
  }
}

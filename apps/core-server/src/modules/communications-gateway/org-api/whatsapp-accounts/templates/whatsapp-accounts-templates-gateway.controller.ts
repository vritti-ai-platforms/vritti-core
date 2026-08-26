import type { WhatsappTemplateTableResponseDto } from '@communications/whatsapp-account-templates/dto/response/whatsapp-template-table-response.dto';
import { Controller, Get, Logger, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { ApiGetWhatsappTemplatesTable } from '../docs/whatsapp-accounts-templates-gateway.docs';
import { WhatsappAccountsTemplatesGatewayService } from '../services/whatsapp-accounts-templates-gateway.service';

@ApiTags('Communications - WhatsApp Templates')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(ORG_WHATSAPP_ACCOUNTS.featureCode)
@Controller('whatsapp-accounts/:id/templates')
export class WhatsappAccountsTemplatesGatewayController {
  private readonly logger = new Logger(WhatsappAccountsTemplatesGatewayController.name);

  constructor(private readonly service: WhatsappAccountsTemplatesGatewayService) {}

  // Returns the WABA's message templates data table, rows read live from Meta
  // TEMP: account-level view until templates.view is authored in the cloud catalog (after the full templates feature ships)
  @Get('table')
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.view)
  @ApiGetWhatsappTemplatesTable()
  getTable(
    @UserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<WhatsappTemplateTableResponseDto> {
    this.logger.log(`GET /communications-api/whatsapp-accounts/${id}/templates/table`);
    return this.service.findForTable(userId, id);
  }
}

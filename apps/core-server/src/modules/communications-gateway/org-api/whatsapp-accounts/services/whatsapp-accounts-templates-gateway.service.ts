import type { WhatsappTemplateResponseDto } from '@communications/whatsapp-account-templates/dto/response/whatsapp-template-response.dto';
import type { WhatsappTemplateTableResponseDto } from '@communications/whatsapp-account-templates/dto/response/whatsapp-template-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class WhatsappAccountsTemplatesGatewayService {
  private readonly logger = new Logger(WhatsappAccountsTemplatesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns the WABA's message templates as a data table. The rows come live from Meta — the state
  // round-trip only carries column visibility etc.; Meta cannot sort or filter this list
  async findForTable(userId: string, accountId: string): Promise<WhatsappTemplateTableResponseDto> {
    this.logger.log(`whatsappAccounts.templates.list — account: ${accountId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'communications-org-whatsapp-templates',
    );

    const result = await this.nats.send<WhatsappTemplateResponseDto[]>(
      'communications',
      'org.whatsappAccounts.templates.list',
      { accountId },
    );

    return { result, count: result.length, state, activeViewId };
  }
}

import type { CreateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/create-whatsapp-account.dto';
import type { UpdateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/update-whatsapp-account.dto';
import type { WhatsappAccountResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-response.dto';
import type { WhatsappAccountTableResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class WhatsappAccountsGatewayService {
  private readonly logger = new Logger(WhatsappAccountsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted WhatsApp accounts for the data table
  async findForTable(userId: string): Promise<WhatsappAccountTableResponseDto> {
    this.logger.log('org.whatsappAccounts.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'communications-org-whatsapp-accounts',
    );

    const { result, count } = await this.nats.send<{ result: WhatsappAccountResponseDto[]; count: number }>(
      'communications',
      'org.whatsappAccounts.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Connects a WhatsApp Business Account to this organization
  create(dto: CreateWhatsappAccountDto): Promise<CreateResponseDto<WhatsappAccountResponseDto>> {
    this.logger.log(`whatsappAccounts.create — waba: ${dto.wabaId}`);
    return this.nats.send('communications', 'org.whatsappAccounts.create', dto);
  }

  // Finds a WhatsApp account by ID
  findById(id: string): Promise<WhatsappAccountResponseDto> {
    this.logger.log(`whatsappAccounts.findById — id: ${id}`);
    return this.nats.send('communications', 'org.whatsappAccounts.findById', { id });
  }

  // Updates a WhatsApp account by ID
  update(id: string, dto: UpdateWhatsappAccountDto): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.update — id: ${id}`);
    return this.nats.send('communications', 'org.whatsappAccounts.update', { id, ...dto });
  }

  // Disconnects a WhatsApp account by ID
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.delete — id: ${id}`);
    return this.nats.send('communications', 'org.whatsappAccounts.delete', { id });
  }
}

import type { CreateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/create-whatsapp-account.dto';
import type { UpdateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/update-whatsapp-account.dto';
import type { WhatsappAccountResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-response.dto';
import type { WhatsappAccountTableResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { AppDomainService } from '@/modules/domain/app/services/app.service';

@Injectable()
export class WhatsappAccountsGatewayService {
  private readonly logger = new Logger(WhatsappAccountsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly appService: AppDomainService,
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

  // Disconnects a WhatsApp account by ID, refusing while an app still sends sign-in codes from it
  async delete(id: string, organizationId: string): Promise<SuccessResponseDto> {
    // No foreign key spans the core/communications boundary, so this server is the only place that
    // can see both sides — miss it and a live storefront starts failing at Meta instead
    const dependents = await this.appService.findByOtpAccount(organizationId, id);
    if (dependents.length > 0) {
      const names = dependents.map((app) => app.name).join(', ');
      throw new ConflictException({
        label: 'Account in use',
        detail: `Cannot disconnect this account while ${pluralize('app', dependents.length, true)} send sign-in codes from it: ${names}. Change their WhatsApp OTP configuration first.`,
      });
    }

    this.logger.log(`whatsappAccounts.delete — id: ${id}`);
    return this.nats.send('communications', 'org.whatsappAccounts.delete', { id });
  }
}

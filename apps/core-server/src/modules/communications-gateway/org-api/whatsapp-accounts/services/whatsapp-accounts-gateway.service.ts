import type { ConnectEmbeddedSignupDto } from '@communications/whatsapp-accounts/dto/request/connect-embedded-signup.dto';
import type { UpdateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/update-whatsapp-account.dto';
import type { EmbeddedSignupConfigResponseDto } from '@communications/whatsapp-accounts/dto/response/embedded-signup-config-response.dto';
import type { WhatsappAccountResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-response.dto';
import type { WhatsappAccountTableResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { AppDomainService } from '@/modules/domain/app/services/app.service';

// Must track GRAPH_API_VERSION in communications-service's MetaGraphHttpService: the popup and the
// server-side calls that follow it have to speak the same Graph version.
const GRAPH_API_VERSION = 'v25.0';

@Injectable()
export class WhatsappAccountsGatewayService {
  private readonly logger = new Logger(WhatsappAccountsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly appService: AppDomainService,
    private readonly configService: ConfigService,
  ) {}

  // Public values only — the app secret stays in communications-service, which is where the code
  // exchange happens, so the minted token never crosses NATS
  embeddedSignupConfig(): EmbeddedSignupConfigResponseDto {
    const configId = this.configService.get<string>('META_EMBEDDED_SIGNUP_CONFIG_ID') ?? null;
    return {
      appId: this.configService.getOrThrow<string>('META_CLIENT_ID'),
      configId,
      graphVersion: GRAPH_API_VERSION,
      // Unset until the Meta app's Facebook Login for Business configuration exists, so the UI can
      // hide the button instead of opening a popup that fails
      enabled: Boolean(configId),
    };
  }

  // Connects a WABA from an Embedded Signup result. The authorization code is forwarded, never the
  // token — the exchange and the ownership check both happen downstream.
  connectEmbedded(dto: ConnectEmbeddedSignupDto): Promise<CreateResponseDto<WhatsappAccountResponseDto>> {
    this.logger.log(`whatsappAccounts.connectEmbedded — waba: ${dto.wabaId}, event: ${dto.event}`);
    return this.nats.send('communications', 'org.whatsappAccounts.connectEmbedded', dto);
  }

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

  // Replaces one account's credential from a fresh signup result, keeping its id
  reconnect(id: string, dto: ConnectEmbeddedSignupDto): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.reconnectEmbedded — id: ${id}, waba: ${dto.wabaId}`);
    return this.nats.send('communications', 'org.whatsappAccounts.reconnectEmbedded', { id, ...dto });
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

import type {
  ConfiguredOtpAppResponseDto,
  WhatsappOtpResponseDto,
} from '@communications/whatsapp-otps/dto/response/whatsapp-otp-response.dto';
import type { WhatsappOtpStatsResponseDto } from '@communications/whatsapp-otps/dto/response/whatsapp-otp-stats-response.dto';
import type { WhatsappOtpTableResponseDto } from '@communications/whatsapp-otps/dto/response/whatsapp-otp-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { AppOtpConfig } from '@/db/schema';
import { AppDomainService } from '@/modules/domain/app/services/app.service';

export interface SendOtpResult {
  sent: boolean;
  expiresAt: Date;
  resendAvailableAt: Date;
}

export interface VerifyOtpResult {
  verified: boolean;
}

@Injectable()
export class WhatsappOtpsGatewayService {
  private readonly logger = new Logger(WhatsappOtpsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly appService: AppDomainService,
  ) {}

  // Issues a sign-in code using the sender and template stored on the calling credential
  async send(appId: string, organizationId: string, recipient: string): Promise<SendOtpResult> {
    const app = await this.appService.findInOrg(appId, organizationId);
    const config = app?.otpConfig;
    if (!config) {
      throw new BadRequestException({
        label: 'OTP not configured',
        detail: 'This app has no WhatsApp sign-in code configuration.',
      });
    }

    this.logger.log(`org.whatsappOtps.send — app: ${appId}`);
    const result = await this.nats.send<{ sent: boolean; expiresAt: string; resendAvailableAt: string }>(
      'communications',
      'org.whatsappOtps.send',
      {
        appId,
        accountId: config.accountId,
        phoneNumberId: config.phoneNumberId,
        templateName: config.templateName,
        templateLanguage: config.templateLanguage,
        recipient,
        codeLength: config.codeLength,
        expirySeconds: config.expirySeconds,
        maxAttempts: config.maxAttempts,
        resendCooldownSeconds: config.resendCooldownSeconds,
      },
    );

    // The two timestamps cross NATS as ISO strings, and GraphQLISODateTime serializes anything that is not a
    // Date instance to null. Both fields are non-nullable, so passing the strings straight through fails the
    // whole mutation AFTER the code has already been sent — the caller sees an error for a message that went.
    return {
      sent: result.sent,
      expiresAt: new Date(result.expiresAt),
      resendAvailableAt: new Date(result.resendAvailableAt),
    };
  }

  // Checks a code against the one live for this credential and number
  verify(appId: string, recipient: string, code: string): Promise<VerifyOtpResult> {
    this.logger.log(`org.whatsappOtps.verify — app: ${appId}`);
    return this.nats.send('communications', 'org.whatsappOtps.verify', { appId, recipient, code });
  }

  // Returns paginated, filtered, and sorted codes for the monitoring data table
  async findForTable(userId: string): Promise<WhatsappOtpTableResponseDto> {
    this.logger.log('org.whatsappOtps.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'communications-org-whatsapp-otps',
    );

    const { result, count } = await this.nats.send<{ result: WhatsappOtpResponseDto[]; count: number }>(
      'communications',
      'org.whatsappOtps.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns the aggregates behind the Overview tab
  stats(): Promise<WhatsappOtpStatsResponseDto> {
    this.logger.log('org.whatsappOtps.stats');
    return this.nats.send('communications', 'org.whatsappOtps.stats', {});
  }

  // Apps set up to send sign-in codes. Read from the app rows, so it reflects configuration rather
  // than traffic — an app configured today but not yet used still belongs in this list.
  async findConfiguredApps(organizationId: string): Promise<ConfiguredOtpAppResponseDto[]> {
    const apps = await this.appService.listForOrg(organizationId);
    return apps
      .filter((app) => app.otpConfig)
      .map((app) => ({
        id: app.id,
        name: app.name,
        type: app.type,
        isActive: app.isActive,
        accountId: (app.otpConfig as AppOtpConfig).accountId,
        templateName: (app.otpConfig as AppOtpConfig).templateName,
        expirySeconds: (app.otpConfig as AppOtpConfig).expirySeconds,
      }));
  }
}

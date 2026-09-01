import type {
  ConfiguredSmsOtpAppResponseDto,
  SmsOtpResponseDto,
} from '@communications/sms-otps/dto/response/sms-otp-response.dto';
import type { SmsOtpStatsResponseDto } from '@communications/sms-otps/dto/response/sms-otp-stats-response.dto';
import type { SmsOtpTableResponseDto } from '@communications/sms-otps/dto/response/sms-otp-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { AppSmsOtpConfig } from '@/db/schema';
import { AppDomainService } from '@/modules/domain/app/services/app.service';

export interface SendSmsOtpResult {
  sent: boolean;
  expiresAt: Date;
  resendAvailableAt: Date;
}

export interface VerifySmsOtpResult {
  verified: boolean;
}

@Injectable()
export class SmsOtpsGatewayService {
  private readonly logger = new Logger(SmsOtpsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly appService: AppDomainService,
  ) {}

  // Issues a sign-in code using the provider and code policy stored on the calling credential
  async send(appId: string, organizationId: string, recipient: string): Promise<SendSmsOtpResult> {
    const app = await this.appService.findInOrg(appId, organizationId);
    const config = app?.smsOtpConfig;
    if (!config) {
      throw new BadRequestException({
        label: 'OTP not configured',
        detail: 'This app has no SMS sign-in code configuration.',
      });
    }

    this.logger.log(`org.smsOtps.send — app: ${appId}`);
    const result = await this.nats.send<{ sent: boolean; expiresAt: string; resendAvailableAt: string }>(
      'communications',
      'org.smsOtps.send',
      {
        appId,
        providerId: config.providerId,
        ...(config.senderId ? { senderId: config.senderId } : {}),
        recipient,
        codeLength: config.codeLength,
        expirySeconds: config.expirySeconds,
        maxAttempts: config.maxAttempts,
        resendCooldownSeconds: config.resendCooldownSeconds,
      },
    );

    // The two timestamps cross NATS as ISO strings, and GraphQLISODateTime serializes anything that
    // is not a Date instance to null — so convert before the resolver returns
    return {
      sent: result.sent,
      expiresAt: new Date(result.expiresAt),
      resendAvailableAt: new Date(result.resendAvailableAt),
    };
  }

  // Checks a code against the one live for this credential and number
  verify(appId: string, recipient: string, code: string): Promise<VerifySmsOtpResult> {
    this.logger.log(`org.smsOtps.verify — app: ${appId}`);
    return this.nats.send('communications', 'org.smsOtps.verify', { appId, recipient, code });
  }

  // Returns paginated, filtered, and sorted codes for the monitoring data table
  async findForTable(userId: string): Promise<SmsOtpTableResponseDto> {
    this.logger.log('org.smsOtps.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'communications-org-sms-otps',
    );

    const { result, count } = await this.nats.send<{ result: SmsOtpResponseDto[]; count: number }>(
      'communications',
      'org.smsOtps.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns the aggregates behind the Overview tab
  stats(): Promise<SmsOtpStatsResponseDto> {
    this.logger.log('org.smsOtps.stats');
    return this.nats.send('communications', 'org.smsOtps.stats', {});
  }

  // Apps set up to send SMS sign-in codes. Read from the app rows, so it reflects configuration
  // rather than traffic — an app configured today but not yet used still belongs in this list.
  async findConfiguredApps(organizationId: string): Promise<ConfiguredSmsOtpAppResponseDto[]> {
    const apps = await this.appService.listForOrg(organizationId);
    return apps
      .filter((app) => app.smsOtpConfig)
      .map((app) => ({
        id: app.id,
        name: app.name,
        type: app.type,
        isActive: app.isActive,
        providerId: (app.smsOtpConfig as AppSmsOtpConfig).providerId,
        expirySeconds: (app.smsOtpConfig as AppSmsOtpConfig).expirySeconds,
      }));
  }
}

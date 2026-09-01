import { SmsOtpDto } from '@domain/sms-otps/dto/entity/sms-otp.dto';
import { SendSmsOtpResultDto, type VerifySmsOtpResultDto } from '@domain/sms-otps/dto/entity/sms-otp-result.dto';
import type { SmsOtpStatsDto } from '@domain/sms-otps/dto/entity/sms-otp-stats.dto';
import type { SendSmsOtpDto } from '@domain/sms-otps/dto/request/send-sms-otp.dto';
import type { VerifySmsOtpDto } from '@domain/sms-otps/dto/request/verify-sms-otp.dto';
import { SmsOtpsDomainService } from '@domain/sms-otps/services/sms-otps.service';
import { SmsProviderRegistry } from '@domain/sms-providers/services/sms-provider-transports';
import { SmsProvidersDomainService } from '@domain/sms-providers/services/sms-providers.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/database';

// Orchestrates the domains a send touches — the OTP row, the provider row's credentials, and the
// transport that delivers the message. Domain modules never import each other, so the coordination
// lives here rather than inside any one of them.
@Injectable()
export class SmsOtpsService {
  private readonly logger = new Logger(SmsOtpsService.name);

  constructor(
    private readonly otpsService: SmsOtpsDomainService,
    private readonly providersService: SmsProvidersDomainService,
    private readonly registry: SmsProviderRegistry,
  ) {}

  // Issues a code, delivers it through the configured provider, and records the outcome either way
  async send(dto: SendSmsOtpDto): Promise<SendSmsOtpResultDto> {
    // Resolved first: an inactive or unknown provider fails the request before any row is written
    const config = await this.providersService.resolveSendConfig(dto.providerId);
    const transport = this.registry.resolve(config.provider);

    const prepared = await this.otpsService.startSend(dto, config.provider);

    // Still inside the resend cooldown — nothing was issued and nothing is sent
    if (!prepared.id || !prepared.code) return SendSmsOtpResultDto.from(false, prepared);

    try {
      const { messageId } = await transport.sendOtp({
        recipient: dto.recipient,
        code: prepared.code,
        // The app's own sender wins; the provider row's default fills in otherwise
        senderId: dto.senderId ?? config.senderId,
        credentials: config.credentials,
        appId: dto.appId,
      });

      await this.otpsService.recordSent(prepared.id, messageId);
      this.logger.log(`Sent SMS OTP to ${dto.recipient} for app ${dto.appId} via ${config.provider}`);
      return SendSmsOtpResultDto.from(true, prepared);
    } catch (error) {
      // A failed send stays a row — delivery failure rate is what the Overview tab exists to show
      const message = error instanceof Error ? error.message : 'SMS send failed.';
      await this.otpsService.recordFailure(prepared.id, message);
      this.logger.warn(`SMS OTP send failed for ${dto.recipient} on app ${dto.appId}: ${message}`);
      return SendSmsOtpResultDto.from(false, prepared);
    }
  }

  // Reads below touch one domain only and pass straight through, keeping the controller on one service
  verify(dto: VerifySmsOtpDto): Promise<VerifySmsOtpResultDto> {
    return this.otpsService.verify(dto);
  }

  findForTable(state: TableViewState): Promise<{ result: SmsOtpDto[]; count: number }> {
    return this.otpsService.findForTable(state);
  }

  stats(): Promise<SmsOtpStatsDto> {
    return this.otpsService.stats();
  }

  countForProvider(providerId: string): Promise<number> {
    return this.otpsService.countForProvider(providerId);
  }
}

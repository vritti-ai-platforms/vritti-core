import { WhatsappAccountTemplatesDomainService } from '@domain/whatsapp-account-templates/services/whatsapp-account-templates.service';
import { WhatsappAccountsDomainService } from '@domain/whatsapp-accounts/services/whatsapp-accounts.service';
import type { WhatsappOtpDto } from '@domain/whatsapp-otps/dto/entity/whatsapp-otp.dto';
import {
  SendWhatsappOtpResultDto,
  type VerifyWhatsappOtpResultDto,
} from '@domain/whatsapp-otps/dto/entity/whatsapp-otp-result.dto';
import type { WhatsappOtpStatsDto } from '@domain/whatsapp-otps/dto/entity/whatsapp-otp-stats.dto';
import type { SendWhatsappOtpDto } from '@domain/whatsapp-otps/dto/request/send-whatsapp-otp.dto';
import type { VerifyWhatsappOtpDto } from '@domain/whatsapp-otps/dto/request/verify-whatsapp-otp.dto';
import type { WhatsappOtpStatusDto } from '@domain/whatsapp-otps/dto/request/whatsapp-otp-status.dto';
import { WhatsappOtpsDomainService } from '@domain/whatsapp-otps/services/whatsapp-otps.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/database';

const OTP_TEMPLATE_CATEGORY = 'AUTHENTICATION';

// Orchestrates the three domains a send touches — the OTP row, the account's Graph credentials, and
// the template that carries the code. Domain modules never import each other, so the coordination
// lives here rather than inside any one of them.
@Injectable()
export class WhatsappOtpsService {
  private readonly logger = new Logger(WhatsappOtpsService.name);

  constructor(
    private readonly otpsService: WhatsappOtpsDomainService,
    private readonly accountsService: WhatsappAccountsDomainService,
    private readonly templatesService: WhatsappAccountTemplatesDomainService,
  ) {}

  // Issues a code, delivers it, and records the outcome against the row either way
  async send(dto: SendWhatsappOtpDto): Promise<SendWhatsappOtpResultDto> {
    const prepared = await this.otpsService.startSend(dto);

    // Still inside the resend cooldown — nothing was issued and nothing is sent
    if (!prepared.id || !prepared.code) return SendWhatsappOtpResultDto.from(false, prepared);

    try {
      const credentials = await this.accountsService.resolveGraphCredentials(dto.accountId);
      const messageId = await this.templatesService.sendTemplate(
        { accountId: dto.accountId, ...credentials },
        {
          senderPhoneNumberId: dto.phoneNumberId,
          to: dto.recipient,
          templateName: dto.templateName,
          language: dto.templateLanguage,
          bodyParams: [prepared.code],
          category: OTP_TEMPLATE_CATEGORY,
        },
      );

      await this.otpsService.recordSent(prepared.id, messageId ?? null);
      this.logger.log(`Sent OTP to ${dto.recipient} for app ${dto.appId}`);
      return SendWhatsappOtpResultDto.from(true, prepared);
    } catch (error) {
      // A failed send stays a row — delivery failure rate is what the Overview tab exists to show
      const message = error instanceof Error ? error.message : 'WhatsApp send failed.';
      await this.otpsService.recordFailure(prepared.id, message);
      this.logger.warn(`OTP send failed for ${dto.recipient} on app ${dto.appId}: ${message}`);
      return SendWhatsappOtpResultDto.from(false, prepared);
    }
  }

  // Reads below touch one domain only and pass straight through, keeping the controller on one service
  verify(dto: VerifyWhatsappOtpDto): Promise<VerifyWhatsappOtpResultDto> {
    return this.otpsService.verify(dto);
  }

  findForTable(state: TableViewState): Promise<{ result: WhatsappOtpDto[]; count: number }> {
    return this.otpsService.findForTable(state);
  }

  stats(): Promise<WhatsappOtpStatsDto> {
    return this.otpsService.stats();
  }

  applyDeliveryStatus(dto: WhatsappOtpStatusDto): Promise<boolean> {
    return this.otpsService.applyDeliveryStatus(dto);
  }

  countForAccount(accountId: string): Promise<number> {
    return this.otpsService.countForAccount(accountId);
  }
}

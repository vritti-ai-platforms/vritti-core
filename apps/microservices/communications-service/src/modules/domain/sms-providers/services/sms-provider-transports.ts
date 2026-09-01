import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { SmsProviderCode } from '@/db/schema';

export interface SmsOtpDelivery {
  recipient: string;
  code: string;
  senderId: string | null;
  credentials: Record<string, unknown>;
  appId: string;
}

export interface SmsSendOutcome {
  // The vendor's message id when it issues one — the delivery-webhook correlation key
  messageId: string | null;
}

// One implementation per provider code. A transport owns its credential shape and message format;
// everything upstream (config, budgets, hashing, stats) is provider-agnostic.
export interface SmsProviderTransport {
  readonly code: SmsProviderCode;
  sendOtp(delivery: SmsOtpDelivery): Promise<SmsSendOutcome>;
}

// Dev-only stand-in: "delivers" by logging the code to the service console. Never production —
// the plaintext code lands in the logs, which is the entire point and the entire problem.
@Injectable()
export class ConsoleSmsTransport implements SmsProviderTransport {
  readonly code = 'CONSOLE' as const;
  private readonly logger = new Logger(ConsoleSmsTransport.name);

  async sendOtp(delivery: SmsOtpDelivery): Promise<SmsSendOutcome> {
    this.logger.log(
      `[CONSOLE SMS] OTP ${delivery.code} → ${delivery.recipient} (app ${delivery.appId}, sender ${delivery.senderId ?? '—'})`,
    );
    return { messageId: null };
  }
}

// Resolves a provider code to its transport. MSG91/TWILIO join here as one class each — nothing
// upstream changes when they land.
@Injectable()
export class SmsProviderRegistry {
  private readonly transports: Map<SmsProviderCode, SmsProviderTransport>;

  constructor(consoleTransport: ConsoleSmsTransport) {
    this.transports = new Map<SmsProviderCode, SmsProviderTransport>([[consoleTransport.code, consoleTransport]]);
  }

  resolve(code: SmsProviderCode): SmsProviderTransport {
    const transport = this.transports.get(code);
    if (!transport) {
      throw new BadRequestException({
        label: 'SMS provider not implemented',
        detail: `Sending through ${code} is not available yet. Pick a different provider.`,
      });
    }
    return transport;
  }
}

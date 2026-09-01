import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { FastifyRequest } from 'fastify';
import { AppDomainService } from '@/modules/domain/app/services/app.service';

const STATUS_FIELD = 'messages';

// Only the parts this handler reads. Meta's payload carries far more — contacts, conversation,
// pricing, recipient_id — and gains fields over time, so nothing here claims to be the full shape.
interface StatusEntry {
  id?: string;
  status?: string;
  timestamp?: string;
  errors?: { title?: string; message?: string }[];
}

interface WebhookChange {
  field?: string;
  value?: {
    metadata?: { phone_number_id?: string };
    statuses?: StatusEntry[];
  };
}

interface WebhookPayload {
  entry?: { id?: string; changes?: WebhookChange[] }[];
}

@Injectable()
export class WhatsappWebhookService {
  private readonly logger = new Logger(WhatsappWebhookService.name);
  private readonly appSecret: string;
  private readonly verifyToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppDomainService,
    private readonly nats: NatsClientService,
  ) {
    this.appSecret = this.configService.getOrThrow<string>('META_CLIENT_SECRET');
    this.verifyToken = this.configService.getOrThrow<string>('WHATSAPP_VERIFY_TOKEN');
  }

  // Answers Meta's subscription handshake by echoing the challenge when the token matches
  verifyChallenge(mode: string | undefined, token: string | undefined, challenge: string | undefined): string {
    this.logger.log(`[whatsapp-webhook] GET challenge — mode=${mode} tokenMatch=${token === this.verifyToken}`);

    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('[whatsapp-webhook] challenge accepted');
      return challenge ?? '';
    }

    this.logger.warn('[whatsapp-webhook] challenge REJECTED — check WHATSAPP_VERIFY_TOKEN');
    throw new UnauthorizedException('Invalid verification token.');
  }

  // Verifies the signature, then applies every delivery status the payload carries
  async handle(request: FastifyRequest, signature: string | undefined, body: unknown): Promise<void> {
    const rawBody = request.rawBody as string | undefined;
    this.logger.log(`[whatsapp-webhook] POST received — bytes=${rawBody?.length ?? 0} signature=${!!signature}`);
    this.logger.debug(`[whatsapp-webhook] payload: ${JSON.stringify(body)}`);

    this.assertSignature(rawBody, signature);

    const payload = body as WebhookPayload;

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        // The `messages` field carries inbound customer messages too; only statuses concern us
        if (change.field !== STATUS_FIELD || !change.value?.statuses?.length) {
          this.logger.log(`[whatsapp-webhook] skipping field=${change.field} (no statuses)`);
          continue;
        }

        await this.applyStatuses(
          request,
          entry.id ?? '',
          change.value.metadata?.phone_number_id,
          change.value.statuses,
        );
      }
    }
  }

  // Resolves the organization from the sender, then forwards each status to communications-service
  private async applyStatuses(
    request: FastifyRequest,
    wabaId: string,
    phoneNumberId: string | undefined,
    statuses: StatusEntry[],
  ): Promise<void> {
    if (!phoneNumberId) {
      this.logger.warn(`[whatsapp-webhook] no phone_number_id on WABA ${wabaId} — cannot resolve org`);
      return;
    }

    // core.apps carries whatsappOtpConfig and has no RLS, so the sender resolves to an org without any org context
    const app = await this.appService.findByOtpPhoneNumber(phoneNumberId);
    if (!app) {
      this.logger.warn(`[whatsapp-webhook] no app configured for phone_number_id ${phoneNumberId} — ignoring`);
      return;
    }

    this.logger.log(`[whatsapp-webhook] resolved org ${app.organizationId} via app ${app.id} (${app.name})`);

    // The NATS context resolver reads request.auth, and a public webhook has none. The HMAC is what
    // authenticated this call, so stamping the resolved org here is the same move CloudRequestResolver
    // makes for a signed control-plane request — without it the microservice runs with app.org_id unset.
    request.auth = { kind: 'cloud', organizationId: app.organizationId };

    for (const status of statuses) {
      if (!status.id || !status.status) continue;
      const error = status.errors?.[0];
      this.logger.log(`[whatsapp-webhook] → ${status.status} for ${status.id}${error ? ` (${error.title})` : ''}`);

      await this.nats.send('communications', 'org.whatsappOtps.deliveryStatus', {
        messageId: status.id,
        status: status.status,
        timestamp: Number(status.timestamp) * 1000,
        error: error ? `${error.title ?? 'Delivery failed'}${error.message ? `: ${error.message}` : ''}` : undefined,
      });
    }
  }

  // Meta signs the raw body with the app secret; a mismatch means the payload is not from Meta
  private assertSignature(rawBody: string | undefined, signature: string | undefined): void {
    if (!rawBody || !signature) {
      this.logger.warn('[whatsapp-webhook] missing rawBody or signature');
      throw new UnauthorizedException('Unable to validate webhook signature.');
    }

    const expected = `sha256=${createHmac('sha256', this.appSecret).update(rawBody).digest('hex')}`;
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      this.logger.warn(`[whatsapp-webhook] SIGNATURE MISMATCH — check META_CLIENT_SECRET. got=${signature}`);
      throw new UnauthorizedException('Invalid webhook signature.');
    }

    this.logger.log('[whatsapp-webhook] signature verified');
  }
}

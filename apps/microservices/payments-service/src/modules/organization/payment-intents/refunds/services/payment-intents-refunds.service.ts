import { GatewayRegistry } from '@domain/gateways/gateway-registry';
import type { NormalizedRefund } from '@domain/gateways/gateway-transport';
import { PaymentIntentDto } from '@domain/payment-intents/dto/entity/payment-intent.dto';
import { PaymentIntentsDomainRepository } from '@domain/payment-intents/repositories/payment-intents.repository';
import { PaymentIntentsDomainService } from '@domain/payment-intents/services/payment-intents.service';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { PaymentEventTypeValues, type PaymentIntent, PaymentIntentStatusValues } from '@/db/schema';
import { PaymentIntentsEventsService } from '../../events/services/payment-intents-events.service';
import type { IntentWithEvents } from '../../intent-with-events';
import type { RefundPaymentIntentDto } from '../dto/request/refund-payment-intent.dto';

// What a refund can be asked for: a received payment, or one whose last refund failed
const REFUNDABLE = [PaymentIntentStatusValues.SUCCEEDED, PaymentIntentStatusValues.REFUND_FAILED];

// Client errors that can clear on their own (auth or context glitches, timeouts, throttling): the refund is worth
// asking again, so they do not mark it failed
const TRANSIENT_CLIENT_STATUSES = new Set([401, 403, 408, 425, 429]);

// A refund's state in the gateways' words, as `refund` answers it
const REFUND_STATUS_WORD = { REFUND_PENDING: 'pending', REFUNDED: 'processed' } as const;

// Owns what happens to an intent after it is paid: asking the gateway for a refund, and following that refund to
// REFUNDED or REFUND_FAILED from the gateway's webhook or a read-back. Each change writes its event in the same
// transaction
@Injectable()
export class PaymentIntentsRefundsService {
  private readonly logger = new Logger(PaymentIntentsRefundsService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly registry: GatewayRegistry,
    private readonly intents: PaymentIntentsDomainRepository,
    private readonly intentsService: PaymentIntentsDomainService,
    private readonly eventsService: PaymentIntentsEventsService,
  ) {}

  // Asks the gateway to refund a received payment in full. The intent becomes REFUND_PENDING (REFUNDED when the gateway
  // settles it at once) until the gateway's refund webhook, or `syncRefund`, says processed or failed. A refund the
  // gateway refuses outright — or cannot make at all — marks the intent REFUND_FAILED with the reason before the
  // refusal is thrown on, so it is never left looking as if a refund were under way; a failed refund may be asked
  // again. A gateway that could not be reached changes nothing, so the caller's retry asks again. Used for a payment
  // a checkout did not need and for the verification payment that proves a gateway config's webhook. A repeat answers
  // with the refund already asked for
  async refund(dto: RefundPaymentIntentDto): Promise<{ providerRefundId: string; status: string }> {
    const intent = await this.intentsService.require(dto.paymentIntentId);
    if (
      (intent.status === PaymentIntentStatusValues.REFUND_PENDING ||
        intent.status === PaymentIntentStatusValues.REFUNDED) &&
      intent.refundReference
    ) {
      return { providerRefundId: intent.refundReference, status: REFUND_STATUS_WORD[intent.status] };
    }
    if (!REFUNDABLE.includes(intent.status as (typeof REFUNDABLE)[number]) || !intent.providerPaymentId) {
      throw new BadRequestException({
        label: 'Nothing To Refund',
        detail: 'Only a received payment, or one whose refund failed, can be refunded.',
      });
    }
    const transport = this.registry.resolve(intent.gatewayCode);
    if (!transport.refundPayment) {
      const detail = `Refunds through ${intent.gatewayCode} are not supported yet.`;
      await this.markRefused(intent, detail);
      throw new BadRequestException({ label: 'Refunds Not Supported', detail });
    }
    let result: Awaited<ReturnType<NonNullable<typeof transport.refundPayment>>>;
    try {
      result = await transport.refundPayment(dto.credentials, {
        providerPaymentId: intent.providerPaymentId,
        providerOrderId: intent.providerOrderId,
        amount: intent.amount,
        refundId: refundIdFor(intent.id),
      });
    } catch (error: unknown) {
      const reason = refusalReason(error);
      if (reason) await this.markRefused(intent, reason);
      throw error;
    }
    await this.database.runInTransaction(async () => {
      const locked = await this.intentsService.lock(intent.id);
      // The gateway's refund webhook may have moved it first
      if (!REFUNDABLE.includes(locked.status as (typeof REFUNDABLE)[number])) return;
      const settled = result.status === 'processed';
      const updated = await this.intents.update(locked.id, {
        status: settled ? PaymentIntentStatusValues.REFUNDED : PaymentIntentStatusValues.REFUND_PENDING,
        refundReference: result.providerRefundId,
        refundFailureMessage: null,
        ...(settled && { refundedAt: new Date() }),
      });
      await this.eventsService.record(
        updated,
        settled ? PaymentEventTypeValues.REFUNDED : PaymentEventTypeValues.REFUND_PENDING,
        { refundReference: result.providerRefundId },
      );
    });
    this.logger.log(`Refund ${result.providerRefundId} (${result.status}) asked for intent ${intent.id}`);
    return result;
  }

  // Applies a refund the gateway reported (its webhook, or `syncRefund`) to the intent whose payment it refunds:
  // processed → REFUNDED, failed → REFUND_FAILED, pending → REFUND_PENDING (a refund made in the gateway's dashboard).
  // Null when no intent of this platform owns the payment
  async applyRefund(refund: NormalizedRefund): Promise<IntentWithEvents | null> {
    const found = await this.intents.findByProviderPaymentId(refund.providerPaymentId);
    if (!found) return null;
    return this.database.runInTransaction(async () => {
      const intent = await this.intentsService.lock(found.id);
      const unchanged = { intent: PaymentIntentDto.from(intent), events: [] };
      // Another refund of the same payment than the one asked for is applied only when none was asked for
      if (intent.refundReference && intent.refundReference !== refund.providerRefundId) return unchanged;
      // A refund of part of the payment (made in the gateway's dashboard) does not return the payment: the intent
      // stays as it is rather than read as refunded in full
      if (refund.amount !== null && refund.amount < intent.amount) {
        this.logger.warn(
          `Refund ${refund.providerRefundId} returns ${refund.amount} of intent ${intent.id}'s ${intent.amount} — a partial refund, left unrecorded`,
        );
        return unchanged;
      }

      if (refund.status === 'processed') {
        if (intent.status === PaymentIntentStatusValues.REFUNDED) return unchanged;
        const updated = await this.intents.update(intent.id, {
          status: PaymentIntentStatusValues.REFUNDED,
          refundedAt: new Date(),
          refundReference: refund.providerRefundId,
          refundFailureMessage: null,
        });
        const event = await this.eventsService.record(updated, PaymentEventTypeValues.REFUNDED, {
          refundReference: refund.providerRefundId,
        });
        return { intent: PaymentIntentDto.from(updated), events: [event] };
      }

      if (refund.status === 'failed') {
        if (intent.status !== PaymentIntentStatusValues.REFUND_PENDING) return unchanged;
        const updated = await this.intents.update(intent.id, {
          status: PaymentIntentStatusValues.REFUND_FAILED,
          refundFailureMessage: refund.errorDescription,
        });
        const event = await this.eventsService.record(updated, PaymentEventTypeValues.REFUND_FAILED, {
          refundReference: refund.providerRefundId,
        });
        return { intent: PaymentIntentDto.from(updated), events: [event] };
      }

      if (!REFUNDABLE.includes(intent.status as (typeof REFUNDABLE)[number])) return unchanged;
      const updated = await this.intents.update(intent.id, {
        status: PaymentIntentStatusValues.REFUND_PENDING,
        refundReference: refund.providerRefundId,
        refundFailureMessage: null,
      });
      const event = await this.eventsService.record(updated, PaymentEventTypeValues.REFUND_PENDING, {
        refundReference: refund.providerRefundId,
      });
      return { intent: PaymentIntentDto.from(updated), events: [event] };
    });
  }

  // Asks the gateway where a pending refund stands and applies the answer, for a refund whose webhook never arrived.
  // A gateway that cannot be asked leaves it pending
  async syncRefund(dto: RefundPaymentIntentDto): Promise<IntentWithEvents> {
    const intent = await this.intentsService.require(dto.paymentIntentId);
    const unchanged = { intent: PaymentIntentDto.from(intent), events: [] };
    if (
      intent.status !== PaymentIntentStatusValues.REFUND_PENDING ||
      !intent.providerPaymentId ||
      !intent.refundReference
    ) {
      return unchanged;
    }
    const transport = this.registry.resolve(intent.gatewayCode);
    if (!transport.fetchRefund) return unchanged;
    const refund = await transport.fetchRefund(dto.credentials, {
      providerPaymentId: intent.providerPaymentId,
      providerOrderId: intent.providerOrderId,
      providerRefundId: intent.refundReference,
    });
    return (await this.applyRefund(refund)) ?? unchanged;
  }

  // Records that a refund could not be made: the intent becomes REFUND_FAILED with the gateway's reason and its
  // event, in its own transaction so it holds whatever the caller does with the refusal. A repeated refusal only
  // refreshes the reason
  private async markRefused(intent: PaymentIntent, reason: string): Promise<void> {
    await this.database.runInTransaction(async () => {
      const locked = await this.intentsService.lock(intent.id);
      if (!REFUNDABLE.includes(locked.status as (typeof REFUNDABLE)[number])) return;
      const updated = await this.intents.update(locked.id, {
        status: PaymentIntentStatusValues.REFUND_FAILED,
        refundFailureMessage: reason,
      });
      if (locked.status !== PaymentIntentStatusValues.REFUND_FAILED) {
        await this.eventsService.record(updated, PaymentEventTypeValues.REFUND_FAILED);
      }
    });
    this.logger.warn(`Refund of intent ${intent.id} was refused: ${reason}`);
  }

  // Refunds the gateway accepted but has not confirmed, for the sweep that asks after them
  async listRefundPending(limit: number): Promise<PaymentIntentDto[]> {
    return (await this.intents.findRefundPending(limit)).map((intent) => PaymentIntentDto.from(intent));
  }
}

// The merchant's id for one refund attempt: the intent's id and the moment it was asked, within the 40 letters,
// digits and underscores a gateway takes. New on every attempt, so a retry after a failed refund is a new refund
function refundIdFor(intentId: string): string {
  return `rf_${intentId.replaceAll('-', '').slice(0, 26)}_${Date.now().toString(36)}`;
}

// Why a refund was refused for good, or null when the failure may pass (the gateway unreachable or erroring, a
// throttle, an auth glitch) and the refund should simply be asked again
function refusalReason(error: unknown): string | null {
  if (!(error instanceof HttpException)) return null;
  const status = error.getStatus();
  if (status < 400 || status >= 500 || TRANSIENT_CLIENT_STATUSES.has(status)) return null;
  const response = error.getResponse();
  const detail = typeof response === 'object' && response !== null ? (response as { detail?: unknown }).detail : null;
  return typeof detail === 'string' && detail ? detail : error.message;
}

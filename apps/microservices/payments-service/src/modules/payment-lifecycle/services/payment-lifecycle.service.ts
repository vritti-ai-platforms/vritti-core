import { GatewayRegistry } from '@domain/gateways/gateway-registry';
import type { NormalizedPayment, NormalizedWebhookEvent } from '@domain/gateways/gateway-transport';
import { PaymentAttemptsDomainRepository } from '@domain/payment-attempts/repositories/payment-attempts.repository';
import { PaymentEventDto } from '@domain/payment-events/dto/entity/payment-event.dto';
import { PaymentEventsDomainRepository } from '@domain/payment-events/repositories/payment-events.repository';
import { PaymentIntentDto } from '@domain/payment-intents/dto/entity/payment-intent.dto';
import { PaymentIntentsDomainRepository } from '@domain/payment-intents/repositories/payment-intents.repository';
import type { PaymentTransferDto } from '@domain/payment-transfers/dto/entity/payment-transfer.dto';
import { PaymentTransfersDomainRepository } from '@domain/payment-transfers/repositories/payment-transfers.repository';
import { PaymentTransfersDomainService } from '@domain/payment-transfers/services/payment-transfers.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import {
  type PaymentAttemptStatus,
  PaymentAttemptStatusValues,
  type PaymentEventType,
  PaymentEventTypeValues,
  type PaymentIntent,
  PaymentIntentStatusValues,
} from '@/db/schema';
import type {
  ConfirmPaymentIntentDto,
  CreatePaymentIntentDto,
  ExecuteTransfersDto,
} from '../dto/payment-intent-requests.dto';

// How long a customer has to pay before an untouched intent expires
const INTENT_TTL_MS = 30 * 60 * 1000;

// Razorpay caps an order's receipt at 40 characters; the reference id is the merchant's own handle on the payment
const RECEIPT_MAX_LENGTH = 40;

// A gateway payment's state, as the attempt that records it
const ATTEMPT_STATUS: Record<NormalizedPayment['status'], PaymentAttemptStatus> = {
  created: PaymentAttemptStatusValues.CREATED,
  authorized: PaymentAttemptStatusValues.AUTHORIZED,
  captured: PaymentAttemptStatusValues.CAPTURED,
  failed: PaymentAttemptStatusValues.FAILED,
  refunded: PaymentAttemptStatusValues.REFUNDED,
};

// States an intent is still waiting on the customer in
const AWAITING_CUSTOMER = [PaymentIntentStatusValues.CREATED, PaymentIntentStatusValues.REQUIRES_ACTION];

// States an intent has ended in without being paid; a new checkout needs a new intent
const ENDED_UNPAID = [
  PaymentIntentStatusValues.CANCELED,
  PaymentIntentStatusValues.EXPIRED,
  PaymentIntentStatusValues.FAILED,
];

// The unique constraint a concurrent create with the same idempotency key collides on
const IDEMPOTENCY_KEY_CONSTRAINT = 'uq_payment_intents_org_idempotency_key';
const PG_UNIQUE_VIOLATION = '23505';

export interface IntentWithEvents {
  intent: PaymentIntentDto;
  events: PaymentEventDto[];
}

// Owns every change to a payment intent's state. Both ways a payment completes — the browser's confirm and the
// gateway's webhook — end in `applyPayment`, which locks the intent row, so whichever arrives first completes it
// and the other finds it already done. Each completion writes its event in the same transaction, so an intent
// never changes state without core hearing about it.
@Injectable()
export class PaymentLifecycleService {
  private readonly logger = new Logger(PaymentLifecycleService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly registry: GatewayRegistry,
    private readonly intents: PaymentIntentsDomainRepository,
    private readonly attempts: PaymentAttemptsDomainRepository,
    private readonly events: PaymentEventsDomainRepository,
    private readonly transfers: PaymentTransfersDomainRepository,
    private readonly transfersService: PaymentTransfersDomainService,
  ) {}

  // Opens an intent and its gateway order. Idempotent per organization and key: a retry returns the intent already
  // opened, and one whose gateway order failed earlier resumes from there instead of opening a second intent. One
  // that has ended unpaid is refused — resuming it would hand the customer a checkout that can no longer complete
  async create(dto: CreatePaymentIntentDto): Promise<PaymentIntentDto> {
    const transport = this.registry.resolve(dto.gatewayCode);
    const amount = BigInt(dto.amount);

    let intent = await this.intents.findByIdempotencyKey(dto.idempotencyKey);
    if (!intent) {
      try {
        intent = await this.openIntent(dto, amount);
      } catch (error) {
        // A concurrent create with the same key inserted first; carry on with the intent it opened
        if (!isIdempotencyKeyConflict(error)) throw error;
        const existing = await this.intents.findByIdempotencyKey(dto.idempotencyKey);
        if (!existing) throw error;
        intent = await this.resumeExisting(existing, dto, amount);
      }
    } else {
      intent = await this.resumeExisting(intent, dto, amount);
    }
    if (intent.providerOrderId) return PaymentIntentDto.from(intent);

    // The intent is saved before the gateway is called, so a timeout here leaves a row a retry can resume rather
    // than a gateway order nobody recorded
    const order = await transport.createOrder(dto.credentials, {
      amount,
      currency: intent.currency,
      receipt: intent.receipt,
      notes: { payment_intent_id: intent.id, reference: `${intent.referenceType}:${intent.referenceId}` },
      ...(dto.customer && { customer: dto.customer }),
    });

    const updated = await this.intents.update(intent.id, {
      providerOrderId: order.providerOrderId,
      checkout: { gateway: intent.gatewayCode, ...order.checkout },
      status: PaymentIntentStatusValues.REQUIRES_ACTION,
    });
    this.logger.log(
      `Opened intent ${intent.id} as ${order.providerOrderId} for ${intent.referenceType}:${intent.referenceId}`,
    );
    return PaymentIntentDto.from(updated);
  }

  // Completes an intent from what the gateway's checkout handed the browser. Nothing the browser says is taken on
  // trust: the signature is checked with the merchant's secret, then the payment is read back from the gateway and
  // must belong to this intent's order for this intent's amount
  async confirm(dto: ConfirmPaymentIntentDto): Promise<IntentWithEvents> {
    const intent = await this.requireIntent(dto.paymentIntentId);
    if (intent.status === PaymentIntentStatusValues.SUCCEEDED) {
      return { intent: PaymentIntentDto.from(intent), events: [] };
    }
    if (!intent.providerOrderId) {
      throw new BadRequestException({
        label: 'Checkout Not Started',
        detail: 'This payment has no gateway order yet, so there is nothing to confirm.',
      });
    }

    const { orderId, paymentId, signature } = dto.gatewayResponse;
    if (orderId !== intent.providerOrderId) {
      throw mismatch('The gateway response is for a different order than this payment.', 'gatewayResponse.orderId');
    }

    const transport = this.registry.resolve(intent.gatewayCode);
    const signed = transport.verifyCheckoutSignature(dto.credentials, {
      providerOrderId: orderId,
      providerPaymentId: paymentId,
      signature,
    });
    if (!signed) {
      throw new BadRequestException({
        label: 'Invalid Payment Signature',
        detail: 'The payment response could not be verified with the gateway credentials.',
        errors: [{ field: 'gatewayResponse.signature', message: 'Signature does not match' }],
      });
    }

    const payment = await transport.fetchPayment(dto.credentials, paymentId);
    assertPaymentMatches(intent, payment, 'gatewayResponse.paymentId');
    return this.applyPayment(intent.id, payment);
  }

  // Applies a verified gateway webhook's payment to the intent its order belongs to; null when the order is not one
  // this platform opened (a payment taken outside checkout, say), which the caller records as ignored
  async applyWebhookPayment(event: NormalizedWebhookEvent): Promise<IntentWithEvents | null> {
    const payment = event.payment;
    const orderId = event.providerOrderId ?? payment?.providerOrderId;
    if (!payment || !orderId) return null;

    const intent = await this.intents.findByProviderOrderId(orderId);
    if (!intent) return null;

    assertPaymentMatches(intent, { ...payment, providerOrderId: orderId }, 'payment');
    return this.applyPayment(intent.id, payment);
  }

  // Returns one intent
  async get(paymentIntentId: string): Promise<PaymentIntentDto> {
    return PaymentIntentDto.from(await this.requireIntent(paymentIntentId));
  }

  // Cancels an intent the customer has not paid yet, with its event; one already cancelled is returned as it is
  async cancel(paymentIntentId: string): Promise<IntentWithEvents> {
    return this.database.runInTransaction(async () => {
      const intent = await this.lockIntent(paymentIntentId);
      if (intent.status === PaymentIntentStatusValues.CANCELED) {
        return { intent: PaymentIntentDto.from(intent), events: [] };
      }
      if (!AWAITING_CUSTOMER.includes(intent.status as (typeof AWAITING_CUSTOMER)[number])) {
        throw new ConflictException({
          label: 'Payment In Progress',
          detail: `This payment is ${intent.status.toLowerCase()} and can no longer be cancelled.`,
        });
      }
      const updated = await this.intents.update(intent.id, { status: PaymentIntentStatusValues.CANCELED });
      const event = await this.recordEvent(updated, PaymentEventTypeValues.CANCELED);
      this.logger.log(`Cancelled intent ${intent.id}`);
      return { intent: PaymentIntentDto.from(updated), events: [event] };
    });
  }

  // Expires the organization's intents still waiting on the customer past their window, each with its event. Run by
  // core per organization — the request's organization scopes what RLS lets this see
  async expireStale(limit = 100): Promise<PaymentEventDto[]> {
    const now = new Date();
    const candidates = await this.intents.findExpirable(now, [...AWAITING_CUSTOMER], limit);
    const expired: PaymentEventDto[] = [];

    for (const candidate of candidates) {
      const event = await this.database.runInTransaction(async () => {
        const intent = await this.intents.lockById(candidate.id);
        // Re-read under the lock: a payment may have landed between the scan and here
        if (!intent || !AWAITING_CUSTOMER.includes(intent.status as (typeof AWAITING_CUSTOMER)[number])) return null;
        if (!intent.expiresAt || intent.expiresAt >= now) return null;
        const updated = await this.intents.update(intent.id, { status: PaymentIntentStatusValues.EXPIRED });
        return this.recordEvent(updated, PaymentEventTypeValues.EXPIRED);
      });
      if (event) expired.push(event);
    }

    if (expired.length > 0) this.logger.log(`Expired ${expired.length} unpaid intent(s)`);
    return expired;
  }

  // Sends a succeeded intent's recorded split legs to the gateway. Called by core once it has dispatched the success,
  // with the credentials only core can decrypt; legs already sent are skipped, so a repeat call is harmless. The
  // intent row stays locked from reading the unsent legs until each is stamped with its gateway transfer id, so two
  // concurrent calls take turns and the second finds nothing left to send
  async executeTransfers(dto: ExecuteTransfersDto): Promise<PaymentTransferDto[]> {
    return this.database.runInTransaction(async () => {
      const intent = await this.lockIntent(dto.paymentIntentId);
      if (intent.status !== PaymentIntentStatusValues.SUCCEEDED || !intent.providerPaymentId) {
        throw new ConflictException({
          label: 'Payment Not Captured',
          detail: 'Transfers can only be made from a payment that has succeeded.',
        });
      }

      const unsent = await this.transfers.findUnsentByIntent(intent.id);
      if (unsent.length === 0) return [];

      const results = await this.registry.resolveSplit(intent.gatewayCode).createTransfers(
        dto.credentials,
        intent.providerPaymentId,
        unsent.map((leg) => ({
          providerAccountId: leg.providerAccountId,
          amount: leg.amount,
          currency: leg.currency,
          notes: { payment_intent_id: intent.id, linked_account_id: leg.linkedAccountId },
          onHold: leg.onHold,
          onHoldUntil: leg.onHoldUntil,
        })),
      );

      // One leg per linked account per intent (a unique constraint), so the account pairs a result with its leg
      const created: PaymentTransferDto[] = [];
      const stamped = new Set<string>();
      for (const result of results) {
        const leg = unsent.find(
          (candidate) => candidate.providerAccountId === result.providerAccountId && !stamped.has(candidate.id),
        );
        if (!leg) {
          this.logger.warn(
            `Gateway transfer ${result.providerTransferId} matched no unsent leg of intent ${intent.id}`,
          );
          continue;
        }
        stamped.add(leg.id);
        created.push(await this.transfersService.markCreated(leg.id, result.providerTransferId, result.status));
      }
      this.logger.log(`Sent ${created.length} transfer(s) for intent ${intent.id}`);
      return created;
    });
  }

  // The one place an intent moves on a gateway payment, under a row lock. Captured completes it (late, if it had
  // already expired or been cancelled — the money was taken, so it is recorded rather than lost); authorized marks it
  // processing; failed records why while the intent stays payable by another method — handing a processing intent
  // back to the customer, so it can still be paid or expire. A failure on an intent that already ended is only kept
  // as an attempt: nobody is waiting on it, so it raises no event
  private async applyPayment(intentId: string, payment: NormalizedPayment): Promise<IntentWithEvents> {
    return this.database.runInTransaction(async () => {
      const intent = await this.lockIntent(intentId);
      await this.attempts.upsertByProviderPayment({
        intentId: intent.id,
        organizationId: intent.organizationId,
        providerPaymentId: payment.providerPaymentId,
        status: ATTEMPT_STATUS[payment.status],
        method: payment.method,
        errorCode: payment.errorCode,
        errorMessage: payment.errorDescription,
        raw: payment.raw,
      });

      if (intent.status === PaymentIntentStatusValues.SUCCEEDED) {
        return { intent: PaymentIntentDto.from(intent), events: [] };
      }

      if (payment.status === 'captured') {
        const late =
          intent.status === PaymentIntentStatusValues.EXPIRED || intent.status === PaymentIntentStatusValues.CANCELED;
        const updated = await this.intents.update(intent.id, {
          status: PaymentIntentStatusValues.SUCCEEDED,
          providerPaymentId: payment.providerPaymentId,
          method: payment.method,
          fee: payment.fee,
          tax: payment.tax,
          succeededAt: new Date(),
          failureCode: null,
          failureMessage: null,
        });
        if (late) this.logger.warn(`Intent ${intent.id} was paid after it was ${intent.status.toLowerCase()}`);
        const event = await this.recordEvent(updated, PaymentEventTypeValues.SUCCEEDED, { late });
        return { intent: PaymentIntentDto.from(updated), events: [event] };
      }

      if (payment.status === 'authorized') {
        if (!AWAITING_CUSTOMER.includes(intent.status as (typeof AWAITING_CUSTOMER)[number])) {
          return { intent: PaymentIntentDto.from(intent), events: [] };
        }
        const updated = await this.intents.update(intent.id, {
          status: PaymentIntentStatusValues.PROCESSING,
          providerPaymentId: payment.providerPaymentId,
          method: payment.method,
        });
        return { intent: PaymentIntentDto.from(updated), events: [] };
      }

      if (payment.status === 'failed') {
        if (
          intent.status === PaymentIntentStatusValues.CANCELED ||
          intent.status === PaymentIntentStatusValues.EXPIRED
        ) {
          return { intent: PaymentIntentDto.from(intent), events: [] };
        }
        // Only the payment that put the intent in processing can take it out again
        const releases =
          intent.status === PaymentIntentStatusValues.PROCESSING &&
          (!intent.providerPaymentId || intent.providerPaymentId === payment.providerPaymentId);
        const updated = await this.intents.update(intent.id, {
          failureCode: payment.errorCode,
          failureMessage: payment.errorDescription,
          ...(releases && { status: PaymentIntentStatusValues.REQUIRES_ACTION, providerPaymentId: null }),
        });
        const event = await this.recordEvent(updated, PaymentEventTypeValues.PAYMENT_FAILED);
        return { intent: PaymentIntentDto.from(updated), events: [event] };
      }

      return { intent: PaymentIntentDto.from(intent), events: [] };
    });
  }

  // Inserts the intent and any split legs it carries, in one transaction
  private async openIntent(dto: CreatePaymentIntentDto, amount: bigint): Promise<PaymentIntent> {
    const legs = dto.transfers ?? [];
    const legTotal = legs.reduce((sum, leg) => sum + BigInt(leg.amount), 0n);
    if (legTotal > amount) {
      throw new BadRequestException({
        label: 'Transfers Exceed Amount',
        detail: 'The split transfers add up to more than the payment itself.',
        errors: [{ field: 'transfers', message: 'Total exceeds the amount' }],
      });
    }

    return this.database.runInTransaction(async () => {
      const intent = await this.intents.create({
        legalEntityId: dto.legalEntityId,
        siteId: dto.siteId ?? null,
        appId: dto.appId ?? null,
        partyId: dto.partyId ?? null,
        configId: dto.configId,
        gatewayCode: dto.gatewayCode,
        bankAccountId: dto.bankAccountId,
        type: dto.type,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        description: dto.description ?? null,
        idempotencyKey: dto.idempotencyKey,
        receipt: dto.referenceId.slice(0, RECEIPT_MAX_LENGTH),
        amount,
        currency: dto.currency,
        status: PaymentIntentStatusValues.CREATED,
        customer: dto.customer ?? null,
        metadata: dto.metadata ?? null,
        returnUrl: dto.returnUrl ?? null,
        checkoutUrl: dto.checkoutUrl ?? null,
        expiresAt: new Date(Date.now() + INTENT_TTL_MS),
      });

      await this.transfersService.createForIntent(
        legs.map((leg) => ({
          intentId: intent.id,
          linkedAccountId: leg.linkedAccountId,
          providerAccountId: leg.providerAccountId,
          amount: BigInt(leg.amount),
          currency: dto.currency,
          onHold: leg.onHold ?? false,
          onHoldUntil: leg.onHoldUntil ? new Date(leg.onHoldUntil) : null,
        })),
      );
      return intent;
    });
  }

  // Writes one event for core, in whatever transaction the caller holds
  private async recordEvent(
    intent: PaymentIntent,
    type: PaymentEventType,
    extra: Record<string, unknown> = {},
  ): Promise<PaymentEventDto> {
    const amount = CurrencyAmountDto.from(intent.amount, intent.currency);
    const row = await this.events.create({
      organizationId: intent.organizationId,
      intentId: intent.id,
      type,
      payload: {
        paymentIntentId: intent.id,
        appId: intent.appId,
        partyId: intent.partyId,
        legalEntityId: intent.legalEntityId,
        siteId: intent.siteId,
        configId: intent.configId,
        reference: { type: intent.referenceType, id: intent.referenceId },
        amount: { currency: amount.currency, value: amount.value },
        method: intent.method,
        providerPaymentId: intent.providerPaymentId,
        paidAt: intent.succeededAt?.toISOString() ?? null,
        failure: intent.failureCode ? { code: intent.failureCode, message: intent.failureMessage } : null,
        metadata: intent.metadata,
        ...extra,
      },
    });
    return PaymentEventDto.from(row);
  }

  // Picks up an intent already opened under the request's key — the same payment, and one that can still be paid
  private async resumeExisting(
    intent: PaymentIntent,
    dto: CreatePaymentIntentDto,
    amount: bigint,
  ): Promise<PaymentIntent> {
    assertSameRequest(intent, dto, amount);
    if (ENDED_UNPAID.includes(intent.status as (typeof ENDED_UNPAID)[number])) {
      throw new ConflictException({
        label: 'Payment Ended',
        detail: 'This payment has ended. Start a new checkout.',
      });
    }
    // The storefront's pages are not part of the payment, so a retry may move them; the latest ones win
    const urls = changedCheckoutUrls(intent, dto);
    if (!urls) return intent;
    this.logger.log(`Updated checkout urls of intent ${intent.id}`);
    return this.intents.update(intent.id, urls);
  }

  private async requireIntent(id: string): Promise<PaymentIntent> {
    const intent = await this.intents.findById(id);
    if (!intent) throw new NotFoundException('Payment intent not found.');
    return intent;
  }

  private async lockIntent(id: string): Promise<PaymentIntent> {
    const intent = await this.intents.lockById(id);
    if (!intent) throw new NotFoundException('Payment intent not found.');
    return intent;
  }
}

// A key reused for a different payment is a caller bug that would otherwise charge the wrong amount silently
function assertSameRequest(intent: PaymentIntent, dto: CreatePaymentIntentDto, amount: bigint): void {
  const same =
    intent.amount === amount &&
    intent.currency === dto.currency &&
    intent.referenceType === dto.referenceType &&
    intent.referenceId === dto.referenceId;
  if (!same) {
    throw new ConflictException({
      label: 'Idempotency Key Reused',
      detail: 'This idempotency key was already used for a different payment. Use a new key for a new payment.',
      errors: [{ field: 'idempotencyKey', message: 'Already used for a different payment' }],
    });
  }
}

// The return/checkout urls a retry sends that differ from the stored ones; a url the retry leaves out is kept
function changedCheckoutUrls(
  intent: PaymentIntent,
  dto: CreatePaymentIntentDto,
): Pick<Partial<PaymentIntent>, 'returnUrl' | 'checkoutUrl'> | null {
  const changes: Pick<Partial<PaymentIntent>, 'returnUrl' | 'checkoutUrl'> = {};
  if (dto.returnUrl !== undefined && dto.returnUrl !== intent.returnUrl) changes.returnUrl = dto.returnUrl;
  if (dto.checkoutUrl !== undefined && dto.checkoutUrl !== intent.checkoutUrl) changes.checkoutUrl = dto.checkoutUrl;
  return Object.keys(changes).length > 0 ? changes : null;
}

// The gateway's payment must be for this intent's order and exactly this intent's amount; `field` names where the
// payment came from (the browser's gateway response, or a webhook's payment)
function assertPaymentMatches(intent: PaymentIntent, payment: NormalizedPayment, field: string): void {
  if (payment.providerOrderId !== intent.providerOrderId) {
    throw mismatch('The payment belongs to a different order than this intent.', field);
  }
  if (payment.amount !== intent.amount || payment.currency !== intent.currency) {
    throw mismatch('The amount paid does not match the amount of this payment.', field);
  }
}

// Whether an insert failed on the (organization, idempotency key) constraint; the pg error may sit under the
// ORM's wrapper as its cause
function isIdempotencyKeyConflict(error: unknown, depth = 0): boolean {
  if (typeof error !== 'object' || error === null || depth > 5) return false;
  const code: unknown = Reflect.get(error, 'code');
  if (typeof code === 'string') {
    return code === PG_UNIQUE_VIOLATION && Reflect.get(error, 'constraint') === IDEMPOTENCY_KEY_CONSTRAINT;
  }
  return isIdempotencyKeyConflict(Reflect.get(error, 'cause'), depth + 1);
}

function mismatch(detail: string, field: string): BadRequestException {
  return new BadRequestException({
    label: 'Payment Mismatch',
    detail,
    errors: [{ field, message: 'Does not match this payment' }],
  });
}

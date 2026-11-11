import { GatewayRegistry } from '@domain/gateways/gateway-registry';
import type { NormalizedPayment, NormalizedWebhookEvent } from '@domain/gateways/gateway-transport';
import { PaymentAllocationsDomainRepository } from '@domain/payment-allocations/repositories/payment-allocations.repository';
import type { PaymentEventDto } from '@domain/payment-events/dto/entity/payment-event.dto';
import { PaymentIntentDto } from '@domain/payment-intents/dto/entity/payment-intent.dto';
import { PaymentIntentsDomainRepository } from '@domain/payment-intents/repositories/payment-intents.repository';
import { PaymentIntentsDomainService } from '@domain/payment-intents/services/payment-intents.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException, ConflictException } from '@vritti/api-sdk/exceptions';
import {
  type PaymentAllocation,
  PaymentEventTypeValues,
  type PaymentIntent,
  PaymentIntentStatusValues,
} from '@/db/schema';
import { PaymentIntentsEventsService } from '../../events/services/payment-intents-events.service';
import type { IntentWithEvents } from '../../intent-with-events';
import type {
  ConfirmPaymentIntentDto,
  CreatePaymentIntentDto,
  SyncPaymentIntentDto,
} from '../dto/request/payment-intent-requests.dto';

// How long a customer has to pay before an untouched intent expires
const INTENT_TTL_MS = 30 * 60 * 1000;

// Razorpay caps an order's receipt at 40 characters; the reference id is the merchant's own handle on the payment
const RECEIPT_MAX_LENGTH = 40;

// States an intent is still waiting on the customer in
const AWAITING_CUSTOMER = [PaymentIntentStatusValues.CREATED, PaymentIntentStatusValues.REQUIRES_ACTION];
// Received: the money reached the merchant, whatever became of a refund since
const PAID = [
  PaymentIntentStatusValues.SUCCEEDED,
  PaymentIntentStatusValues.REFUND_PENDING,
  PaymentIntentStatusValues.REFUNDED,
  PaymentIntentStatusValues.REFUND_FAILED,
];

// States an intent has ended in without being paid; a new checkout needs a new intent
const ENDED_UNPAID = [
  PaymentIntentStatusValues.CANCELED,
  PaymentIntentStatusValues.EXPIRED,
  PaymentIntentStatusValues.FAILED,
];

// The unique constraint a concurrent create with the same idempotency key collides on
const IDEMPOTENCY_KEY_CONSTRAINT = 'uq_payment_intents_org_idempotency_key';
const ONE_ACTIVE_PER_TARGET_CONSTRAINT = 'uq_payment_intents_one_active_per_target';
const ONE_ACTIVE_PER_REFERENCE_CONSTRAINT = 'uq_payment_intents_one_active_per_reference';
const PG_UNIQUE_VIOLATION = '23505';

// The store's return page with the attempt in its query, spelled as the SDK's checkoutAttemptUrl reads it
function attemptReturnUrl(intent: PaymentIntent): string {
  const url = new URL(intent.returnUrl as string);
  url.searchParams.set('intent', intent.id);
  const orderNumber = intent.metadata?.orderNumber;
  if (orderNumber) url.searchParams.set('order', orderNumber);
  return url.toString();
}

// Owns every change to a payment intent's state up to its being paid: opening it with its gateway order, completing
// it, cancelling and expiring it. Both ways a payment completes — the browser's confirm and the gateway's webhook —
// end in `applyPayment`, which locks the intent row, so whichever arrives first completes it and the other finds it
// already done. Each change writes its event in the same transaction, so an intent never changes state without core
// hearing about it. What happens after it is paid — refunds — is the refunds sub-service's
@Injectable()
export class PaymentIntentsRootService {
  private readonly logger = new Logger(PaymentIntentsRootService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly registry: GatewayRegistry,
    private readonly intents: PaymentIntentsDomainRepository,
    private readonly intentsService: PaymentIntentsDomainService,
    private readonly allocations: PaymentAllocationsDomainRepository,
    private readonly eventsService: PaymentIntentsEventsService,
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
        // Another payment of the same checkout, or of the same thing paid for, is still active: two requests raced
        if (
          isUniqueViolation(error, ONE_ACTIVE_PER_TARGET_CONSTRAINT) ||
          isUniqueViolation(error, ONE_ACTIVE_PER_REFERENCE_CONSTRAINT)
        ) {
          throw new ConflictException({
            label: 'Payment Already Open',
            detail: 'A payment for this is already open. Finish it, or wait a moment and try again.',
          });
        }
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
    // than a gateway order nobody recorded. Its split legs travel with the order: the gateway splits the payment
    // itself once it is captured, so there is no transfer call to make afterwards. The legs are the recorded shares
    // paid to linked accounts, summed per payout account
    const legs = splitLegs(await this.allocations.findByIntent(intent.id));
    const order = await transport.createOrder(dto.credentials, {
      amount,
      currency: intent.currency,
      receipt: intent.receipt,
      notes: { payment_intent_id: intent.id, reference: `${intent.referenceType}:${intent.referenceId}` },
      paymentIntentId: intent.id,
      ...(intent.returnUrl && { returnUrl: attemptReturnUrl(intent) }),
      ...(dto.notifyUrl && { notifyUrl: dto.notifyUrl }),
      ...(dto.checkoutCallbackBase && { callbackUrl: `${dto.checkoutCallbackBase}/${intent.id}/callback` }),
      ...(dto.mainAccountId && { mainAccountId: dto.mainAccountId }),
      ...(dto.paymentMethod && { method: dto.paymentMethod }),
      ...(dto.checkoutMode && { checkoutMode: dto.checkoutMode }),
      ...(dto.customer && { customer: dto.customer }),
      ...(legs.length > 0 && {
        transfers: legs.map((leg) => ({
          providerAccountId: leg.gatewayAccountId,
          amount: leg.amount,
          currency: intent.currency,
          notes: { payment_intent_id: intent.id, payout_account_id: leg.payoutAccountId },
        })),
      }),
    });

    const updated = await this.intents.update(intent.id, {
      providerOrderId: order.providerOrderId,
      launch: { gateway: intent.gatewayCode, ...order.checkout },
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
    const intent = await this.intentsService.require(dto.paymentIntentId);
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
    // A gateway that can be read back by order is never trusted on the browser's word: its payment is read from the
    // gateway, and an order with nothing paid yet leaves the intent as it is
    if (transport.fetchOrderPayment) {
      const read = await transport.fetchOrderPayment(dto.credentials, intent.providerOrderId);
      if (!read) return { intent: PaymentIntentDto.from(intent), events: [] };
      assertPaymentMatches(intent, read, 'gatewayResponse.orderId');
      return this.applyPayment(intent.id, read);
    }

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

  // Asks the gateway whether the intent's order was paid, and applies what it says exactly as its webhook would — so a
  // checkout can learn of a payment before the webhook arrives, and the webhook later changes nothing. An intent with
  // no gateway order yet, already paid, or on a gateway that cannot be asked is answered as it stands
  async sync(dto: SyncPaymentIntentDto): Promise<IntentWithEvents> {
    const intent = await this.intentsService.require(dto.paymentIntentId);
    if (intent.status === PaymentIntentStatusValues.SUCCEEDED || !intent.providerOrderId) {
      return { intent: PaymentIntentDto.from(intent), events: [] };
    }
    const transport = this.registry.resolve(intent.gatewayCode);
    if (!transport.fetchOrderPayment) return { intent: PaymentIntentDto.from(intent), events: [] };

    const read = await transport.fetchOrderPayment(dto.credentials, intent.providerOrderId);
    if (!read) return { intent: PaymentIntentDto.from(intent), events: [] };
    assertPaymentMatches(intent, read, 'paymentIntentId');
    this.logger.log(`Synced intent ${intent.id} from ${intent.gatewayCode}: ${read.status}`);
    return this.applyPayment(intent.id, read);
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
    return PaymentIntentDto.from(await this.intentsService.require(paymentIntentId));
  }

  // The payment intents opened for a target, newest first — a retry or another gateway each adds one
  async listByTarget(targetId: string): Promise<PaymentIntentDto[]> {
    const intents = await this.intents.findByTarget(targetId);
    return intents.map((intent) => PaymentIntentDto.from(intent));
  }

  // The payment intents opened for one thing being paid for, newest first
  async listByReference(referenceType: string, referenceId: string): Promise<PaymentIntentDto[]> {
    const intents = await this.intents.findByReference(referenceType, referenceId);
    return intents.map((intent) => PaymentIntentDto.from(intent));
  }

  // Cancels an intent the customer has not paid yet, with its event; one already cancelled is returned as it is
  async cancel(paymentIntentId: string): Promise<IntentWithEvents> {
    return this.database.runInTransaction(async () => {
      const intent = await this.intentsService.lock(paymentIntentId);
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
      const event = await this.eventsService.record(updated, PaymentEventTypeValues.CANCELED);
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
        return this.eventsService.record(updated, PaymentEventTypeValues.EXPIRED);
      });
      if (event) expired.push(event);
    }

    if (expired.length > 0) this.logger.log(`Expired ${expired.length} unpaid intent(s)`);
    return expired;
  }

  // The one place an intent moves on a gateway payment, under a row lock. Captured completes it (late, if it had
  // already expired or been cancelled — the money was taken, so it is recorded rather than lost); authorized marks it
  // processing; failed records why while the intent stays payable by another method — handing a processing intent
  // back to the customer, so it can still be paid or expire. A failure on an intent that already ended changes
  // nothing: nobody is waiting on it, so it raises no event
  private async applyPayment(intentId: string, payment: NormalizedPayment): Promise<IntentWithEvents> {
    return this.database.runInTransaction(async () => {
      const intent = await this.intentsService.lock(intentId);
      // Paid is final, refunded or not: a later capture or failure changes nothing. A refund moves the intent
      // through `applyRefund`, from the refund itself — Razorpay marks the payment refunded while the refund is pending
      if (PAID.includes(intent.status as (typeof PAID)[number])) {
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
        const event = await this.eventsService.record(updated, PaymentEventTypeValues.SUCCEEDED, { late });
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
        const event = await this.eventsService.record(updated, PaymentEventTypeValues.PAYMENT_FAILED);
        return { intent: PaymentIntentDto.from(updated), events: [event] };
      }

      return { intent: PaymentIntentDto.from(intent), events: [] };
    });
  }

  // Inserts the intent and every store's share of it, in one transaction. The split legs are not stored: they are
  // the shares paid to linked accounts, and are worked out from those when the gateway order is created
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
    // Legs are only ever derived from the shares, so a split sent without them would silently not happen
    if (legs.length > 0 && !dto.allocations?.length) {
      throw new BadRequestException({
        label: 'Allocations Required',
        detail: "A split payment must name every store's share.",
        errors: [{ field: 'allocations', message: 'Required when transfers are sent' }],
      });
    }
    assertAllocations(dto, amount);

    return this.database.runInTransaction(async () => {
      const intent = await this.intents.create({
        legalEntityId: dto.legalEntityId ?? null,
        siteId: dto.siteId ?? null,
        appId: dto.appId ?? null,
        partyId: dto.partyId ?? null,
        configId: dto.configId,
        gatewayCode: dto.gatewayCode,
        type: dto.type,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        targetId: dto.targetId ?? null,
        description: dto.description ?? null,
        idempotencyKey: dto.idempotencyKey,
        receipt: dto.referenceId.slice(0, RECEIPT_MAX_LENGTH),
        amount,
        currency: dto.currency,
        status: PaymentIntentStatusValues.CREATED,
        customer: dto.customer ?? null,
        metadata: dto.metadata ?? null,
        returnUrl: dto.returnUrl ?? null,
        retryUrl: dto.retryUrl ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : new Date(Date.now() + INTENT_TTL_MS),
      });

      await this.allocations.createMany(
        (dto.allocations ?? []).map((share) => ({
          intentId: intent.id,
          legalEntityId: share.legalEntityId,
          siteId: share.siteId ?? null,
          payoutAccountId: share.payoutAccountId,
          bankAccountId: share.bankAccountId,
          gatewayAccountId: share.gatewayAccountId,
          isMainAccount: share.isMainAccount,
          grossAmount: BigInt(share.grossAmount),
          platformFeeAmount: BigInt(share.platformFeeAmount),
          netAmount: BigInt(share.netAmount),
          currency: dto.currency,
        })),
      );
      return intent;
    });
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
): Pick<Partial<PaymentIntent>, 'returnUrl' | 'retryUrl'> | null {
  const changes: Pick<Partial<PaymentIntent>, 'returnUrl' | 'retryUrl'> = {};
  if (dto.returnUrl !== undefined && dto.returnUrl !== intent.returnUrl) changes.returnUrl = dto.returnUrl;
  if (dto.retryUrl !== undefined && dto.retryUrl !== intent.retryUrl) changes.retryUrl = dto.retryUrl;
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
function isIdempotencyKeyConflict(error: unknown): boolean {
  return isUniqueViolation(error, IDEMPOTENCY_KEY_CONSTRAINT);
}

// A Postgres unique violation of one constraint or unique index, however deep the driver wrapped it
function isUniqueViolation(error: unknown, constraint: string, depth = 0): boolean {
  if (typeof error !== 'object' || error === null || depth > 5) return false;
  const code: unknown = Reflect.get(error, 'code');
  if (typeof code === 'string') {
    return code === PG_UNIQUE_VIOLATION && Reflect.get(error, 'constraint') === constraint;
  }
  return isUniqueViolation(Reflect.get(error, 'cause'), constraint, depth + 1);
}

function mismatch(detail: string, field: string): BadRequestException {
  return new BadRequestException({
    label: 'Payment Mismatch',
    detail,
    errors: [{ field, message: 'Does not match this payment' }],
  });
}

// The shares must account for the whole payment, each must add up on its own, and the linked-account shares must
// be exactly what the legs carry — otherwise the record of whose money this was would disagree with what moved
function assertAllocations(dto: CreatePaymentIntentDto, amount: bigint): void {
  const shares = dto.allocations;
  if (!shares || shares.length === 0) return;

  const refuse = (detail: string, message: string): never => {
    throw new BadRequestException({
      label: 'Allocations Do Not Add Up',
      detail,
      errors: [{ field: 'allocations', message }],
    });
  };

  let gross = 0n;
  const netByAccount = new Map<string, bigint>();
  for (const share of shares) {
    const shareGross = BigInt(share.grossAmount);
    if (BigInt(share.platformFeeAmount) + BigInt(share.netAmount) !== shareGross) {
      refuse("A store's platform fee and payout do not add up to its share.", 'Fee + net must equal gross');
    }
    gross += shareGross;
    if (!share.isMainAccount) {
      netByAccount.set(
        share.payoutAccountId,
        (netByAccount.get(share.payoutAccountId) ?? 0n) + BigInt(share.netAmount),
      );
    }
  }
  if (gross !== amount) {
    refuse("The stores' shares do not add up to the payment.", 'Shares must add up to the amount');
  }

  const legs = new Map((dto.transfers ?? []).map((leg) => [leg.linkedAccountId, BigInt(leg.amount)]));
  const matches =
    legs.size === netByAccount.size && [...netByAccount].every(([account, net]) => legs.get(account) === net);
  if (!matches) {
    refuse('The split transfers do not match the shares paid to linked accounts.', 'Legs must match shares');
  }
}

// One leg per payout account: the linked-account shares of a payment, summed, in the order the shares were written.
// A share kept in the gateway's main account makes no leg
function splitLegs(
  allocations: PaymentAllocation[],
): { payoutAccountId: string; gatewayAccountId: string; amount: bigint }[] {
  const legs = new Map<string, { payoutAccountId: string; gatewayAccountId: string; amount: bigint }>();
  for (const share of allocations) {
    if (share.isMainAccount) continue;
    const merged = legs.get(share.payoutAccountId);
    legs.set(share.payoutAccountId, {
      payoutAccountId: share.payoutAccountId,
      gatewayAccountId: share.gatewayAccountId,
      amount: (merged?.amount ?? 0n) + share.netAmount,
    });
  }
  return [...legs.values()];
}

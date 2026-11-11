import { createHash } from 'node:crypto';
import { allowedOriginOf, effectiveOrigins, parseStorefrontUrl } from '@domain/app/allowed-origins';
import { AppDomainService } from '@domain/app/services/app.service';
import {
  PaymentGatewayConfigStatusValues,
  paymentGatewayConfigStatus,
} from '@domain/payment-gateway-config/payment-gateway-config-status';
import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import type { SwitchedOnPayoutAccount } from '@domain/payout-channel/repositories/payout-channel-bank-account.repository';
import { PayoutChannelDomainService } from '@domain/payout-channel/services/payout-channel.service';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CurrencyCode, majorToMinor, minorToMajor } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { isEmail } from 'class-validator';
import type { PaymentChannelType, PayoutAccount } from '@/db/schema';
import { SiteContextResolverService } from '@/site-context/site-context-resolver.service';
import { COMMERCE_CHECKOUT_REFERENCE_TYPE } from '../../events/services/checkout-payment-handler.service';
import { PaymentEventDispatcherService } from '../../events/services/payment-event-dispatcher.service';
import { paymentWebhookUrl, publicWebhookOrigin } from '../../webhooks/payment-webhook-url';
import type {
  CheckoutStartedResponseDto,
  CheckoutStatusResponseDto,
  CheckoutStoreShareResponseDto,
} from '../dto/response/checkout-response.dto';
import type { PaymentEventResponseDto } from '../dto/response/payment-event-response.dto';
import type { PaymentIntentResponseDto, PaymentIntentStatusValue } from '../dto/response/payment-intent-response.dto';
import type {
  CheckoutContactInput,
  CheckoutStartInput,
  ConfirmPaymentInput,
  CreatePaymentIntentInput,
  KeyValueInput,
  PaymentCustomerInput,
} from '../graphql/payment-intent.input';
import { PaymentChannel } from '../graphql/payment-intent.input';
import type { Checkout, CheckoutStatus, PaymentIntent, PaymentIntentStatus } from '../graphql/payment-intent.type';

export interface PaymentCallerContext {
  orgId: string;
  appId: string;
  partyId?: string;
  siteId?: string;
  legalEntityId?: string;
  // The origin the caller reached core on, unchecked — it becomes the order's webhook URL only once validated
  origin?: string;
}

interface IntentRequest {
  amountMinor: bigint;
  currency: string;
  reference: { type: string; id: string };
  description?: string;
  customer?: PaymentCustomerInput;
  metadata?: Record<string, string>;
  idempotencyKey: string;
  channel: PaymentChannelType;
  gatewayCode: string;
  paymentMethod?: string;
  urls: StorefrontUrls;
}

interface StorefrontUrls {
  returnUrl?: string;
  checkoutUrl?: string;
}

// What opening a checkout's payment needs to know about the checkout
interface PayableCheckout {
  checkoutId: string;
  totalMinor: string;
  currencyCode: string;
  expiresAt: string;
  sites: CheckoutStoreShareResponseDto[];
  customer: { name?: string | null; email?: string | null; phone?: string | null } | null;
}

// One seller's share of a payment, sent to the gateway with the order
interface TransferLeg {
  linkedAccountId: string;
  providerAccountId: string;
  amount: string;
}

// One store's share of a payment and where it is paid out, as payments-service records it with the intent
interface PaymentAllocation {
  legalEntityId: string;
  siteId?: string;
  payoutAccountId: string;
  bankAccountId: string;
  gatewayAccountId: string;
  isMainAccount: boolean;
  grossAmount: string;
  platformFeeAmount: string;
  netAmount: string;
}

interface ResolvedScope {
  legalEntityId: string;
  siteId?: string;
  currencyCode?: string;
}

// Fees are kept in basis points: 10000 is the whole payment
const BASIS_POINTS = 10000n;
// Razorpay refuses a transfer under 100 paise
const MIN_TRANSFER_MINOR = 100n;

// The storefront's payment surface.
@Injectable()
export class PaymentIntentsGatewayService {
  private readonly logger = new Logger(PaymentIntentsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly configService: PaymentGatewayConfigDomainService,
    private readonly payoutChannelService: PayoutChannelDomainService,
    private readonly siteContextResolver: SiteContextResolverService,
    private readonly dispatcher: PaymentEventDispatcherService,
    private readonly appService: AppDomainService,
    private readonly siteRepository: SiteDomainRepository,
    private readonly environment: ConfigService,
  ) {}

  // Opens an intent against the organization's collector, scoped to the caller's legal entity, site, app and channel
  async create(caller: PaymentCallerContext, input: CreatePaymentIntentInput): Promise<PaymentIntent> {
    if (input.checkoutId) return this.payCheckout(caller, input.checkoutId, input);
    const { amount, reference } = input;
    if (!amount || !reference) {
      throw new BadRequestException({
        label: 'Amount Required',
        detail: 'A payment needs an amount and a reference, or the checkout it pays.',
        errors: [
          ...(amount ? [] : [{ field: 'amount', message: 'Required without checkoutId' }]),
          ...(reference ? [] : [{ field: 'reference', message: 'Required without checkoutId' }]),
        ],
      });
    }
    // Reference types under commerce. are settled by core's own handlers, so an app may not open one directly
    if (reference.type.startsWith(RESERVED_REFERENCE_PREFIX)) {
      throw new BadRequestException({
        label: 'Reserved Reference Type',
        detail: `Reference types starting with "${RESERVED_REFERENCE_PREFIX}" are reserved. Use your own namespace.`,
        errors: [{ field: 'reference.type', message: 'Reserved reference type' }],
      });
    }
    const amountMinor = toMinor(amount.value, amount.currency);
    const urls = await this.requireAllowedUrls(caller, input);
    // One active payment per thing paid for: paying again for the same reference replaces the payment still waiting
    await this.replaceEarlierPayments(
      caller,
      await this.referenceIntents(caller, reference.type, reference.id),
      input.idempotencyKey,
      null,
    );
    const intent = await this.openIntent(caller, await this.resolveScope(caller), {
      amountMinor,
      currency: amount.currency,
      reference,
      description: input.description,
      customer: input.customer,
      metadata: toMetadata(input.metadata),
      idempotencyKey: input.idempotencyKey,
      channel: input.channel ?? PaymentChannel.APP,
      gatewayCode: input.gatewayCode,
      paymentMethod: input.paymentMethod,
      urls,
    });
    return toPaymentIntent(intent, caller.orgId);
  }

  // Completes an intent from the gateway checkout's response, then settles whatever it paid for.
  async confirm(caller: PaymentCallerContext, input: ConfirmPaymentInput): Promise<PaymentIntent> {
    const existing = await this.findOwned(caller, input.paymentIntentId, false);
    const { credentials } = await this.configService.getDecryptedCredentials(existing.configId);

    this.logger.log(`payments.intents.confirm — intent: ${existing.id}`);
    const { intent, events } = await this.nats.send<{
      intent: PaymentIntentResponseDto;
      events: PaymentEventResponseDto[];
    }>('payments', 'payments.intents.confirm', {
      paymentIntentId: existing.id,
      credentials,
      gatewayResponse: input.gatewayResponse,
    });

    // Never fails the confirmation: whatever does not go through now is retried by the pending-events sweep
    await this.dispatcher.dispatch(caller.orgId, events);
    return toPaymentIntent(intent, caller.orgId);
  }

  // Reads one of the app's intents
  async findById(caller: PaymentCallerContext, paymentIntentId: string): Promise<PaymentIntent> {
    return toPaymentIntent(await this.findOwned(caller, paymentIntentId, true), caller.orgId);
  }

  // Cancels one of the app's intents and settles what the cancellation produced, like a confirmation does
  async cancel(caller: PaymentCallerContext, paymentIntentId: string): Promise<PaymentIntent> {
    const existing = await this.findOwned(caller, paymentIntentId, true);
    this.logger.log(`payments.intents.cancel — intent: ${existing.id}`);
    const { intent, events } = await this.nats.send<{
      intent: PaymentIntentResponseDto;
      events: PaymentEventResponseDto[];
    }>('payments', 'payments.intents.cancel', { paymentIntentId: existing.id });

    // Never fails the cancellation: whatever does not go through now is retried by the pending-events sweep
    await this.dispatcher.dispatch(caller.orgId, events);
    return toPaymentIntent(intent, caller.orgId);
  }

  // Freezes the party's cart — every store it holds lines at, or one — into a checkout. No payment is opened here: the
  // shopper picks the gateway and method on the checkout page, and Pay opens a payment intent for it (payCheckout)
  async startCheckout(caller: PaymentCallerContext, input: CheckoutStartInput): Promise<Checkout> {
    const partyId = caller.partyId;
    if (!partyId) {
      throw new BadRequestException({
        label: 'Sign In Required',
        detail: 'Checkout needs the signed-in party whose cart is being paid for.',
      });
    }
    const sites = await this.siteRepository.findForAppByOrg(caller.orgId);

    // A party has one open checkout. Before a different cart replaces it, its payments are checked with the gateway:
    // one already paid there means the earlier order stands (answered with that checkout, now paid), one being
    // confirmed means wait
    const { checkout: open } = await this.nats.send<{ checkout: CheckoutStatusResponseDto | null }>(
      'commerce',
      'org.checkouts.findOpen',
      { partyId },
    );
    const openIntents = open ? await this.checkoutIntents(caller, open.checkoutId) : [];
    if (open) {
      const earlier = await this.checkEarlierPayments(caller, openIntents);
      if (earlier === 'paid') {
        this.logger.log(`startCheckout — the open checkout ${open.checkoutId} turned out paid; answering it`);
        return this.findCheckout(caller, open.checkoutId);
      }
      if (earlier === 'in-progress') {
        throw new ConflictException({
          label: 'Payment In Progress',
          detail: 'A payment for your earlier checkout is being confirmed. Wait for it to finish, then try again.',
        });
      }
    }

    this.logger.log(`org.checkouts.start — party: ${partyId}, store: ${input.siteId ?? 'all'}`);
    const checkout = await this.nats.send<CheckoutStartedResponseDto>('commerce', 'org.checkouts.start', {
      appId: caller.appId,
      partyId,
      currencyCode: input.currencyCode,
      ...(open ? { replaceCheckoutId: open.checkoutId } : {}),
      ...(input.siteId ? { siteIds: [input.siteId] } : {}),
      ...(input.addressId ? { addressId: input.addressId } : {}),
      sites: sites.map((site) => ({ siteId: site.id, legalEntityId: site.legalEntityId, timezone: site.timezone })),
    });
    // A different cart replaced the open checkout: its payments still waiting on the shopper end with it. One paid late
    // anyway is refused by commerce and refunded
    if (open && open.checkoutId !== checkout.checkoutId) {
      for (const intent of openIntents) {
        if (AWAITING_SHOPPER.has(intent.status)) await this.cancelIntentQuietly(caller, intent.id);
      }
    }
    return toCheckoutResult({ ...checkout, paidAt: null }, [], null);
  }

  // The party's open, live checkout, or null — for the storefront's "checkout in progress" card
  async activeCheckout(caller: PaymentCallerContext): Promise<Checkout | null> {
    if (!caller.partyId) return null;
    const { checkout } = await this.nats.send<{ checkout: CheckoutStatusResponseDto | null }>(
      'commerce',
      'org.checkouts.findOpen',
      { partyId: caller.partyId },
    );
    return checkout ? this.findCheckout(caller, checkout.checkoutId) : null;
  }

  // Where a checkout's earlier payments stand, asking the gateway about each one still waiting on the shopper rather
  // than waiting for its webhook: 'paid' when one went through (applied and settled here, as its webhook would),
  // 'in-progress' when one is being confirmed, else 'clear'. A gateway that cannot be asked, or does not answer in
  // time, leaves its payment as it stands
  private async checkEarlierPayments(
    caller: PaymentCallerContext,
    intents: PaymentIntentResponseDto[],
  ): Promise<'paid' | 'in-progress' | 'clear'> {
    if (intents.some((intent) => intent.status === 'SUCCEEDED')) return 'paid';
    if (intents.some((intent) => intent.status === 'PROCESSING')) return 'in-progress';
    let state: 'paid' | 'in-progress' | 'clear' = 'clear';
    for (const intent of intents) {
      if (!AWAITING_SHOPPER.has(intent.status)) continue;
      const status = await this.syncQuietly(caller, intent);
      if (status === 'SUCCEEDED') return 'paid';
      if (status === 'PROCESSING') state = 'in-progress';
    }
    return state;
  }

  // Asks the gateway whether one payment went through and settles the answer like its webhook would; its status after,
  // or as it stood when the gateway could not be asked in time
  private async syncQuietly(
    caller: PaymentCallerContext,
    intent: PaymentIntentResponseDto,
  ): Promise<PaymentIntentStatusValue> {
    try {
      const { credentials } = await this.configService.getDecryptedCredentials(intent.configId);
      const synced = this.nats.send<{ intent: PaymentIntentResponseDto; events: PaymentEventResponseDto[] }>(
        'payments',
        'payments.intents.sync',
        { paymentIntentId: intent.id, credentials },
      );
      const result = await Promise.race([
        synced,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), GATEWAY_CHECK_TIMEOUT_MS)),
      ]);
      if (!result) {
        this.logger.warn(`Gateway check for ${intent.id} took over ${GATEWAY_CHECK_TIMEOUT_MS} ms — treated as unpaid`);
        return intent.status;
      }
      await this.dispatcher.dispatch(caller.orgId, result.events);
      return result.intent.status;
    } catch (error: unknown) {
      this.logger.warn(
        `Gateway check for ${intent.id} failed — treated as unpaid: ${error instanceof Error ? error.message : String(error)}`,
      );
      return intent.status;
    }
  }

  // Opens a payment intent for one of the party's open checkouts through the gateway and method the shopper picked —
  // every press of Pay is its own payment, and a checkout has one active payment: the earlier ones still waiting are
  // checked with the gateway, then cancelled, before the new one opens
  private async payCheckout(
    caller: PaymentCallerContext,
    checkoutId: string,
    input: CreatePaymentIntentInput,
  ): Promise<PaymentIntent> {
    const partyId = caller.partyId;
    if (!partyId) {
      throw new BadRequestException({
        label: 'Sign In Required',
        detail: 'A checkout is paid by the signed-in party it belongs to.',
      });
    }
    if (input.amount || input.reference) {
      throw new BadRequestException({
        label: 'Checkout Sets The Amount',
        detail: 'A checkout payment takes its amount and reference from the checkout. Leave them out.',
        errors: [{ field: input.amount ? 'amount' : 'reference', message: 'Not allowed with checkoutId' }],
      });
    }
    const checkout = await this.nats.send<CheckoutStatusResponseDto>('commerce', 'org.checkouts.get', {
      checkoutId,
      partyId,
    });
    assertPayable(checkout);
    // One active payment per checkout: the earlier ones are checked with the gateway, then the ones still waiting end
    await this.replaceEarlierPayments(
      caller,
      await this.checkoutIntents(caller, checkoutId),
      input.idempotencyKey,
      'checkout',
    );

    const urls = await this.requireAllowedUrls(caller, input);
    const sites = await this.siteRepository.findForAppByOrg(caller.orgId);
    const intent = await this.openCheckoutIntent(
      caller,
      checkout,
      input.gatewayCode,
      urls,
      input.idempotencyKey,
      sites,
      input.paymentMethod,
    );
    return toPaymentIntent(intent, caller.orgId);
  }

  // Ends one of the party's open checkouts at the shopper's request: its payments still waiting on them are cancelled,
  // then the checkout. One already cancelled or expired answers as it is; one paid, or being paid, is refused
  async cancelCheckout(caller: PaymentCallerContext, checkoutId: string): Promise<Checkout> {
    const partyId = caller.partyId;
    if (!partyId) {
      throw new BadRequestException({
        label: 'Sign In Required',
        detail: 'A checkout is cancelled by the signed-in party it belongs to.',
      });
    }
    const checkout = await this.nats.send<CheckoutStatusResponseDto>('commerce', 'org.checkouts.get', {
      checkoutId,
      partyId,
    });
    if (checkout.status === 'CANCELLED' || checkout.status === 'EXPIRED') return this.findCheckout(caller, checkoutId);
    if (checkout.status === 'PAID' || checkout.status === 'CONVERTED') {
      throw new ConflictException({
        label: 'Already Paid',
        detail: 'This checkout has been paid and cannot be cancelled.',
      });
    }
    const intents = await this.checkoutIntents(caller, checkoutId);
    if (intents.some((intent) => intent.status === 'SUCCEEDED')) {
      throw new ConflictException({
        label: 'Already Paid',
        detail: 'This checkout has been paid and cannot be cancelled.',
      });
    }
    if (intents.some((intent) => intent.status === 'PROCESSING')) {
      throw new ConflictException({
        label: 'Payment In Progress',
        detail: 'A payment for this checkout is being confirmed. Wait for it to finish.',
      });
    }
    for (const intent of intents) {
      if (AWAITING_SHOPPER.has(intent.status)) await this.cancel(caller, intent.id);
    }
    this.logger.log(`org.checkouts.cancel — checkout: ${checkoutId} (by the shopper)`);
    await this.nats.send('commerce', 'org.checkouts.cancel', { checkoutId, reason: 'Cancelled by the shopper.' });
    return this.findCheckout(caller, checkoutId);
  }

  // Delivers one of the party's open checkouts to another of their saved addresses — the same checkout, its window and
  // its payments unchanged
  async changeCheckoutAddress(caller: PaymentCallerContext, checkoutId: string, addressId: string): Promise<Checkout> {
    const partyId = this.requireCheckoutParty(caller);
    this.logger.log(`org.checkouts.changeAddress — checkout: ${checkoutId}`);
    await this.nats.send('commerce', 'org.checkouts.changeAddress', { checkoutId, partyId, addressId });
    return this.findCheckout(caller, checkoutId);
  }

  // Changes who one of the party's open checkouts is for: the contact the checkout holds, never the party's profile
  async changeCheckoutContact(caller: PaymentCallerContext, input: CheckoutContactInput): Promise<Checkout> {
    const partyId = this.requireCheckoutParty(caller);
    this.logger.log(`org.checkouts.changeContact — checkout: ${input.checkoutId}`);
    await this.nats.send('commerce', 'org.checkouts.changeContact', {
      checkoutId: input.checkoutId,
      partyId,
      name: input.name,
      phone: input.phone,
      ...(input.email ? { email: input.email } : {}),
    });
    return this.findCheckout(caller, input.checkoutId);
  }

  // The signed-in party a checkout change is made for, refused when the caller has none
  private requireCheckoutParty(caller: PaymentCallerContext): string {
    if (!caller.partyId) {
      throw new BadRequestException({
        label: 'Sign In Required',
        detail: 'A checkout is changed by the signed-in party it belongs to.',
      });
    }
    return caller.partyId;
  }

  // The payments the calling app opened for a checkout, newest first
  private async checkoutIntents(caller: PaymentCallerContext, checkoutId: string): Promise<PaymentIntentResponseDto[]> {
    const intents = await this.nats.send<PaymentIntentResponseDto[]>('payments', 'payments.intents.listByTarget', {
      targetId: checkoutId,
    });
    return intents.filter(
      (intent) => intent.appId === caller.appId && (!intent.partyId || intent.partyId === caller.partyId),
    );
  }

  // The payments the calling app opened for one thing paid for, newest first
  private async referenceIntents(
    caller: PaymentCallerContext,
    referenceType: string,
    referenceId: string,
  ): Promise<PaymentIntentResponseDto[]> {
    const intents = await this.nats.send<PaymentIntentResponseDto[]>('payments', 'payments.intents.listByReference', {
      referenceType,
      referenceId,
    });
    return intents.filter(
      (intent) => intent.appId === caller.appId && (!intent.partyId || intent.partyId === caller.partyId),
    );
  }

  // Makes room for a new payment of the same thing — a checkout, a booking, anything with a reference. The earlier
  // payments are checked with their gateway first: one that went through refuses the new payment ("paid"), one being
  // confirmed asks to wait; the ones still waiting on the shopper are cancelled. A retry of the same request (same
  // idempotency key) keeps its own payment, which payments-service hands back as it is
  private async replaceEarlierPayments(
    caller: PaymentCallerContext,
    earlier: PaymentIntentResponseDto[],
    idempotencyKey: string,
    subject: 'checkout' | null,
  ): Promise<void> {
    if (earlier.length === 0) return;
    const state = await this.checkEarlierPayments(caller, earlier);
    if (state === 'paid') {
      throw new ConflictException({
        label: 'Already Paid',
        detail:
          subject === 'checkout' ? 'This checkout has been paid. Its orders are being created.' : 'This has been paid.',
      });
    }
    if (state === 'in-progress') {
      throw new ConflictException({
        label: 'Payment In Progress',
        detail: `A payment for this${subject === 'checkout' ? ' checkout' : ''} is being confirmed. Wait for it to finish before paying again.`,
      });
    }
    for (const previous of earlier) {
      if (previous.idempotencyKey !== idempotencyKey && AWAITING_SHOPPER.has(previous.status)) {
        await this.cancelIntentQuietly(caller, previous.id);
      }
    }
  }

  // Opens a payment for a checkout through the gateway picked: each store's share paid out to that store's account
  private async openCheckoutIntent(
    caller: PaymentCallerContext,
    checkout: PayableCheckout,
    gatewayCode: string,
    urls: StorefrontUrls,
    idempotencyKey: string,
    sites: { id: string; name: string }[],
    method?: string,
  ): Promise<PaymentIntentResponseDto> {
    const plan = await this.planPayouts(caller, checkout.sites, gatewayCode);
    const config = await this.configService.getDecryptedCredentials(plan.configId);
    // A one-store checkout keeps the store on the intent, as a plain order payment would
    const only = checkout.sites.length === 1 ? checkout.sites[0] : undefined;
    const siteNames = checkout.sites.map((share) => sites.find((site) => site.id === share.siteId)?.name ?? 'store');
    const customer = checkoutCustomer(checkout.customer);

    this.logger.log(
      `payments.intents.create — checkout:${checkout.checkoutId} app: ${caller.appId} config: ${plan.configId} legs: ${plan.transfers.length}`,
    );
    return this.nats.send<PaymentIntentResponseDto>('payments', 'payments.intents.create', {
      ...(only ? { legalEntityId: only.legalEntityId, siteId: only.siteId } : {}),
      appId: caller.appId,
      partyId: caller.partyId,
      configId: plan.configId,
      gatewayCode: config.gatewayCode,
      ...this.notifyUrlFor(caller, config.gatewayCode, plan.configId),
      ...checkoutCallbackBaseFor(caller.origin, caller.orgId),
      mainAccountId: config.gatewayAccountId,
      ...(plan.transfers.length > 0 && { transfers: plan.transfers }),
      allocations: plan.allocations,
      type: PaymentChannel.APP,
      credentials: config.credentials,
      amount: checkout.totalMinor,
      currency: checkout.currencyCode,
      referenceType: COMMERCE_CHECKOUT_REFERENCE_TYPE,
      referenceId: checkout.checkoutId,
      targetId: checkout.checkoutId,
      description: `Order at ${siteNames.join(', ')}`.slice(0, 500),
      ...(customer && { customer }),
      ...(method && { paymentMethod: method }),
      // The gateway's checkout opens as the organization set it on the gateway config
      checkoutMode: config.checkoutMode,
      ...(urls.returnUrl ? { returnUrl: urls.returnUrl } : {}),
      ...(urls.checkoutUrl ? { retryUrl: urls.checkoutUrl } : {}),
      // The payment window is the checkout's
      expiresAt: checkout.expiresAt,
      // A retried Pay sends the same key, so payments-service hands back the payment it already opened
      idempotencyKey: namespacedIdempotencyKey(caller, idempotencyKey),
    });
  }

  // Cancels a payment nobody will pay, never failing the caller
  private async cancelIntentQuietly(caller: PaymentCallerContext, paymentIntentId: string): Promise<void> {
    try {
      await this.cancel(caller, paymentIntentId);
    } catch (error: unknown) {
      this.logger.warn(
        `Cancelling replaced intent ${paymentIntentId} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Where one of the party's checkouts stands, with its payment and the orders it became
  async findCheckout(caller: PaymentCallerContext, checkoutId: string): Promise<Checkout> {
    const partyId = caller.partyId;
    if (!partyId) {
      throw new BadRequestException({
        label: 'Sign In Required',
        detail: 'A checkout belongs to the signed-in party.',
      });
    }
    const status = await this.nats.send<CheckoutStatusResponseDto>('commerce', 'org.checkouts.get', {
      checkoutId,
      partyId,
    });
    // The payment that paid it, else the latest one opened for it
    const intents = await this.checkoutIntents(caller, checkoutId);
    const paidBy = status.orders.find((order) => order.paymentIntentId)?.paymentIntentId;
    const intent = (paidBy ? intents.find((candidate) => candidate.id === paidBy) : undefined) ?? intents[0] ?? null;
    return toCheckoutResult(status, status.orders, intent ? toPaymentIntent(intent, caller.orgId) : null);
  }

  // The payout account of every store in the checkout through the gateway the shopper picked, and the split legs
  // their shares make. One gateway account must take the whole payment, so every store must resolve to the same
  // config; stores paid into the same linked account share one leg, and a store on the main account needs none
  private async planPayouts(
    caller: PaymentCallerContext,
    shares: CheckoutStoreShareResponseDto[],
    gatewayCode: string,
  ): Promise<{ configId: string; transfers: TransferLeg[]; allocations: PaymentAllocation[] }> {
    const payouts: { share: CheckoutStoreShareResponseDto; payout: PayoutAccount }[] = [];
    for (const share of shares) {
      const payout = await this.payoutChannelService.resolve(
        { legalEntityId: share.legalEntityId, siteId: share.siteId, appId: caller.appId, channel: PaymentChannel.APP },
        gatewayCode,
      );
      if (!payout) {
        throw new BadRequestException({
          label: 'Payments Not Set Up',
          detail: `${gatewayCode} is not switched on for every store in this checkout. Pick one of the cart's checkout gateways, or check the stores out on their own.`,
          errors: [{ field: 'gatewayCode', message: 'Not available for every store' }],
        });
      }
      assertGatewayReady(payout);
      payouts.push({ share, payout });
    }

    const configIds = new Set(payouts.map((entry) => entry.payout.paymentGatewayConfigId));
    if (configIds.size > 1) {
      throw new BadRequestException({
        label: 'Stores Pay Separately',
        detail: `The stores in this checkout take ${gatewayCode} through different gateway accounts, so one payment cannot cover them. Check out each store on its own.`,
        errors: [{ field: 'gatewayCode', message: 'Not shared by every store' }],
      });
    }

    const allocations: PaymentAllocation[] = [];
    for (const { share, payout } of payouts) {
      allocations.push(
        await this.allocationFor(payout, BigInt(share.subtotalMinor), {
          legalEntityId: share.legalEntityId,
          siteId: share.siteId,
        }),
      );
    }
    return { configId: payouts[0].payout.paymentGatewayConfigId, transfers: legsFor(allocations), allocations };
  }

  // Resolves the config, decrypts its credentials and asks payments-service for the intent
  private async openIntent(
    caller: PaymentCallerContext,
    scope: ResolvedScope,
    request: IntentRequest,
  ): Promise<PaymentIntentResponseDto> {
    if (request.amountMinor <= 0n) {
      throw new BadRequestException({
        label: 'Invalid Amount',
        detail: 'A payment must be for more than zero.',
        errors: [{ field: 'amount.value', message: 'Must be greater than zero' }],
      });
    }

    const payout = await this.requirePayoutAccount(caller, scope, request.channel, request.gatewayCode);
    const configId = payout.paymentGatewayConfigId;
    const { gatewayCode, credentials, gatewayAccountId, checkoutMode } =
      await this.configService.getDecryptedCredentials(configId);
    const allocation = await this.allocationFor(payout, request.amountMinor, {
      legalEntityId: scope.legalEntityId,
      siteId: scope.siteId,
    });
    const transfers = legsFor([allocation]);

    this.logger.log(
      `payments.intents.create — ${request.reference.type}:${request.reference.id} app: ${caller.appId} config: ${configId} payout: ${payout.id}`,
    );
    return this.nats.send<PaymentIntentResponseDto>('payments', 'payments.intents.create', {
      legalEntityId: scope.legalEntityId,
      ...(scope.siteId ? { siteId: scope.siteId } : {}),
      appId: caller.appId,
      ...(caller.partyId ? { partyId: caller.partyId } : {}),
      configId,
      gatewayCode,
      ...this.notifyUrlFor(caller, gatewayCode, configId),
      ...checkoutCallbackBaseFor(caller.origin, caller.orgId),
      mainAccountId: gatewayAccountId,
      ...(transfers.length > 0 && { transfers }),
      allocations: [allocation],
      type: request.channel,
      credentials,
      amount: request.amountMinor.toString(),
      currency: request.currency,
      referenceType: request.reference.type,
      referenceId: request.reference.id,
      ...(request.description ? { description: request.description } : {}),
      ...(request.customer ? { customer: request.customer } : {}),
      ...(request.metadata ? { metadata: request.metadata } : {}),
      ...(request.paymentMethod ? { paymentMethod: request.paymentMethod } : {}),
      checkoutMode,
      ...(request.urls.returnUrl ? { returnUrl: request.urls.returnUrl } : {}),
      ...(request.urls.checkoutUrl ? { retryUrl: request.urls.checkoutUrl } : {}),
      idempotencyKey: namespacedIdempotencyKey(caller, request.idempotencyKey),
    });
  }

  // The payout account a payment goes to through the gateway the shopper picked: the most specific one of the
  // payment's legal entity that fits its site, app and channel. A 400 when that gateway pays out nowhere here
  private async requirePayoutAccount(
    caller: PaymentCallerContext,
    scope: ResolvedScope,
    channel: PaymentChannelType,
    gatewayCode: string,
  ): Promise<PayoutAccount> {
    const payout = await this.payoutChannelService.resolve(
      { legalEntityId: scope.legalEntityId, siteId: scope.siteId, appId: caller.appId, channel },
      gatewayCode,
    );
    if (!payout) {
      throw new BadRequestException({
        label: 'Payments Not Set Up',
        detail: `${gatewayCode} is not switched on for this store's payouts. Pick one of the cart's checkout gateways, or switch it on in Vritti Cloud.`,
        errors: [{ field: 'gatewayCode', message: 'Not available here' }],
      });
    }
    assertGatewayReady(payout);
    return payout;
  }

  // One store's share of a payment through its payout account. A share kept in the gateway's main account stays
  // whole there and nothing is transferred; a linked account receives the share less Vritti's fee (platform gateways
  // only — an organization's own gateway carries no fee), and the main account keeps the fee
  private async allocationFor(
    payout: PayoutAccount,
    amountMinor: bigint,
    store: { legalEntityId: string; siteId?: string },
  ): Promise<PaymentAllocation> {
    const fee = payout.isMainAccount ? 0n : await this.platformFee(payout, amountMinor);
    const net = amountMinor - fee;
    if (!payout.isMainAccount && net < MIN_TRANSFER_MINOR) {
      throw new BadRequestException({
        label: 'Amount Too Small To Split',
        detail:
          'After the platform fee this payment leaves less than ₹1 to pay out, the least a split transfer can carry.',
        errors: [{ field: 'amount.value', message: 'Too small to split' }],
      });
    }
    return {
      legalEntityId: store.legalEntityId,
      ...(store.siteId ? { siteId: store.siteId } : {}),
      payoutAccountId: payout.id,
      bankAccountId: payout.bankAccountId,
      gatewayAccountId: payout.gatewayAccountId,
      isMainAccount: payout.isMainAccount,
      grossAmount: amountMinor.toString(),
      platformFeeAmount: fee.toString(),
      netAmount: net.toString(),
    };
  }

  private async platformFee(payout: PayoutAccount, amountMinor: bigint): Promise<bigint> {
    const config = await this.configService.findById('organization', payout.paymentGatewayConfigId);
    return (amountMinor * BigInt(config.platformFeeBps)) / BASIS_POINTS;
  }

  // Where the gateway delivers this payment's webhooks, for a gateway that takes the URL on each order: our own
  // webhook route for the org and config, on the origin the caller reached core on once it is provably public and ours.
  // Nothing when it is not — a local core, a spoofed host — and the gateway then uses its dashboard setting
  private notifyUrlFor(caller: PaymentCallerContext, gatewayCode: string, configId: string): { notifyUrl?: string } {
    const origin = publicWebhookOrigin(caller.origin, this.environment.get<string>('BASE_DOMAIN'));
    return origin ? { notifyUrl: paymentWebhookUrl(origin, caller.orgId, gatewayCode, configId) } : {};
  }

  // The storefront urls the hosted checkout may redirect to, each refused unless its origin is one the calling app
  // allows — otherwise any app could turn core's callback into an open redirect
  private async requireAllowedUrls(caller: PaymentCallerContext, input: StorefrontUrls): Promise<StorefrontUrls> {
    if (!input.returnUrl && !input.checkoutUrl) return {};
    const app = await this.appService.findInOrg(caller.appId, caller.orgId);
    const allowedOrigins = app ? effectiveOrigins(app) : [];
    for (const field of ['returnUrl', 'checkoutUrl'] as const) {
      const value = input[field];
      if (value && !allowedOriginOf(value, allowedOrigins)) {
        const origin = parseStorefrontUrl(value)?.origin ?? originForMessage(value);
        this.logger.warn(`Refused ${field} for app ${caller.appId} — origin ${origin} is not allowed`);
        throw new BadRequestException({
          label: 'Return URL Not Allowed',
          detail: `${origin} is not an allowed origin for this app. Add it to the app's allowed origins in Vritti Cloud.`,
          errors: [{ field, message: `Origin ${origin} is not allowed` }],
        });
      }
    }
    return {
      ...(input.returnUrl ? { returnUrl: input.returnUrl } : {}),
      ...(input.checkoutUrl ? { checkoutUrl: input.checkoutUrl } : {}),
    };
  }

  // The site's legal entity when a site is in context, otherwise the legal entity header on its own
  private async resolveScope(caller: PaymentCallerContext): Promise<ResolvedScope> {
    if (caller.siteId) {
      const site = await this.siteContextResolver.resolve(caller.siteId);
      return { legalEntityId: site.legalEntityId, siteId: caller.siteId, currencyCode: site.siteCurrencyCode };
    }
    if (caller.legalEntityId) return { legalEntityId: caller.legalEntityId };
    throw new BadRequestException({
      label: 'Workspace Required',
      detail: 'Payments are taken for a site or a legal entity. Send the x-site-id or x-le-id header.',
      errors: [{ field: 'x-site-id', message: 'Required when x-le-id is absent' }],
    });
  }

  // Loads an intent and hides it unless the calling app opened it.
  private async findOwned(
    caller: PaymentCallerContext,
    paymentIntentId: string,
    requireParty: boolean,
  ): Promise<PaymentIntentResponseDto> {
    const intent = await this.nats.send<PaymentIntentResponseDto>('payments', 'payments.intents.get', {
      paymentIntentId,
    });
    const partyMismatch = !!intent.partyId && (caller.partyId ? intent.partyId !== caller.partyId : requireParty);
    if (intent.appId !== caller.appId || partyMismatch) {
      throw new NotFoundException({
        label: 'Payment Not Found',
        detail: 'That payment intent does not exist for this app.',
      });
    }
    return intent;
  }
}

const RESERVED_REFERENCE_PREFIX = 'commerce.';

// Payment intents still waiting on the shopper: a newer payment for the same checkout replaces them
const AWAITING_SHOPPER = new Set(['CREATED', 'REQUIRES_ACTION']);

// How long a checkout waits on a gateway's "was this order paid?" before treating the payment as unpaid
const GATEWAY_CHECK_TIMEOUT_MS = 3000;

// Refuses to open a payment for a checkout that can no longer be paid
function assertPayable(checkout: CheckoutStatusResponseDto): void {
  if (checkout.status === 'PAID' || checkout.status === 'CONVERTED') {
    throw new ConflictException({ label: 'Already Paid', detail: 'This checkout has been paid.' });
  }
  if (checkout.status === 'CANCELLED') {
    throw new ConflictException({
      label: 'Checkout Cancelled',
      detail: 'This checkout was cancelled. Check out again from your cart.',
    });
  }
  if (checkout.status === 'EXPIRED' || new Date(checkout.expiresAt).getTime() <= Date.now()) {
    throw new ConflictException({
      label: 'Checkout Expired',
      detail: 'This checkout has closed without payment. Check out again from your cart.',
    });
  }
}

// The key payments-service dedupes on: the caller's key scoped to its app and party, so two apps (or two shoppers)
// reusing the same client key never collide on one intent
export function namespacedIdempotencyKey(caller: PaymentCallerContext, clientKey: string): string {
  return createHash('sha256')
    .update(`${caller.appId}|${caller.partyId ?? ''}|${clientKey}`)
    .digest('hex');
}

function toMinor(value: string, currency: string): bigint {
  return majorToMinor(value, currency as CurrencyCode, 'amount.value');
}

// Folds the key/value list into the record payments-service stores; a repeated key keeps its last value
function toMetadata(entries: KeyValueInput[] | undefined): Record<string, string> | undefined {
  if (!entries || entries.length === 0) return undefined;
  return Object.fromEntries(entries.map((entry) => [entry.key, entry.value]));
}

// The origin to name in an error for a URL that is not an allowed storefront page, without echoing a whole URL back
function originForMessage(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return 'That URL';
  }
}

// Gateways whose embedded checkout posts its result to a callback url core can host
const HOSTED_CALLBACK_GATEWAYS = new Set(['razorpay', 'hdfc-razorpay']);

// The paths of core's hosted checkout callback for an intent — paths only, as core does not know its public origin
export function checkoutCallbackPaths(orgId: string, paymentIntentId: string) {
  const base = `/payments/checkout/${orgId}/${paymentIntentId}`;
  return { callbackPath: `${base}/callback`, cancelPath: `${base}/cancel` };
}

// Core's hosted checkout callback for the organization, on the origin the caller reached core on — for a gateway that
// takes the URL its result is posted to when the payment is opened (Easebuzz). The browser is sent there, so it only
// has to be an http(s) origin the caller could reach; a spoofed host only redirects the caller's own payment result
export function checkoutCallbackBaseFor(origin: string | undefined, orgId: string): { checkoutCallbackBase?: string } {
  if (!origin) return {};
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return {};
    return { checkoutCallbackBase: `${url.origin}/payments/checkout/${orgId}` };
  } catch {
    return {};
  }
}

// Shapes a payments-service intent for the storefront: launch data as a JSON string, failure folded into one object
export function toPaymentIntent(intent: PaymentIntentResponseDto, orgId: string): PaymentIntent {
  return {
    id: intent.id,
    status: intent.status as PaymentIntentStatus,
    amount: intent.amount,
    reference: intent.reference,
    description: intent.description,
    gatewayCode: intent.gatewayCode,
    method: intent.method,
    checkoutId: intent.targetId ?? null,
    checkout: toCheckout(intent, orgId),
    failure:
      intent.failureCode || intent.failureMessage ? { code: intent.failureCode, message: intent.failureMessage } : null,
    paidAt: intent.succeededAt,
    expiresAt: intent.expiresAt,
    createdAt: intent.createdAt,
  };
}

function toCheckout(intent: PaymentIntentResponseDto, orgId: string): PaymentIntent['checkout'] {
  if (!intent.launch) return null;
  const { gateway, ...launch } = intent.launch;
  const gatewayCode = typeof gateway === 'string' ? gateway : intent.gatewayCode;
  // Only an intent the storefront gave somewhere to come back to is sent through core's hosted callback
  const hosted = (intent.returnUrl || intent.retryUrl) && HOSTED_CALLBACK_GATEWAYS.has(gatewayCode);
  const paths = hosted ? checkoutCallbackPaths(orgId, intent.id) : { callbackPath: null, cancelPath: null };
  return { gateway: gatewayCode, payload: JSON.stringify(launch), ...paths };
}

// The split legs the shares make: one per linked account, carrying the net of every share paid to it. A share kept
// in the main account makes none
function legsFor(allocations: PaymentAllocation[]): TransferLeg[] {
  const legs = new Map<string, TransferLeg>();
  for (const share of allocations) {
    if (share.isMainAccount) continue;
    const merged = legs.get(share.payoutAccountId);
    legs.set(share.payoutAccountId, {
      linkedAccountId: share.payoutAccountId,
      providerAccountId: share.gatewayAccountId,
      amount: ((merged ? BigInt(merged.amount) : 0n) + BigInt(share.netAmount)).toString(),
    });
  }
  return [...legs.values()];
}

// Shapes a commerce checkout for the storefront, with the payment opened for it when there is one
function toCheckoutResult(
  checkout: Pick<
    CheckoutStartedResponseDto,
    'checkoutId' | 'status' | 'currencyCode' | 'total' | 'sites' | 'expiresAt'
  > & {
    paidAt: string | null;
    partyAddressId?: string | null;
    customer?: { name: string | null; phone: string | null; email: string | null } | null;
  },
  orders: CheckoutStatusResponseDto['orders'],
  paymentIntent: PaymentIntent | null,
): Checkout {
  return {
    id: checkout.checkoutId,
    status: checkout.status as CheckoutStatus,
    currencyCode: checkout.currencyCode,
    total: checkout.total,
    sites: checkout.sites.map((share) => ({
      siteId: share.siteId,
      legalEntityId: share.legalEntityId,
      subtotal: {
        currency: checkout.currencyCode,
        value: minorToMajor(BigInt(share.subtotalMinor), checkout.currencyCode as CurrencyCode),
      },
    })),
    expiresAt: checkout.expiresAt,
    paidAt: checkout.paidAt,
    partyAddressId: checkout.partyAddressId ?? null,
    customer: {
      name: checkout.customer?.name ?? null,
      phone: checkout.customer?.phone ?? null,
      email: checkout.customer?.email ?? null,
    },
    orders: orders.map((order) => ({ siteId: order.siteId, orderId: order.orderId, orderNumber: order.orderNumber })),
    paymentIntent,
  };
}

// The shopper's contact details as the payment intent takes them, so the gateway's page comes prefilled
function checkoutCustomer(
  customer: PayableCheckout['customer'],
): { name?: string; email?: string; phone?: string } | undefined {
  if (!customer) return undefined;
  const name = customer.name?.trim().slice(0, 200);
  const phone = customer.phone?.trim().slice(0, 20);
  const email = customer.email?.trim();
  const result = {
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    ...(email && email.length <= 200 && isEmail(email) ? { email } : {}),
  };
  return Object.keys(result).length > 0 ? result : undefined;
}

// Refuses a payment through a gateway config that may not take payments yet, saying what it is still waiting for
function assertGatewayReady(payout: SwitchedOnPayoutAccount): void {
  const status = paymentGatewayConfigStatus(payout.config);
  if (status === PaymentGatewayConfigStatusValues.ACTIVE) return;
  const missing =
    status === PaymentGatewayConfigStatusValues.KEYS_NOT_VERIFIED
      ? 'its API keys have not been verified'
      : 'its webhook has not been verified — no signed webhook has reached it yet';
  throw new BadRequestException({
    label: 'Gateway Not Ready',
    detail: `${payout.config.gatewayCode} cannot take payments yet: ${missing}. Finish connecting it in Vritti Cloud.`,
    errors: [{ field: 'gatewayCode', message: 'Gateway not ready' }],
  });
}

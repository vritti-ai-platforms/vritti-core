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
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CurrencyCode, majorToMinor, minorToMajor } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { isEmail } from 'class-validator';
import type { PaymentChannelType, PayoutAccount } from '@/db/schema';
import { SiteContextResolverService } from '@/site-context/site-context-resolver.service';
import { isDefinitiveRejection } from '../../events/payment-rejection';
import { COMMERCE_CHECKOUT_REFERENCE_TYPE } from '../../events/services/checkout-payment-handler.service';
import { PaymentEventDispatcherService } from '../../events/services/payment-event-dispatcher.service';
import { paymentWebhookUrl, publicWebhookOrigin } from '../../webhooks/payment-webhook-url';
import type {
  CheckoutStartedResponseDto,
  CheckoutStatusResponseDto,
  CheckoutStoreShareResponseDto,
} from '../dto/response/checkout-response.dto';
import type { PaymentEventResponseDto } from '../dto/response/payment-event-response.dto';
import type { PaymentIntentResponseDto } from '../dto/response/payment-intent-response.dto';
import type {
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
  urls: StorefrontUrls;
}

interface StorefrontUrls {
  returnUrl?: string;
  checkoutUrl?: string;
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
    // Reference types under commerce. are settled by core's own handlers, so an app may not open one directly
    if (input.reference.type.startsWith(RESERVED_REFERENCE_PREFIX)) {
      throw new BadRequestException({
        label: 'Reserved Reference Type',
        detail: `Reference types starting with "${RESERVED_REFERENCE_PREFIX}" are reserved. Use your own namespace.`,
        errors: [{ field: 'reference.type', message: 'Reserved reference type' }],
      });
    }
    const amountMinor = toMinor(input.amount.value, input.amount.currency);
    const urls = await this.requireAllowedUrls(caller, input);
    const intent = await this.openIntent(caller, await this.resolveScope(caller), {
      amountMinor,
      currency: input.amount.currency,
      reference: input.reference,
      description: input.description,
      customer: input.customer,
      metadata: toMetadata(input.metadata),
      idempotencyKey: input.idempotencyKey,
      channel: input.channel ?? PaymentChannel.APP,
      gatewayCode: input.gatewayCode,
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

  // Freezes the party's cart — every store it holds lines at, or one — into a checkout and opens the one payment for
  // it. Each store's share is paid out to that store's account through the gateway the shopper picked
  async startCheckout(caller: PaymentCallerContext, input: CheckoutStartInput): Promise<Checkout> {
    const partyId = caller.partyId;
    if (!partyId) {
      throw new BadRequestException({
        label: 'Sign In Required',
        detail: 'Checkout needs the signed-in party whose cart is being paid for.',
      });
    }
    const urls = await this.requireAllowedUrls(caller, input);
    const sites = await this.siteRepository.findForAppByOrg(caller.orgId);

    this.logger.log(`org.checkouts.start — party: ${partyId}, store: ${input.siteId ?? 'all'}`);
    const checkout = await this.nats.send<CheckoutStartedResponseDto>('commerce', 'org.checkouts.start', {
      appId: caller.appId,
      partyId,
      currencyCode: input.currencyCode,
      gatewayCode: input.gatewayCode,
      checkoutKey: input.idempotencyKey,
      ...(input.siteId ? { siteIds: [input.siteId] } : {}),
      ...(input.addressId ? { addressId: input.addressId } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
      sites: sites.map((site) => ({ siteId: site.id, legalEntityId: site.legalEntityId, timezone: site.timezone })),
    });

    const plan = await this.planPayouts(caller, checkout.sites, input.gatewayCode);
    const { gatewayCode, credentials, gatewayAccountId } = await this.configService.getDecryptedCredentials(
      plan.configId,
    );
    // A one-store checkout keeps the store on the intent, as a plain order payment would
    const only = checkout.sites.length === 1 ? checkout.sites[0] : undefined;
    const siteNames = checkout.sites.map((share) => sites.find((site) => site.id === share.siteId)?.name ?? 'store');
    const customer = checkoutCustomer(checkout.customer);

    this.logger.log(
      `payments.intents.create — checkout:${checkout.checkoutId} app: ${caller.appId} config: ${plan.configId} legs: ${plan.transfers.length}`,
    );
    let intent: PaymentIntentResponseDto;
    try {
      intent = await this.nats.send<PaymentIntentResponseDto>('payments', 'payments.intents.create', {
        ...(only ? { legalEntityId: only.legalEntityId, siteId: only.siteId } : {}),
        appId: caller.appId,
        partyId,
        configId: plan.configId,
        gatewayCode,
        ...this.notifyUrlFor(caller, gatewayCode, plan.configId),
        ...checkoutCallbackBaseFor(caller.origin, caller.orgId),
        mainAccountId: gatewayAccountId,
        ...(plan.transfers.length > 0 && { transfers: plan.transfers }),
        allocations: plan.allocations,
        type: PaymentChannel.APP,
        credentials,
        amount: checkout.totalMinor,
        currency: checkout.currencyCode,
        referenceType: COMMERCE_CHECKOUT_REFERENCE_TYPE,
        referenceId: checkout.checkoutId,
        description: `Order at ${siteNames.join(', ')}`.slice(0, 500),
        metadata: { checkoutId: checkout.checkoutId },
        ...(customer && { customer }),
        ...(urls.returnUrl ? { returnUrl: urls.returnUrl } : {}),
        ...(urls.checkoutUrl ? { checkoutUrl: urls.checkoutUrl } : {}),
        // The payment window is the checkout's
        expiresAt: checkout.expiresAt,
        // A retried checkout reuses the checkout this key already opened, so the payment below is the same payment
        idempotencyKey: namespacedIdempotencyKey(caller, input.idempotencyKey),
      });
    } catch (error: unknown) {
      if (!checkout.reused && isDefinitiveRejection(error)) await this.cancelCheckoutQuietly(checkout.checkoutId);
      throw error;
    }

    await this.nats.send('commerce', 'org.checkouts.bindIntent', {
      checkoutId: checkout.checkoutId,
      paymentIntentId: intent.id,
    });
    return toCheckoutResult(checkout, [], toPaymentIntent(intent, caller.orgId));
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
    const intent = status.paymentIntentId ? await this.findOwned(caller, status.paymentIntentId, true) : null;
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

  private async cancelCheckoutQuietly(checkoutId: string): Promise<void> {
    try {
      this.logger.log(`org.checkouts.cancel — checkout: ${checkoutId} (payment could not be opened)`);
      await this.nats.send('commerce', 'org.checkouts.cancel', {
        checkoutId,
        reason: 'Payment could not be started.',
      });
    } catch (error: unknown) {
      this.logger.error(
        `Cancelling checkout ${checkoutId} after a failed payment start failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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
    const { gatewayCode, credentials, gatewayAccountId } = await this.configService.getDecryptedCredentials(configId);
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
      bankAccountId: payout.bankAccountId,
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
      ...(request.urls.returnUrl ? { returnUrl: request.urls.returnUrl } : {}),
      ...(request.urls.checkoutUrl ? { checkoutUrl: request.urls.checkoutUrl } : {}),
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
    checkout: toCheckout(intent, orgId),
    failure:
      intent.failureCode || intent.failureMessage ? { code: intent.failureCode, message: intent.failureMessage } : null,
    paidAt: intent.succeededAt,
    expiresAt: intent.expiresAt,
    createdAt: intent.createdAt,
  };
}

function toCheckout(intent: PaymentIntentResponseDto, orgId: string): PaymentIntent['checkout'] {
  if (!intent.checkout) return null;
  const { gateway, ...launch } = intent.checkout;
  const gatewayCode = typeof gateway === 'string' ? gateway : intent.gatewayCode;
  // Only an intent the storefront gave somewhere to come back to is sent through core's hosted callback
  const hosted = (intent.returnUrl || intent.checkoutUrl) && HOSTED_CALLBACK_GATEWAYS.has(gatewayCode);
  const paths = hosted ? checkoutCallbackPaths(orgId, intent.id) : { callbackPath: null, cancelPath: null };
  return { gateway: gatewayCode, payload: JSON.stringify(launch), ...paths };
}

// Shapes a commerce checkout for the storefront, with the payment opened for it when there is one
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

function toCheckoutResult(
  checkout: Pick<CheckoutStartedResponseDto, 'checkoutId' | 'status' | 'currencyCode' | 'total' | 'sites'>,
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
    orders: orders.map((order) => ({ siteId: order.siteId, orderId: order.orderId, orderNumber: order.orderNumber })),
    paymentIntent,
  };
}

// The shopper's contact details as the payment intent takes them, so the gateway's page comes prefilled.

function checkoutCustomer(
  customer: CheckoutStartedResponseDto['customer'],
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

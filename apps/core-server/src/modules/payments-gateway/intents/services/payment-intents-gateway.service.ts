import { createHash } from 'node:crypto';
import { allowedOriginOf, effectiveOrigins, parseStorefrontUrl } from '@domain/app/allowed-origins';
import { AppDomainService } from '@domain/app/services/app.service';
import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { PayoutChannelDomainService } from '@domain/payout-channel/services/payout-channel.service';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { isEmail } from 'class-validator';
import type { PaymentChannelType, PayoutAccount } from '@/db/schema';
import { SiteContextResolverService } from '@/site-context/site-context-resolver.service';
import { isDefinitiveRejection } from '../../events/payment-rejection';
import { COMMERCE_ORDER_REFERENCE_TYPE } from '../../events/services/commerce-order-payment-handler.service';
import { PaymentEventDispatcherService } from '../../events/services/payment-event-dispatcher.service';
import type { CheckoutOrderResponseDto } from '../dto/response/checkout-order-response.dto';
import type { PaymentEventResponseDto } from '../dto/response/payment-event-response.dto';
import type { PaymentIntentResponseDto } from '../dto/response/payment-intent-response.dto';
import type {
  ConfirmPaymentInput,
  CreatePaymentIntentInput,
  KeyValueInput,
  PaymentCustomerInput,
  StartCheckoutInput,
} from '../graphql/payment-intent.input';
import { PaymentChannel } from '../graphql/payment-intent.input';
import type {
  CheckoutPaymentGateway,
  CheckoutSession,
  PaymentIntent,
  PaymentIntentStatus,
} from '../graphql/payment-intent.type';

export interface PaymentCallerContext {
  orgId: string;
  appId: string;
  partyId?: string;
  siteId?: string;
  legalEntityId?: string;
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
  paymentGatewayConfigId: string;
  urls: StorefrontUrls;
}

interface StorefrontUrls {
  returnUrl?: string;
  checkoutUrl?: string;
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
      paymentGatewayConfigId: input.paymentGatewayConfigId,
      urls,
    });
    return toPaymentIntent(intent, caller.orgId);
  }

  // Completes an intent from the gateway checkout's response, then settles whatever it paid for.
  async confirm(caller: PaymentCallerContext, input: ConfirmPaymentInput): Promise<PaymentIntent> {
    const existing = await this.findOwned(caller, input.paymentIntentId, false);
    const { credentials } = await this.configService.getDecryptedCredentials(caller.orgId, existing.configId);

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

  // Turns the party's cart into an order awaiting payment and opens the intent that pays for it.
  async startCheckoutFromCart(caller: PaymentCallerContext, input: StartCheckoutInput): Promise<CheckoutSession> {
    const partyId = caller.partyId;
    if (!partyId) {
      throw new BadRequestException({
        label: 'Sign In Required',
        detail: 'Checkout needs the signed-in party whose cart is being paid for.',
      });
    }
    const scope = await this.resolveScope(caller);
    if (!scope.siteId) {
      throw new BadRequestException({
        label: 'Site Required',
        detail: 'Checkout places an order at a site. Send the x-site-id header.',
        errors: [{ field: 'x-site-id', message: 'Required for checkout' }],
      });
    }
    const currencyCode = checkoutCurrency(scope, input.currencyCode);
    const urls = await this.requireAllowedUrls(caller, input);
    await this.requirePayoutAccount(caller, scope, PaymentChannel.APP, input.paymentGatewayConfigId);

    this.logger.log(`site.orders.createFromCart — party: ${partyId}, currency: ${currencyCode}`);
    const order = await this.nats.send<CheckoutOrderResponseDto>('commerce', 'site.orders.createFromCart', {
      appId: caller.appId,
      partyId,
      currencyCode,
      ...(input.addressId ? { addressId: input.addressId } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
      idempotencyKey: input.idempotencyKey,
    });

    const customer = checkoutCustomer(order.customer);
    let intent: PaymentIntentResponseDto;
    try {
      intent = await this.openIntent(caller, scope, {
        amountMinor: BigInt(order.totalMinor),
        currency: order.total.currency,
        reference: { type: COMMERCE_ORDER_REFERENCE_TYPE, id: order.orderId },
        description: `Order ${order.orderNumber}`,
        metadata: { orderNumber: order.orderNumber },
        // A retried checkout reuses the order this key already opened, so the payment below is the same payment
        idempotencyKey: input.idempotencyKey,
        channel: PaymentChannel.APP,
        paymentGatewayConfigId: input.paymentGatewayConfigId,
        urls,
        ...(customer && { customer }),
      });
    } catch (error: unknown) {
      if (!order.reused && isDefinitiveRejection(error)) await this.cancelOrderQuietly(order.orderId);
      throw error;
    }

    return {
      order: { id: order.orderId, orderNumber: order.orderNumber, total: order.total },
      paymentIntent: toPaymentIntent(intent, caller.orgId),
    };
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

    const payout = await this.requirePayoutAccount(caller, scope, request.channel, request.paymentGatewayConfigId);
    const configId = payout.paymentGatewayConfigId;
    const { gatewayCode, credentials } = await this.configService.getDecryptedCredentials(caller.orgId, configId);
    const transfers = await this.transfersFor(caller.orgId, payout, request.amountMinor);

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
      bankAccountId: payout.bankAccountId,
      ...(transfers.length > 0 && { transfers }),
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
    paymentGatewayConfigId: string,
  ): Promise<PayoutAccount> {
    const payout = await this.payoutChannelService.resolve(
      caller.orgId,
      { legalEntityId: scope.legalEntityId, siteId: scope.siteId, appId: caller.appId, channel },
      paymentGatewayConfigId,
    );
    if (!payout) {
      throw new BadRequestException({
        label: 'Payments Not Set Up',
        detail:
          'This payment gateway has no payout account for this store. Pick one of checkoutPaymentGateways, or add a payout account in Vritti Cloud.',
        errors: [{ field: 'paymentGatewayConfigId', message: 'Not available here' }],
      });
    }
    return payout;
  }

  // The split the gateway makes once the payment is captured. A payout account on the gateway's main account keeps
  // the whole payment there, so nothing is transferred; a linked account receives the payment less Vritti's fee
  // (platform gateways only — an organization's own gateway carries no fee), and the main account keeps the fee
  private async transfersFor(
    orgId: string,
    payout: PayoutAccount,
    amountMinor: bigint,
  ): Promise<{ linkedAccountId: string; providerAccountId: string; amount: string }[]> {
    if (payout.isMainAccount) return [];

    const config = await this.configService.findById(orgId, payout.paymentGatewayConfigId);
    const fee = (amountMinor * BigInt(config.platformFeeBps)) / BASIS_POINTS;
    const share = amountMinor - fee;
    if (share < MIN_TRANSFER_MINOR) {
      throw new BadRequestException({
        label: 'Amount Too Small To Split',
        detail:
          'After the platform fee this payment leaves less than ₹1 to pay out, the least a split transfer can carry.',
        errors: [{ field: 'amount.value', message: 'Too small to split' }],
      });
    }
    return [{ linkedAccountId: payout.id, providerAccountId: payout.gatewayAccountId, amount: share.toString() }];
  }

  // The gateways the shopper can pick from: those with a payout account that fits this store, app and channel
  async listCheckoutGateways(
    caller: PaymentCallerContext,
    channel: PaymentChannelType,
  ): Promise<CheckoutPaymentGateway[]> {
    const scope = await this.resolveScope(caller);
    const payable = new Set(
      await this.payoutChannelService.findPayableConfigIds(caller.orgId, {
        legalEntityId: scope.legalEntityId,
        siteId: scope.siteId,
        appId: caller.appId,
        channel,
      }),
    );
    if (payable.size === 0) return [];
    const configs = await this.configService.list(caller.orgId);
    return configs
      .filter((config) => payable.has(config.id))
      .map((config) => ({
        id: config.id,
        gatewayCode: config.gatewayCode,
        label: config.label,
        logoLightUrl: config.logoLightUrl,
        logoDarkUrl: config.logoDarkUrl,
      }));
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

  private async cancelOrderQuietly(orderId: string): Promise<void> {
    try {
      this.logger.log(`site.orders.cancelUnpaid — order: ${orderId} (payment could not be opened)`);
      await this.nats.send('commerce', 'site.orders.cancelUnpaid', {
        orderId,
        reason: 'Payment could not be started.',
      });
    } catch (error: unknown) {
      this.logger.error(
        `Cancelling order ${orderId} after a failed payment start failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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

// Converts a major-unit amount to minor units, naming the GraphQL field on failure The currency a site's checkout
// prices in: its legal entity's, never the storefront's choice.
function checkoutCurrency(scope: ResolvedScope, requested?: string): string {
  if (!scope.currencyCode) {
    throw new BadRequestException({
      label: 'Currency Not Set',
      detail: "This site's legal entity has no currency, so its basket cannot be priced.",
    });
  }
  if (requested && requested !== scope.currencyCode) {
    throw new BadRequestException({
      label: 'Currency Mismatch',
      detail: `This site sells in ${scope.currencyCode}, not ${requested}.`,
      errors: [{ field: 'currencyCode', message: `Must be ${scope.currencyCode} or left out` }],
    });
  }
  return scope.currencyCode;
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

// The shopper's contact details as the payment intent takes them, so the gateway's page comes prefilled.

function checkoutCustomer(
  customer: CheckoutOrderResponseDto['customer'],
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

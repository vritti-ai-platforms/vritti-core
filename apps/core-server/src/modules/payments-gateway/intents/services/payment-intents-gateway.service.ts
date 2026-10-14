import { createHash } from 'node:crypto';
import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { isEmail } from 'class-validator';
import type { PaymentGatewayConfigType } from '@/db/schema';
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
import type { CheckoutSession, PaymentIntent, PaymentIntentStatus } from '../graphql/payment-intent.type';

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
  channel: PaymentGatewayConfigType;
}

interface ResolvedScope {
  legalEntityId: string;
  siteId?: string;
}

// The storefront's payment surface. Every intent an app touches is checked to be that app's own — an intent of
// another app in the same organization is a 404, never a read — and the gateway credentials are decrypted here for
// the one NATS call that needs them, never returned
@Injectable()
export class PaymentIntentsGatewayService {
  private readonly logger = new Logger(PaymentIntentsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly configService: PaymentGatewayConfigDomainService,
    private readonly siteContextResolver: SiteContextResolverService,
    private readonly dispatcher: PaymentEventDispatcherService,
  ) {}

  // Opens an intent against the gateway config resolved for the caller's legal entity, site, app and channel
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
    const intent = await this.openIntent(caller, await this.resolveScope(caller), {
      amountMinor,
      currency: input.amount.currency,
      reference: input.reference,
      description: input.description,
      customer: input.customer,
      metadata: toMetadata(input.metadata),
      idempotencyKey: input.idempotencyKey,
      channel: input.channel ?? PaymentChannel.APP,
    });
    return toPaymentIntent(intent);
  }

  // Completes an intent from the gateway checkout's response, then settles whatever it paid for. A gateway callback
  // may arrive without a signed-in party, so only a party that is present has to match
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
    return toPaymentIntent(intent);
  }

  // Reads one of the app's intents
  async findById(caller: PaymentCallerContext, paymentIntentId: string): Promise<PaymentIntent> {
    return toPaymentIntent(await this.findOwned(caller, paymentIntentId, true));
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
    return toPaymentIntent(intent);
  }

  // Turns the party's cart into an order awaiting payment and opens the intent that pays for it. The gateway is
  // resolved first so a site with no gateway never leaves an order behind; if the intent still cannot be opened
  // the order is cancelled before the error surfaces — but only an order this call opened, and only when payments
  // refused for good. A timeout or 5xx may still have created the intent, which the expiry sweep settles
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
    await this.requireConfig(caller, scope, PaymentChannel.APP);

    this.logger.log(`site.orders.createFromCart — party: ${partyId}`);
    const order = await this.nats.send<CheckoutOrderResponseDto>('commerce', 'site.orders.createFromCart', {
      appId: caller.appId,
      partyId,
      currencyCode: input.currencyCode,
      ...(input.addressId ? { addressId: input.addressId } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
      // A retried checkout reuses the order this key already opened, so the payment below is the same payment
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
        idempotencyKey: input.idempotencyKey,
        channel: PaymentChannel.APP,
        ...(customer && { customer }),
      });
    } catch (error: unknown) {
      if (!order.reused && isDefinitiveRejection(error)) await this.cancelOrderQuietly(order.orderId);
      throw error;
    }

    return {
      order: { id: order.orderId, orderNumber: order.orderNumber, total: order.total },
      paymentIntent: toPaymentIntent(intent),
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

    const config = await this.requireConfig(caller, scope, request.channel);
    const { credentials } = await this.configService.getDecryptedCredentials(caller.orgId, config.id);

    this.logger.log(
      `payments.intents.create — ${request.reference.type}:${request.reference.id} app: ${caller.appId} config: ${config.id}`,
    );
    return this.nats.send<PaymentIntentResponseDto>('payments', 'payments.intents.create', {
      legalEntityId: scope.legalEntityId,
      ...(scope.siteId ? { siteId: scope.siteId } : {}),
      appId: caller.appId,
      ...(caller.partyId ? { partyId: caller.partyId } : {}),
      configId: config.id,
      gatewayCode: config.gatewayCode,
      bankAccountId: config.bankAccountId,
      type: request.channel,
      credentials,
      amount: request.amountMinor.toString(),
      currency: request.currency,
      referenceType: request.reference.type,
      referenceId: request.reference.id,
      ...(request.description ? { description: request.description } : {}),
      ...(request.customer ? { customer: request.customer } : {}),
      ...(request.metadata ? { metadata: request.metadata } : {}),
      idempotencyKey: namespacedIdempotencyKey(caller, request.idempotencyKey),
    });
  }

  // The gateway config a payment in this scope routes through, or a 400 naming what is missing
  private async requireConfig(caller: PaymentCallerContext, scope: ResolvedScope, channel: PaymentGatewayConfigType) {
    const config = await this.configService.resolveForContext(caller.orgId, {
      legalEntityId: scope.legalEntityId,
      type: channel,
      siteId: scope.siteId ?? null,
      appId: caller.appId,
    });
    if (!config) {
      throw new BadRequestException({
        label: 'No Payment Gateway',
        detail: `No ${channel} payment gateway is configured for this legal entity. Ask an administrator to connect one.`,
        errors: [{ field: 'channel', message: 'No gateway configured' }],
      });
    }
    return config;
  }

  // The site's legal entity when a site is in context, otherwise the legal entity header on its own
  private async resolveScope(caller: PaymentCallerContext): Promise<ResolvedScope> {
    if (caller.siteId) {
      const site = await this.siteContextResolver.resolve(caller.siteId);
      return { legalEntityId: site.legalEntityId, siteId: caller.siteId };
    }
    if (caller.legalEntityId) return { legalEntityId: caller.legalEntityId };
    throw new BadRequestException({
      label: 'Workspace Required',
      detail: 'Payments are taken for a site or a legal entity. Send the x-site-id or x-le-id header.',
      errors: [{ field: 'x-site-id', message: 'Required when x-le-id is absent' }],
    });
  }

  // Loads an intent and hides it unless the calling app opened it. A shopper's intent is hidden from every other
  // party; with requireParty it is hidden from a caller with no party too, so one shopper cannot read or cancel
  // another's payment through the same storefront
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

// Converts a major-unit amount to minor units, naming the GraphQL field on failure
function toMinor(value: string, currency: string): bigint {
  return majorToMinor(value, currency as CurrencyCode, 'amount.value');
}

// Folds the key/value list into the record payments-service stores; a repeated key keeps its last value
function toMetadata(entries: KeyValueInput[] | undefined): Record<string, string> | undefined {
  if (!entries || entries.length === 0) return undefined;
  return Object.fromEntries(entries.map((entry) => [entry.key, entry.value]));
}

// Shapes a payments-service intent for the storefront: launch data as a JSON string, failure folded into one object
export function toPaymentIntent(intent: PaymentIntentResponseDto): PaymentIntent {
  return {
    id: intent.id,
    status: intent.status as PaymentIntentStatus,
    amount: intent.amount,
    reference: intent.reference,
    description: intent.description,
    checkout: toCheckout(intent),
    failure:
      intent.failureCode || intent.failureMessage ? { code: intent.failureCode, message: intent.failureMessage } : null,
    paidAt: intent.succeededAt,
    expiresAt: intent.expiresAt,
    createdAt: intent.createdAt,
  };
}

function toCheckout(intent: PaymentIntentResponseDto): PaymentIntent['checkout'] {
  if (!intent.checkout) return null;
  const { gateway, ...launch } = intent.checkout;
  return {
    gateway: typeof gateway === 'string' ? gateway : intent.gatewayCode,
    payload: JSON.stringify(launch),
  };
}

// The shopper's contact details as the payment intent takes them, so the gateway's page comes prefilled. Each value
// is bounded the way payments-service validates it, and an email that does not look like one is left out rather
// than failing the whole checkout over a bad contact row. isEmail is the same check payments-service validates with

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

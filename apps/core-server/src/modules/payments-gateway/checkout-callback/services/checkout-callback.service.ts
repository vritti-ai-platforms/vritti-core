import { allowedOriginOf } from '@domain/app/allowed-origins';
import { AppDomainService } from '@domain/app/services/app.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { FastifyRequest } from 'fastify';
import type { App } from '@/db/schema';
import type { PaymentIntentResponseDto } from '../../intents/dto/response/payment-intent-response.dto';
import { PaymentIntentsGatewayService } from '../../intents/services/payment-intents-gateway.service';

export type CheckoutCallbackOutcome = { kind: 'redirect'; location: string } | { kind: 'page'; html: string };

interface CheckoutContext {
  intent: PaymentIntentResponseDto;
  app: App | undefined;
}

interface GatewaySuccess {
  orderId: string;
  paymentId: string;
  signature: string;
}

interface GatewayFailure {
  code?: string;
  description?: string;
  reason?: string;
  source?: string;
  step?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
}

const MESSAGE_MAX_LENGTH = 200;

const SUCCESS_PAGE = page('Payment received', 'Your payment was received. You can close this window.');
const FAILURE_PAGE = page(
  'Payment not completed',
  'The payment did not go through. Return to the store and try again.',
);

@Injectable()
export class CheckoutCallbackService {
  private readonly logger = new Logger(CheckoutCallbackService.name);

  constructor(
    private readonly db: PrimaryDatabaseService,
    private readonly nats: NatsClientService,
    private readonly appService: AppDomainService,
    private readonly intents: PaymentIntentsGatewayService,
  ) {}

  // Handles the gateway's form post: confirms a success and returns the shopper to the store, or back to checkout
  async handleCallback(
    request: FastifyRequest,
    orgId: string,
    paymentIntentId: string,
    body: unknown,
  ): Promise<CheckoutCallbackOutcome> {
    const fields = formFields(body);
    const success = parseSuccess(fields);
    this.logger.log(
      `[checkout-callback] POST ${success ? 'success' : 'failure'} — org=${orgId} intent=${paymentIntentId}` +
        (success ? ` order=${success.orderId} payment=${success.paymentId}` : ''),
    );

    try {
      const context = await this.loadContext(request, orgId, paymentIntentId);
      if (success) {
        if (context) await this.confirmQuietly(orgId, context.intent, success);
        return this.redirectOr(SUCCESS_PAGE, orgId, context, context?.intent.returnUrl, {
          intent: paymentIntentId,
          order: context?.intent.metadata?.orderNumber,
        });
      }

      const failure = parseFailure(fields);
      this.logger.log(
        `[checkout-callback] declined — intent=${paymentIntentId} code=${failure.code ?? '-'} reason=${failure.reason ?? '-'} ` +
          `source=${failure.source ?? '-'} step=${failure.step ?? '-'} gatewayOrder=${failure.providerOrderId ?? '-'} gatewayPayment=${failure.providerPaymentId ?? '-'}`,
      );
      return this.redirectOr(FAILURE_PAGE, orgId, context, context?.intent.checkoutUrl, {
        payment: 'failed',
        message: failure.description?.slice(0, MESSAGE_MAX_LENGTH),
      });
    } catch (error: unknown) {
      // The browser is mid-checkout: whatever broke here, it gets a page rather than a 500
      this.logger.error(`[checkout-callback] intent=${paymentIntentId} failed: ${errorMessage(error)}`);
      return { kind: 'page', html: success ? SUCCESS_PAGE : FAILURE_PAGE };
    }
  }

  // The shopper abandoned the gateway's checkout: back to the store's checkout page
  async handleCancel(
    request: FastifyRequest,
    orgId: string,
    paymentIntentId: string,
  ): Promise<CheckoutCallbackOutcome> {
    this.logger.log(`[checkout-callback] GET cancel — org=${orgId} intent=${paymentIntentId}`);
    try {
      const context = await this.loadContext(request, orgId, paymentIntentId);
      return this.redirectOr(FAILURE_PAGE, orgId, context, context?.intent.checkoutUrl, { payment: 'cancelled' });
    } catch (error: unknown) {
      this.logger.error(`[checkout-callback] cancel intent=${paymentIntentId} failed: ${errorMessage(error)}`);
      return { kind: 'page', html: FAILURE_PAGE };
    }
  }

  // A browser landing on the callback by GET (a refresh, a back button): back to checkout, or the return page
  async handleRevisit(
    request: FastifyRequest,
    orgId: string,
    paymentIntentId: string,
  ): Promise<CheckoutCallbackOutcome> {
    this.logger.log(`[checkout-callback] GET callback — org=${orgId} intent=${paymentIntentId}`);
    try {
      const context = await this.loadContext(request, orgId, paymentIntentId);
      const fallback = context?.intent.status === 'SUCCEEDED' ? SUCCESS_PAGE : FAILURE_PAGE;
      const target = context?.intent.checkoutUrl ?? context?.intent.returnUrl;
      return this.redirectOr(fallback, orgId, context, target, {});
    } catch (error: unknown) {
      this.logger.error(`[checkout-callback] revisit intent=${paymentIntentId} failed: ${errorMessage(error)}`);
      return { kind: 'page', html: FAILURE_PAGE };
    }
  }

  // Reads the intent and its app under the URL's organization; null when either cannot be found
  private async loadContext(
    request: FastifyRequest,
    orgId: string,
    paymentIntentId: string,
  ): Promise<CheckoutContext | null> {
    // A public route carries no auth, so neither RLS nor the NATS context has an organization.
    request.auth = { kind: 'cloud', organizationId: orgId };
    try {
      return await this.db.runWithRlsContext({ orgId }, async () => {
        const intent = await this.nats.send<PaymentIntentResponseDto>('payments', 'payments.intents.get', {
          paymentIntentId,
        });
        const app = intent.appId ? await this.appService.findInOrg(intent.appId, orgId) : undefined;
        this.logger.log(
          `[checkout-callback] loaded intent=${intent.id} status=${intent.status} app=${intent.appId ?? '-'}${app ? '' : ' (app not found)'}`,
        );
        return { intent, app };
      });
    } catch (error: unknown) {
      this.logger.warn(
        `[checkout-callback] intent=${paymentIntentId} in org ${orgId} not loaded: ${errorMessage(error)}`,
      );
      return null;
    }
  }

  // Confirms a success the way the storefront's own confirm would.
  private async confirmQuietly(
    orgId: string,
    intent: PaymentIntentResponseDto,
    success: GatewaySuccess,
  ): Promise<void> {
    if (!intent.appId) {
      this.logger.warn(`[checkout-callback] intent=${intent.id} has no app — not confirming`);
      return;
    }
    try {
      const confirmed = await this.db.runWithRlsContext({ orgId }, () =>
        this.intents.confirm(
          { orgId, appId: intent.appId as string },
          { paymentIntentId: intent.id, gatewayResponse: success },
        ),
      );
      this.logger.log(`[checkout-callback] confirmed intent=${intent.id} status=${confirmed.status}`);
    } catch (error: unknown) {
      this.logger.warn(`[checkout-callback] confirm of intent=${intent.id} failed: ${errorMessage(error)}`);
    }
  }

  // A 303 to the target with the params appended, but only when the app is still active and still allows the target's
  // origin; otherwise the static page
  private redirectOr(
    fallback: string,
    orgId: string,
    context: CheckoutContext | null,
    target: string | null | undefined,
    params: Record<string, string | undefined>,
  ): CheckoutCallbackOutcome {
    const intentId = context?.intent.id ?? '-';
    if (!context || !target) {
      this.logger.warn(`[checkout-callback] intent=${intentId} has no page to return to — showing a static page`);
      return { kind: 'page', html: fallback };
    }
    const { app } = context;
    if (!app || !app.isActive || app.revokedAt) {
      this.logger.warn(
        `[checkout-callback] intent=${intentId} app is missing or inactive in org ${orgId} — no redirect`,
      );
      return { kind: 'page', html: fallback };
    }
    if (!allowedOriginOf(target, app.allowedOrigins ?? [])) {
      this.logger.warn(`[checkout-callback] intent=${intentId} target origin no longer allowed for app ${app.id}`);
      return { kind: 'page', html: fallback };
    }

    const url = new URL(target);
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
    this.logger.log(`[checkout-callback] intent=${intentId} → 303 ${url.origin}${url.pathname}`);
    return { kind: 'redirect', location: url.toString() };
  }
}

// The posted form as plain strings; a repeated field keeps its first value
function formFields(body: unknown): Record<string, string> {
  if (!body || typeof body !== 'object') return {};
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === 'string') fields[key] = first;
  }
  return fields;
}

// A gateway success carries all three of payment id, order id and signature
function parseSuccess(fields: Record<string, string>): GatewaySuccess | null {
  const paymentId = fields.razorpay_payment_id?.trim();
  const orderId = fields.razorpay_order_id?.trim();
  const signature = fields.razorpay_signature?.trim();
  if (!paymentId || !orderId || !signature) return null;
  return { orderId, paymentId, signature };
}

// The gateway's failure fields; metadata is a JSON string naming the gateway's order and payment
function parseFailure(fields: Record<string, string>): GatewayFailure {
  const failure: GatewayFailure = {
    code: fields['error[code]'],
    description: fields['error[description]'],
    reason: fields['error[reason]'],
    source: fields['error[source]'],
    step: fields['error[step]'],
  };
  const metadata = fields['error[metadata]'];
  if (metadata) {
    try {
      const parsed: unknown = JSON.parse(metadata);
      if (parsed && typeof parsed === 'object') {
        const orderId = Reflect.get(parsed, 'order_id');
        const paymentId = Reflect.get(parsed, 'payment_id');
        if (typeof orderId === 'string') failure.providerOrderId = orderId;
        if (typeof paymentId === 'string') failure.providerPaymentId = paymentId;
      }
    } catch {
      // Malformed metadata only loses the ids in the log line
    }
  }
  return failure;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const detail = Reflect.get(error, 'detail') ?? Reflect.get(error, 'message');
    if (typeof detail === 'string') return detail;
  }
  return String(error);
}

// A static page — fixed text only, nothing from the request is echoed into it
function page(title: string, message: string): string {
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<title>${title}</title></head>` +
    '<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;text-align:center">' +
    `<p>${message}</p></body></html>`
  );
}

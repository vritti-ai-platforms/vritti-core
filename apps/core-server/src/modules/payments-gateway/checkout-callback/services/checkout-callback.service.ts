import { allowedOriginOf, effectiveOrigins } from '@domain/app/allowed-origins';
import { AppDomainService } from '@domain/app/services/app.service';
import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { FastifyRequest } from 'fastify';
import type { App } from '@/db/schema';
import { GATEWAY_WEBHOOK_CHECK_REFERENCE_TYPE } from '../../events/services/webhook-check-payment-handler.service';
import { PaymentGatewaysGatewayService } from '../../gateways/services/payment-gateways-gateway.service';
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
// The tab a verification payment ran in; the dialog in Vritti Cloud follows the outcome on its own
const WEBHOOK_CHECK_PAID_PAGE = page(
  'Payment received',
  'The verification payment went through and is being refunded. Go back to Vritti Cloud — the dialog there shows when the webhook is verified. You can close this tab.',
);
const WEBHOOK_CHECK_FAILED_PAGE = page(
  'Payment not completed',
  'The verification payment did not go through. Go back to Vritti Cloud to try again. You can close this tab.',
);
const WEBHOOK_CHECK_CANCELLED_PAGE = page(
  'Payment cancelled',
  'The verification payment was cancelled and nothing was charged. Go back to Vritti Cloud to try again. You can close this tab.',
);
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
    private readonly gateways: PaymentGatewaysGatewayService,
    private readonly configService: PaymentGatewayConfigDomainService,
  ) {}

  // Handles the gateway's form post: confirms a success and returns the shopper to the store, or back to checkout. A
  // gateway that posts its result whatever it is (Easebuzz) is confirmed either way: the payment is read back from the
  // gateway, and what it says decides where the browser goes
  async handleCallback(
    request: FastifyRequest,
    orgId: string,
    paymentIntentId: string,
    body: unknown,
  ): Promise<CheckoutCallbackOutcome> {
    const fields = formFields(body);
    const readBack = parseReadBack(fields);
    const success = parseSuccess(fields) ?? readBack;
    this.logger.log(
      `[checkout-callback] POST ${readBack ? `read-back status=${fields.status ?? '-'}` : success ? 'success' : 'failure'} — org=${orgId} intent=${paymentIntentId}` +
        (success ? ` order=${success.orderId} payment=${success.paymentId}` : ''),
    );

    try {
      const context = await this.loadContext(request, orgId, paymentIntentId);
      if (context && isWebhookCheck(context.intent)) {
        const status = success ? await this.confirmWebhookCheckQuietly(orgId, context.intent, success) : null;
        const paid = readBack ? status === 'SUCCEEDED' : Boolean(success);
        return { kind: 'page', html: paid ? WEBHOOK_CHECK_PAID_PAGE : WEBHOOK_CHECK_FAILED_PAGE };
      }
      if (success) {
        const status = context ? await this.confirmQuietly(orgId, context.intent, success) : null;
        if (!readBack || status === 'SUCCEEDED') {
          return this.redirectOr(SUCCESS_PAGE, orgId, context, context?.intent.returnUrl, {
            intent: paymentIntentId,
            order: context?.intent.metadata?.orderNumber,
          });
        }
      }

      const failure = readBack ? readBackFailure(fields) : parseFailure(fields);
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
      return { kind: 'page', html: success && !readBack ? SUCCESS_PAGE : FAILURE_PAGE };
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
      if (context && isWebhookCheck(context.intent)) {
        await this.cancelWebhookCheckQuietly(context.intent);
        return { kind: 'page', html: WEBHOOK_CHECK_CANCELLED_PAGE };
      }
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
      if (context && isWebhookCheck(context.intent)) {
        return {
          kind: 'page',
          html: context.intent.status === 'SUCCEEDED' ? WEBHOOK_CHECK_PAID_PAGE : WEBHOOK_CHECK_FAILED_PAGE,
        };
      }
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
  ): Promise<string | null> {
    if (!intent.appId) {
      this.logger.warn(`[checkout-callback] intent=${intent.id} has no app — not confirming`);
      return null;
    }
    try {
      const confirmed = await this.db.runWithRlsContext({ orgId }, () =>
        this.intents.confirm(
          { orgId, appId: intent.appId as string },
          { paymentIntentId: intent.id, gatewayResponse: success },
        ),
      );
      this.logger.log(`[checkout-callback] confirmed intent=${intent.id} status=${confirmed.status}`);
      return confirmed.status;
    } catch (error: unknown) {
      this.logger.warn(`[checkout-callback] confirm of intent=${intent.id} failed: ${errorMessage(error)}`);
      return null;
    }
  }

  // Settles a verification payment through its gateway config, which refunds it; the webhook it triggered is what
  // verifies the config. Never fails the redirect
  private async confirmWebhookCheckQuietly(
    orgId: string,
    intent: PaymentIntentResponseDto,
    success: GatewaySuccess,
  ): Promise<string | null> {
    try {
      const status = await this.db.runWithRlsContext({ orgId }, async () => {
        const config = await this.configService.requireWritable('organization', intent.reference.id);
        return this.gateways.confirmWebhookCheck(orgId, config, { paymentIntentId: intent.id, ...success });
      });
      this.logger.log(`[checkout-callback] webhook check intent=${intent.id} confirmed status=${status.status}`);
      return status.status;
    } catch (error: unknown) {
      this.logger.warn(`[checkout-callback] webhook check intent=${intent.id} not confirmed: ${errorMessage(error)}`);
      return null;
    }
  }

  // Marks a verification payment the admin abandoned on the gateway's page as cancelled, so the waiting dialog in
  // Vritti Cloud can say so. Never fails the page
  private async cancelWebhookCheckQuietly(intent: PaymentIntentResponseDto): Promise<void> {
    try {
      await this.nats.send('payments', 'payments.intents.cancel', { paymentIntentId: intent.id });
      this.logger.log(`[checkout-callback] webhook check intent=${intent.id} cancelled`);
    } catch (error: unknown) {
      this.logger.warn(`[checkout-callback] webhook check intent=${intent.id} not cancelled: ${errorMessage(error)}`);
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
    if (!allowedOriginOf(target, effectiveOrigins(app))) {
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

// A gateway that posts its result to the order's return URL whatever it is (Easebuzz: txnid and easepayid, with the
// status and a hash). Nothing in it is trusted: it only names the payment to read back from the gateway
function parseReadBack(fields: Record<string, string>): GatewaySuccess | null {
  const orderId = fields.txnid?.trim();
  const paymentId = fields.easepayid?.trim();
  if (!orderId || !paymentId) return null;
  return { orderId, paymentId, signature: fields.hash?.trim() || 'read-back' };
}

// Why a read-back gateway's payment did not go through, as it posted it
function readBackFailure(fields: Record<string, string>): GatewayFailure {
  const message = fields.error_Message?.trim() || fields.error?.trim();
  return {
    code: fields.status,
    description: message && message !== 'NA' ? message : undefined,
    providerOrderId: fields.txnid,
    providerPaymentId: fields.easepayid,
  };
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

// A verification payment — the ₹10 that proves a gateway config's webhook — rather than a storefront's
function isWebhookCheck(intent: PaymentIntentResponseDto): boolean {
  return intent.reference.type === GATEWAY_WEBHOOK_CHECK_REFERENCE_TYPE;
}

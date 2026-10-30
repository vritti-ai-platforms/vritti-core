import { randomUUID } from 'node:crypto';
import type { PaymentGatewayConfigVerificationResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-config-verification-response.dto';
import type { PaymentGatewayConfigDetail } from '@domain/payment-gateway-config/repositories/payment-gateway-config.repository';
import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { PaymentEventDispatcherService } from '../../events/services/payment-event-dispatcher.service';
import { GATEWAY_WEBHOOK_CHECK_REFERENCE_TYPE } from '../../events/services/webhook-check-payment-handler.service';
import type { PaymentEventResponseDto } from '../../intents/dto/response/payment-event-response.dto';
import type { PaymentIntentResponseDto } from '../../intents/dto/response/payment-intent-response.dto';
import { checkoutCallbackBaseFor, checkoutCallbackPaths } from '../../intents/services/payment-intents-gateway.service';
import type { PaymentGatewayOptionDto } from '../dto/response/payment-gateway-option.dto';

// The verification payment: ₹10, the least Razorpay reliably accepts, refunded as soon as it succeeds
const WEBHOOK_CHECK_AMOUNT_MINOR = '1000';
const WEBHOOK_CHECK_CURRENCY = 'INR';
// What cloud adds to a verification payment: core's public origin and the admin who pays it
export interface VerificationPaymentOptions {
  callbackOrigin?: string;
  payer?: { name?: string; email?: string; phone?: string };
}

// What the browser opens a verification payment with: Razorpay's embedded checkout takes the key id and order id,
// a gateway with a hosted page of its own (Easebuzz) gives the page's url
export interface VerificationCheckout {
  gateway: string;
  keyId: string | null;
  orderId: string | null;
  url: string | null;
  amount: number;
  currency: string;
}

export interface WebhookCheckStarted {
  paymentIntentId: string;
  checkout: VerificationCheckout;
  // Core's hosted callback the gateway's embedded checkout posts to, and its cancel path — paths only, as core does not
  // know its own public origin; cloud prefixes them
  callbackPath: string;
  cancelPath: string;
}

export interface WebhookCheckGatewayResponse {
  paymentIntentId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}

interface VerifyCredentialsResult {
  ok: true;
}

export interface LinkedAccountLookup {
  status: 'PENDING' | 'IN_REVIEW' | 'ACTION_REQUIRED' | 'ACTIVE' | 'SUSPENDED';
}

@Injectable()
export class PaymentGatewaysGatewayService {
  private readonly logger = new Logger(PaymentGatewaysGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly configService: PaymentGatewayConfigDomainService,
    private readonly dispatcher: PaymentEventDispatcherService,
  ) {}

  // Reports whether a gateway can split a payment across linked accounts, as payments-service says
  async supportsSplit(gatewayCode: string): Promise<boolean> {
    const gateways = await this.listGateways();
    return gateways.some((gateway) => gateway.code === gatewayCode && gateway.supportsSplit);
  }

  // Lists the gateways payments-service can charge through, with the credential fields each one takes
  async listGateways(): Promise<PaymentGatewayOptionDto[]> {
    this.logger.log('payments.gateways.list');
    const { gateways } = await this.nats.send<{ gateways: PaymentGatewayOptionDto[] }>(
      'payments',
      'payments.gateways.list',
      {},
    );
    return gateways;
  }

  // Looks a linked account up at the config's gateway under its keys; null when the gateway has none
  async lookupLinkedAccount(configId: string, providerAccountId: string): Promise<LinkedAccountLookup | null> {
    const { gatewayCode, credentials } = await this.configService.getDecryptedCredentials(configId);

    this.logger.log(`payments.linkedAccounts.lookup — config: ${configId} gateway: ${gatewayCode}`);
    const { account } = await this.nats.send<{ account: LinkedAccountLookup | null }>(
      'payments',
      'payments.linkedAccounts.lookup',
      { gatewayCode, credentials, providerAccountId },
    );
    return account;
  }

  // Has the provider check a guarded config's stored credentials, then records the pass on it
  // Has the gateway check a credential set before it is saved; a rejection surfaces as the gateway's own 400 on the
  // credential fields, and nothing is written. Answers when the check passed
  async verifyCredentials(gatewayCode: string, credentials: Record<string, string>): Promise<Date> {
    this.logger.log(`payments.gateways.verifyCredentials — new credentials for gateway: ${gatewayCode}`);
    await this.nats.send<VerifyCredentialsResult>('payments', 'payments.gateways.verifyCredentials', {
      gatewayCode,
      credentials,
    });
    return new Date();
  }

  async verifyConfig(config: PaymentGatewayConfigDetail): Promise<PaymentGatewayConfigVerificationResponseDto> {
    const configId = config.id;
    const { gatewayCode, credentials } = this.configService.decryptCredentials(config);

    this.logger.log(`payments.gateways.verifyCredentials — config: ${configId} gateway: ${gatewayCode}`);
    await this.nats.send<VerifyCredentialsResult>('payments', 'payments.gateways.verifyCredentials', {
      gatewayCode,
      credentials,
    });

    return this.configService.markVerified(config);
  }

  // Opens the verification payment on a config: a small real payment whose signed webhook proves the URL and secret
  // registered in the gateway's dashboard. A gateway whose split must cover the whole payment (Easebuzz) sends all of it
  // to the main split label, so the same payment proves that label too. Answers what the browser needs to open it
  async startWebhookCheck(
    orgId: string,
    config: PaymentGatewayConfigDetail,
    options: VerificationPaymentOptions = {},
  ): Promise<WebhookCheckStarted> {
    const { gatewayCode, credentials } = this.configService.decryptCredentials(config);
    this.logger.log(`payments.intents.create — webhook check for config ${config.id} (${gatewayCode})`);
    const intent = await this.nats.send<PaymentIntentResponseDto>('payments', 'payments.intents.create', {
      configId: config.id,
      gatewayCode,
      type: 'APP',
      credentials,
      amount: WEBHOOK_CHECK_AMOUNT_MINOR,
      currency: WEBHOOK_CHECK_CURRENCY,
      referenceType: GATEWAY_WEBHOOK_CHECK_REFERENCE_TYPE,
      referenceId: config.id,
      description: 'Webhook check — refunded automatically',
      mainAccountId: config.gatewayAccountId,
      ...checkoutCallbackBaseFor(options.callbackOrigin, orgId),
      ...payerOf(options),
      // Every press is its own payment: a closed checkout must not hand back the same, possibly expired, order
      idempotencyKey: `webhook-check:${config.id}:${randomUUID()}`,
    });

    return {
      paymentIntentId: intent.id,
      ...checkoutCallbackPaths(orgId, intent.id),
      checkout: verificationCheckout(intent, gatewayCode),
    };
  }

  // Where one of this config's verification payments stands — for the dialog waiting on it
  async findWebhookCheck(
    config: PaymentGatewayConfigDetail,
    paymentIntentId: string,
  ): Promise<{ status: string; failureMessage: string | null }> {
    const intent = await this.nats.send<PaymentIntentResponseDto>('payments', 'payments.intents.get', {
      paymentIntentId,
    });
    if (intent.reference.type !== GATEWAY_WEBHOOK_CHECK_REFERENCE_TYPE || intent.reference.id !== config.id) {
      throw new BadRequestException({
        label: 'Not A Verification Payment',
        detail: 'That payment is not this gateway’s verification payment.',
        errors: [{ field: 'paymentIntentId', message: 'Not a verification payment' }],
      });
    }
    return { status: intent.status, failureMessage: intent.failureMessage };
  }

  // Hands the checkout's signed result to payments-service. A success is dispatched like any payment's, which refunds
  // it; the webhook that marks the config verified still has to arrive on its own
  async confirmWebhookCheck(
    orgId: string,
    config: PaymentGatewayConfigDetail,
    response: WebhookCheckGatewayResponse,
  ): Promise<{ status: string }> {
    return this.confirmVerificationPayment(orgId, config, response, {
      type: GATEWAY_WEBHOOK_CHECK_REFERENCE_TYPE,
      id: config.id,
    });
  }

  // Confirms one verification payment of the expected reference — checked before anything is settled — and dispatches
  // what it produced
  private async confirmVerificationPayment(
    orgId: string,
    config: PaymentGatewayConfigDetail,
    response: WebhookCheckGatewayResponse,
    reference: { type: string; id: string },
  ): Promise<{ status: string }> {
    const found = await this.nats.send<PaymentIntentResponseDto>('payments', 'payments.intents.get', {
      paymentIntentId: response.paymentIntentId,
    });
    if (
      found.reference.type !== reference.type ||
      found.reference.id !== reference.id ||
      found.configId !== config.id
    ) {
      throw new BadRequestException({
        label: 'Not A Verification Payment',
        detail: 'That payment is not this gateway’s verification payment.',
        errors: [{ field: 'paymentIntentId', message: 'Not a verification payment' }],
      });
    }

    const { credentials } = this.configService.decryptCredentials(config);
    const { intent, events } = await this.nats.send<{
      intent: PaymentIntentResponseDto;
      events: PaymentEventResponseDto[];
    }>('payments', 'payments.intents.confirm', {
      paymentIntentId: response.paymentIntentId,
      credentials,
      gatewayResponse: { orderId: response.orderId, paymentId: response.paymentId, signature: response.signature },
    });
    await this.dispatcher.dispatch(orgId, events);
    return { status: intent.status };
  }
}

// The admin's contact details as the intent's customer, for a gateway that needs them on every payment
function payerOf(options: VerificationPaymentOptions): {
  customer?: { name?: string; email?: string; phone?: string };
} {
  const payer = options.payer;
  if (!payer) return {};
  const customer = {
    ...(payer.name?.trim() ? { name: payer.name.trim().slice(0, 200) } : {}),
    ...(payer.email?.trim() ? { email: payer.email.trim() } : {}),
    ...(payer.phone?.trim() ? { phone: payer.phone.trim().slice(0, 20) } : {}),
  };
  return Object.keys(customer).length > 0 ? { customer } : {};
}

// What the browser opens a verification payment with, refused when the gateway gave neither form of it
function verificationCheckout(intent: PaymentIntentResponseDto, gatewayCode: string): VerificationCheckout {
  const checkout = intent.checkout ?? {};
  const keyId = typeof checkout.key_id === 'string' ? checkout.key_id : null;
  const orderId = typeof checkout.order_id === 'string' ? checkout.order_id : intent.providerOrderId;
  const url = typeof checkout.url === 'string' ? checkout.url : null;
  if (!url && (!keyId || !orderId)) {
    throw new BadRequestException({
      label: 'Checkout Not Available',
      detail: 'The gateway opened the verification payment without a checkout. Try again.',
    });
  }
  return {
    gateway: gatewayCode,
    keyId,
    orderId,
    url,
    amount: Number(WEBHOOK_CHECK_AMOUNT_MINOR),
    currency: WEBHOOK_CHECK_CURRENCY,
  };
}

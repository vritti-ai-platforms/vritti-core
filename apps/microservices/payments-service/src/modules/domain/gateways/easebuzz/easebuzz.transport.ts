import { createHash, randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { type EasebuzzEnvironment, EasebuzzHttpService } from '@/gateways/easebuzz/services/easebuzz-http.service';
import {
  type CreateOrderInput,
  type CreateOrderResult,
  GatewayCodeValues,
  type NormalizedPayment,
  type NormalizedPaymentStatus,
  type NormalizedWebhookEvent,
  type PaymentGatewayTransport,
  type RefundResult,
  type VerifyCredentialsResult,
} from '../gateway-transport';
import { EASEBUZZ_CURRENCY, toPaise, toRupees } from './easebuzz-amount';
import {
  EASEBUZZ_UDF_COUNT,
  type EasebuzzTransactionFields,
  refundHash,
  requestHash,
  transactionHash,
  verifyReverseHash,
} from './easebuzz-hash';
import { EasebuzzSplit } from './easebuzz-split';

const KEY_FIELD = 'key';
const SALT_FIELD = 'salt';
const ENVIRONMENT_FIELD = 'environment';
const ENVIRONMENTS: readonly EasebuzzEnvironment[] = ['test', 'production'];

const TXNID_PREFIX = 'vp';
// Easebuzz's limit on a transaction id
const TXNID_PATTERN = /^[A-Za-z0-9_-]{3,40}$/;
const PRODUCT_INFO_MAX_LENGTH = 100;
const FIRSTNAME_MAX_LENGTH = 50;
const INDIAN_PHONE = /^[6-9]\d{9}$/;
// Easebuzz hashes the fields joined by |, so a | in one would shift every field after it
const UNSAFE_FIELD_CHARACTERS = /[^A-Za-z0-9 .,_-]/g;

// The ₹1 payment the credential check opens and never pays
const CREDENTIAL_CHECK_AMOUNT = '1.00';
const CREDENTIAL_CHECK_CUSTOMER = { firstname: 'Credential check', email: 'check@example.com', phone: '9999999999' };

const OPENED = 1;
const TRANSACTION_NOT_FOUND = 'transaction not found';

interface EasebuzzAuth {
  key: string;
  salt: string;
  environment: EasebuzzEnvironment;
}

// initiateLink's answer: the access key the checkout opens with, or why the payment was refused
interface EasebuzzInitiateResponse {
  status?: number;
  data?: string;
  error_desc?: string;
}

// The Transaction API's answer: every attempt made under the transaction id, or a message
interface EasebuzzTransactionResponse {
  status?: boolean;
  msg?: EasebuzzTransactionFields[] | EasebuzzTransactionFields | string;
}

interface EasebuzzRefundResponse {
  status?: boolean;
  refund_id?: string;
  reason?: string;
  message?: string;
}

// Easebuzz's transaction states, as the platform's. A dropped, cancelled or bounced attempt did not take the money, so
// it is a failure of that attempt; the intent stays payable by another
const PAYMENT_STATUSES: Readonly<Record<string, NormalizedPaymentStatus>> = {
  success: 'captured',
  failure: 'failed',
  usercancelled: 'failed',
  dropped: 'failed',
  bounced: 'failed',
  initiated: 'created',
  pending: 'created',
};

// The Easebuzz payment gateway. A payment is opened server-side with initiateLink, which answers an access key; the
// browser goes to Easebuzz's hosted page with it, and Easebuzz posts the result to core's hosted callback (surl/furl)
// and to the webhook URL set in the Easebuzz dashboard. Neither post is taken on trust: the callback is completed by
// reading the transaction back through the Transaction API, and a webhook must carry the reverse hash made with the
// merchant's salt — which is therefore what the config's webhook secret is. Split payments go out as split_payments
// labels when the payment is opened (see EasebuzzSplit)
export class EasebuzzTransport implements PaymentGatewayTransport {
  readonly code = GatewayCodeValues.EASEBUZZ;
  readonly credentialFields = [KEY_FIELD, SALT_FIELD, ENVIRONMENT_FIELD] as const;
  readonly split = new EasebuzzSplit();
  private readonly logger = new Logger(EasebuzzTransport.name);

  constructor(private readonly http: EasebuzzHttpService) {}

  // Easebuzz has no read that tells a wrong key or salt apart from a missing transaction, so the check opens a ₹1
  // payment nobody pays: a bad key or a hash made with the wrong salt is refused, and the open payment just lapses
  async verifyCredentials(credentials: Record<string, string>): Promise<VerifyCredentialsResult> {
    const auth = this.auth(credentials);
    const fields = {
      key: auth.key,
      txnid: `${TXNID_PREFIX}check${randomUUID().replaceAll('-', '').slice(0, 24)}`,
      amount: CREDENTIAL_CHECK_AMOUNT,
      productinfo: 'Credential check',
      firstname: CREDENTIAL_CHECK_CUSTOMER.firstname,
      email: CREDENTIAL_CHECK_CUSTOMER.email,
      udf: [],
    };
    const response = await this.http.postForm<EasebuzzInitiateResponse>(
      auth.environment,
      'pay',
      '/payment/initiateLink',
      {
        ...this.openFields(fields, auth),
        phone: CREDENTIAL_CHECK_CUSTOMER.phone,
        surl: 'https://example.com/',
        furl: 'https://example.com/',
      },
    );
    if (response.status !== OPENED) throw credentialsRejected(response, auth.environment);
    this.logger.log(`Credentials verified (${auth.environment})`);
    return { providerMerchantId: null };
  }

  // Opens the payment and returns the hosted page the browser pays on. The transaction id is derived from the intent,
  // so the payment and its webhooks always find their intent
  async createOrder(credentials: Record<string, string>, input: CreateOrderInput): Promise<CreateOrderResult> {
    const auth = this.auth(credentials);
    if (input.currency !== EASEBUZZ_CURRENCY) {
      throw new BadRequestException({
        label: 'Currency Not Supported',
        detail: `Easebuzz takes payments in ${EASEBUZZ_CURRENCY} only.`,
        errors: [{ field: 'currency', message: `Must be ${EASEBUZZ_CURRENCY}` }],
      });
    }
    if (!input.callbackUrl) {
      throw new BadRequestException({
        label: 'Checkout Return Required',
        detail: 'Easebuzz posts the payment result to a page set when the payment is opened, and none was given.',
      });
    }

    const txnid = easebuzzTxnId(input);
    const customer = easebuzzCustomer(input);
    const fields = {
      key: auth.key,
      txnid,
      amount: toRupees(input.amount),
      productinfo: safeField(input.receipt, PRODUCT_INFO_MAX_LENGTH) || 'Payment',
      firstname: customer.firstname,
      email: customer.email,
      udf: [],
    };
    const splitPayments = this.split.splitPayments(input, input.amount);

    const response = await this.http.postForm<EasebuzzInitiateResponse>(
      auth.environment,
      'pay',
      '/payment/initiateLink',
      {
        ...this.openFields(fields, auth),
        phone: customer.phone,
        surl: input.callbackUrl,
        furl: input.callbackUrl,
        ...(splitPayments ? { split_payments: JSON.stringify(splitPayments) } : {}),
      },
    );
    if (response.status !== OPENED || !response.data) {
      this.logger.warn(`initiateLink refused ${txnid}: ${response.error_desc ?? ''} ${response.data ?? ''}`.trim());
      throw new BadRequestException({
        label: 'Payment Not Opened',
        detail: `Easebuzz refused to open the payment: ${refusal(response)}`,
      });
    }

    this.logger.log(`Opened ${txnid} for receipt ${input.receipt}${splitPayments ? ' with a split' : ''}`);
    return {
      providerOrderId: txnid,
      checkout: {
        txnid,
        access_key: response.data,
        url: this.http.checkoutUrl(auth.environment, response.data),
        environment: auth.environment,
      },
      transfers: this.split.sentTransfers(txnid, input.transfers),
    };
  }

  // Easebuzz reads a payment by its transaction id, which this call is not given; see fetchOrderPayment
  async fetchPayment(): Promise<NormalizedPayment> {
    throw new BadRequestException({
      label: 'Read By Transaction',
      detail: 'Easebuzz payments are read back by their transaction id.',
    });
  }

  // Reads the transaction back through the Transaction API. Easebuzz lists every attempt made under the transaction
  // id; a successful one decides it, otherwise the latest. Null while Easebuzz has none
  async fetchOrderPayment(credentials: Record<string, string>, txnid: string): Promise<NormalizedPayment | null> {
    const auth = this.auth(credentials);
    const response = await this.http.postForm<EasebuzzTransactionResponse>(
      auth.environment,
      'dashboard',
      '/transaction/v2.1/retrieve',
      { key: auth.key, txnid, hash: transactionHash(auth.key, txnid, auth.salt) },
    );
    if (!response.status) {
      const message = typeof response.msg === 'string' ? response.msg : '';
      if (message.toLowerCase().startsWith(TRANSACTION_NOT_FOUND)) return null;
      throw new BadRequestException({
        label: 'Payment Not Read',
        detail: `Easebuzz did not return the payment: ${message || 'no reason given'}.`,
      });
    }

    const attempts = Array.isArray(response.msg)
      ? response.msg
      : typeof response.msg === 'object'
        ? [response.msg]
        : [];
    const attempt =
      attempts.find((entry) => entry.status?.toLowerCase() === 'success') ?? attempts[attempts.length - 1];
    return attempt?.easepayid ? this.normalizePayment(attempt) : null;
  }

  // Refunds a captured payment in full or in part. Easebuzz refunds a split payment without being told the split,
  // and refuses a second refund under the same refund id — so a repeat of the same refund is harmless
  async refundPayment(
    credentials: Record<string, string>,
    providerPaymentId: string,
    amount: bigint,
  ): Promise<RefundResult> {
    const auth = this.auth(credentials);
    const refundAmount = toRupees(amount);
    const refundId = `rf${providerPaymentId}${amount}`.replace(/[^A-Za-z0-9]/g, '').slice(0, 40);
    const response = await this.http.postForm<EasebuzzRefundResponse>(
      auth.environment,
      'dashboard',
      '/transaction/v2/refund',
      {
        key: auth.key,
        merchant_refund_id: refundId,
        easebuzz_id: providerPaymentId,
        refund_amount: refundAmount,
        hash: refundHash(auth.key, refundId, providerPaymentId, refundAmount, auth.salt),
      },
    );
    if (!response.status || !response.refund_id) {
      throw new BadRequestException({
        label: 'Refund Refused',
        detail: `Easebuzz refused the refund: ${response.reason ?? response.message ?? 'no reason given'}.`,
      });
    }
    this.logger.log(`Refunded ${amount} of payment ${providerPaymentId} as ${response.refund_id}`);
    return { providerRefundId: response.refund_id, status: 'pending' };
  }

  // The hosted callback is completed by reading the transaction back, never by what the browser posted
  verifyCheckoutSignature(): boolean {
    return false;
  }

  // Easebuzz signs a webhook with the reverse hash made with the merchant's salt, which is the config's webhook secret
  verifyWebhook(salt: string, rawBody: string): boolean {
    return verifyReverseHash(parseForm(rawBody), salt);
  }

  // One event per delivery, deduped on a hash of the signed body. A transaction webhook carries its payment
  parseWebhook(rawBody: string): NormalizedWebhookEvent[] {
    const fields = parseForm(rawBody);
    const status = fields.status?.toLowerCase();
    if (!status) {
      throw new BadRequestException({
        label: 'Malformed Webhook',
        detail: 'The webhook body carries no transaction status, so it cannot be processed.',
      });
    }

    const payment = fields.txnid && fields.easepayid ? this.normalizePayment(fields) : null;
    const dedupeKey = createHash('sha256').update(rawBody).digest('hex');
    return [
      {
        dedupeKey,
        providerEventId: payment ? `${status}:${payment.providerPaymentId}` : dedupeKey,
        eventType: `transaction.${status}`,
        payment,
        transfer: null,
        providerOrderId: fields.txnid ?? null,
        raw: redactHash(fields),
      },
    ];
  }

  // The fields every opened payment carries, with the request hash over them
  private openFields(fields: Parameters<typeof requestHash>[0], auth: EasebuzzAuth): Record<string, string> {
    const udfs = Object.fromEntries(
      Array.from({ length: EASEBUZZ_UDF_COUNT }, (_, index) => [`udf${index + 1}`, fields.udf[index] ?? '']),
    );
    return {
      key: fields.key,
      txnid: fields.txnid,
      amount: fields.amount,
      productinfo: fields.productinfo,
      firstname: fields.firstname,
      email: fields.email,
      ...udfs,
      hash: requestHash(fields, auth.salt),
    };
  }

  private normalizePayment(fields: EasebuzzTransactionFields): NormalizedPayment {
    const status = this.normalizeStatus(fields.status);
    const failed = status === 'failed';
    const message = fields.error_Message ?? fields.error;
    return {
      providerPaymentId: fields.easepayid ?? '',
      providerOrderId: fields.txnid ?? null,
      status,
      amount: toPaise(fields.amount) ?? 0n,
      currency: EASEBUZZ_CURRENCY,
      method: present(fields.mode),
      fee: null,
      tax: null,
      errorCode: failed ? (present(fields.status) ?? null) : null,
      errorDescription: failed ? present(message) : null,
      raw: redactHash(fields),
    };
  }

  // An unrecognised status is left at the neutral `created` rather than guessed either way
  private normalizeStatus(status: string | undefined): NormalizedPaymentStatus {
    const normalized = status ? PAYMENT_STATUSES[status.toLowerCase()] : undefined;
    if (normalized) return normalized;
    this.logger.warn(`Unrecognised transaction status "${status ?? ''}" — treating as created`);
    return 'created';
  }

  // Reads the key, salt and environment out of the per-call credentials, naming each missing or wrong field
  private auth(credentials: Record<string, string>): EasebuzzAuth {
    const key = credentials[KEY_FIELD]?.trim();
    const salt = credentials[SALT_FIELD]?.trim();
    const environment = credentials[ENVIRONMENT_FIELD]?.trim().toLowerCase();
    const errors = [
      ...(key ? [] : [{ field: `credentials.${KEY_FIELD}`, message: 'Required' }]),
      ...(salt ? [] : [{ field: `credentials.${SALT_FIELD}`, message: 'Required' }]),
      ...(isEnvironment(environment)
        ? []
        : [{ field: `credentials.${ENVIRONMENT_FIELD}`, message: 'Must be test or production' }]),
    ];
    if (errors.length > 0 || !key || !salt || !isEnvironment(environment)) {
      throw new BadRequestException({
        label: 'Gateway Credentials Incomplete',
        detail:
          'Easebuzz needs the merchant key, the salt and whether they are test or production keys. Easebuzz sends them with the test kit or after KYC.',
        errors,
      });
    }
    return { key, salt, environment };
  }
}

function isEnvironment(value: string | undefined): value is EasebuzzEnvironment {
  return ENVIRONMENTS.includes(value as EasebuzzEnvironment);
}

// The intent's id without dashes, so every intent has its own Easebuzz transaction
function easebuzzTxnId(input: CreateOrderInput): string {
  const base = input.paymentIntentId ? input.paymentIntentId.replaceAll('-', '') : input.receipt;
  const txnid = `${TXNID_PREFIX}${base}`;
  if (!TXNID_PATTERN.test(txnid)) {
    throw new BadRequestException({
      label: 'Invalid Receipt',
      detail: 'Easebuzz transaction ids are 3 to 40 letters, digits, dashes or underscores.',
      errors: [{ field: 'receipt', message: 'Not a valid Easebuzz transaction id' }],
    });
  }
  return txnid;
}

// Easebuzz requires a name, an email and a ten-digit mobile on every payment
function easebuzzCustomer(input: CreateOrderInput): { firstname: string; email: string; phone: string } {
  const phone = indianPhone(input.customer?.phone);
  const email = input.customer?.email?.trim();
  const errors = [
    ...(phone ? [] : [{ field: 'customer.phone', message: 'Required by Easebuzz' }]),
    ...(email && !email.includes('|') ? [] : [{ field: 'customer.email', message: 'Required by Easebuzz' }]),
  ];
  if (!phone || !email || errors.length > 0) {
    throw new BadRequestException({
      label: 'Contact Details Required',
      detail: "Easebuzz needs the payer's email and ten-digit mobile number. Add them to the profile and pay again.",
      errors,
    });
  }
  const firstname = safeField(input.customer?.name, FIRSTNAME_MAX_LENGTH) || 'Customer';
  return { firstname, email, phone };
}

// A ten-digit Indian mobile with its +91 or 0 dropped
function indianPhone(phone: string | undefined): string | undefined {
  const compact = phone?.replace(/[\s()-]/g, '');
  if (!compact) return undefined;
  const local = compact.replace(/^(\+91|0091|91|0)(?=\d{10}$)/, '');
  return INDIAN_PHONE.test(local) ? local : undefined;
}

// A free-text field cut down to characters that cannot break the hash
function safeField(value: string | undefined, maxLength: number): string {
  return (value ?? '').replace(UNSAFE_FIELD_CHARACTERS, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function present(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed !== 'NA' ? trimmed : null;
}

// Easebuzz answers a refused payment with error_desc and a short reason in data
function refusal(response: EasebuzzInitiateResponse): string {
  return [response.data, response.error_desc].filter(Boolean).join(' — ') || 'no reason given';
}

// A refused credential check, landed on the field at fault: an unknown key (often test keys sent to production, or the
// other way round) or a hash the salt did not make
function credentialsRejected(
  response: EasebuzzInitiateResponse,
  environment: EasebuzzEnvironment,
): BadRequestException {
  const reason = (response.error_desc ?? '').toLowerCase();
  if (reason.includes('merchant key')) {
    return new BadRequestException({
      label: 'Gateway Rejected Credentials',
      detail: `Easebuzz does not know this merchant key in ${environment}. Check the key, and that test keys are saved as test and live keys as production.`,
      errors: [{ field: `credentials.${KEY_FIELD}`, message: 'Rejected by Easebuzz' }],
    });
  }
  if (reason.includes('hash')) {
    return new BadRequestException({
      label: 'Gateway Rejected Credentials',
      detail:
        'Easebuzz rejected the salt for this merchant key. Copy the salt again from the Easebuzz test kit or dashboard.',
      errors: [{ field: `credentials.${SALT_FIELD}`, message: 'Rejected by Easebuzz' }],
    });
  }
  return new BadRequestException({
    label: 'Gateway Rejected Credentials',
    detail: `Easebuzz refused the check payment: ${refusal(response)}`,
  });
}

// A form-encoded body as plain strings; a repeated field keeps its first value
function parseForm(rawBody: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [name, value] of new URLSearchParams(rawBody)) {
    if (!(name in fields)) fields[name] = value;
  }
  return fields;
}

// What is kept of a transaction: everything but its hash, which proves nothing once checked
function redactHash(fields: EasebuzzTransactionFields): Record<string, string | undefined> {
  const { hash: _hash, ...rest } = fields;
  return rest;
}

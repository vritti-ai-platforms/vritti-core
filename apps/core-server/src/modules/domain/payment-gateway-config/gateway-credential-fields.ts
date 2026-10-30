const BASE_GATEWAY_CREDENTIAL_FIELDS = {
  razorpay: { keyIdField: 'key_id', fields: ['key_id', 'key_secret'] },
  cashfree: { keyIdField: 'app_id', fields: ['app_id', 'secret_key'] },
  payu: { keyIdField: 'merchant_key', fields: ['merchant_key', 'salt'] },
  phonepe: { keyIdField: 'merchant_id', fields: ['merchant_id', 'client_id', 'client_secret'] },
  // environment is test or production: Easebuzz keys do not say which host they belong to
  easebuzz: { keyIdField: 'key', fields: ['key', 'salt', 'environment'] },
} as const;

export const GATEWAY_CREDENTIAL_FIELDS = {
  ...BASE_GATEWAY_CREDENTIAL_FIELDS,
  'hdfc-razorpay': BASE_GATEWAY_CREDENTIAL_FIELDS.razorpay,
  'hdfc-cashfree': BASE_GATEWAY_CREDENTIAL_FIELDS.cashfree,
} as const;

export type GatewayCode = keyof typeof GATEWAY_CREDENTIAL_FIELDS;

const WEBHOOK_SIGNING_CREDENTIAL: Readonly<Record<string, string>> = {
  cashfree: 'secret_key',
  'hdfc-cashfree': 'secret_key',
  easebuzz: 'salt',
};

// Gateways that take core's webhook URL on every payment, so nothing is registered in their dashboard
const WEBHOOK_URL_PER_PAYMENT: ReadonlySet<string> = new Set(['cashfree', 'hdfc-cashfree']);

// Gateways that cannot look a payout account up (Easebuzz has no API for its split labels): the account is stored as
// entered, and a wrong one only fails when a payment is split to it
const PAYOUT_ACCOUNT_NOT_LOOKED_UP: ReadonlySet<string> = new Set(['easebuzz']);

// Returns the credential a gateway signs webhooks with, when it has no webhook secret of its own
export function webhookSigningCredential(gatewayCode: string): string | undefined {
  return WEBHOOK_SIGNING_CREDENTIAL[gatewayCode];
}

// A gateway that signs its webhooks with a secret of its own, set in its dashboard beside our URL, rather than with an
// API credential. Such a config is refused without that secret
export function requiresWebhookSecret(gatewayCode: string): boolean {
  return webhookSigningCredential(gatewayCode) === undefined;
}

// A gateway whose webhook URL is registered by hand in its dashboard rather than sent with every payment. Such a config
// takes payments only once a signed webhook has proved the URL (and the secret, where it has one of its own)
export function requiresWebhookVerification(gatewayCode: string): boolean {
  return !WEBHOOK_URL_PER_PAYMENT.has(gatewayCode);
}

// Whether a payout account is looked up at the gateway before it is stored
export function looksUpPayoutAccount(gatewayCode: string): boolean {
  return !PAYOUT_ACCOUNT_NOT_LOOKED_UP.has(gatewayCode);
}

// Narrows an arbitrary code to one of the supported gateways
export function isSupportedGateway(code: string): code is GatewayCode {
  return Object.hasOwn(GATEWAY_CREDENTIAL_FIELDS, code);
}

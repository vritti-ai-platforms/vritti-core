// The credential shape each base gateway product needs
const BASE_GATEWAY_CREDENTIAL_FIELDS = {
  razorpay: { keyIdField: 'key_id', fields: ['key_id', 'key_secret'] },
  cashfree: { keyIdField: 'app_id', fields: ['app_id', 'secret_key'] },
  payu: { keyIdField: 'merchant_key', fields: ['merchant_key', 'salt'] },
  phonepe: { keyIdField: 'merchant_id', fields: ['merchant_id', 'client_id', 'client_secret'] },
} as const;

// Every selectable gateway code. A bank-branded deployment (HDFC's dedicated Razorpay/Cashfree stacks) is its own
// code because it runs on its own host and API version, even though it takes the same credentials as its base —
// the adapter registry will key on these codes too, so one line here is one provider everywhere.
export const GATEWAY_CREDENTIAL_FIELDS = {
  ...BASE_GATEWAY_CREDENTIAL_FIELDS,
  'hdfc-razorpay': BASE_GATEWAY_CREDENTIAL_FIELDS.razorpay,
  'hdfc-cashfree': BASE_GATEWAY_CREDENTIAL_FIELDS.cashfree,
} as const;

export type GatewayCode = keyof typeof GATEWAY_CREDENTIAL_FIELDS;

// Narrows an arbitrary code to one of the supported gateways
export function isSupportedGateway(code: string): code is GatewayCode {
  return Object.hasOwn(GATEWAY_CREDENTIAL_FIELDS, code);
}

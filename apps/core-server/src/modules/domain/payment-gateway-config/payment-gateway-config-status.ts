import { type PaymentGatewayConfig, PaymentGatewayConfigKindValues } from '@/db/schema';
import { requiresWebhookVerification } from './gateway-credential-fields';

export const PaymentGatewayConfigStatusValues = {
  // The stored API credentials have not passed the gateway's check
  KEYS_NOT_VERIFIED: 'KEYS_NOT_VERIFIED',
  // Keys verified; the gateway signs webhooks with a secret of its own and no signed webhook has arrived yet
  WAITING_FOR_WEBHOOK: 'WAITING_FOR_WEBHOOK',
  // Ready to take payments
  ACTIVE: 'ACTIVE',
} as const;
export type PaymentGatewayConfigStatus =
  (typeof PaymentGatewayConfigStatusValues)[keyof typeof PaymentGatewayConfigStatusValues];

type StatusFields = Pick<PaymentGatewayConfig, 'kind' | 'gatewayCode' | 'verifiedAt' | 'webhookVerifiedAt'>;

// Whether a config may take payments, and if not, what it is waiting for. Vritti's PLATFORM rows have no per-org
// webhook URL until the platform webhook router exists, so they need the key check only
export function paymentGatewayConfigStatus(row: StatusFields): PaymentGatewayConfigStatus {
  if (!row.verifiedAt) return PaymentGatewayConfigStatusValues.KEYS_NOT_VERIFIED;
  const needsWebhook = row.kind === PaymentGatewayConfigKindValues.ORG && requiresWebhookVerification(row.gatewayCode);
  if (needsWebhook && !row.webhookVerifiedAt) return PaymentGatewayConfigStatusValues.WAITING_FOR_WEBHOOK;
  return PaymentGatewayConfigStatusValues.ACTIVE;
}

import type { PaymentGatewayConfigType } from '@/db/schema';

export interface PaymentGatewayConfigContext {
  legalEntityId: string;
  type: PaymentGatewayConfigType;
  siteId?: string | null;
  appId?: string | null;
}

import type { PaymentTransferStatus } from '@/db/schema';
import type { PaymentTransferDto } from '../entity/payment-transfer.dto';

export interface ApplyTransferEventInput {
  providerTransferId: string;
  // The account and payment the gateway names on the transfer, to recognise a leg whose send is still in flight
  providerAccountId?: string | null;
  providerPaymentId?: string | null;
  status: PaymentTransferStatus;
  errorCode?: string | null;
  errorDescription?: string | null;
}

// What a transfer event did: moved its transfer forward, arrived behind a later status already applied, named a
// leg whose send has not committed yet (worth redelivering), or named nothing this platform created
export type ApplyTransferEventResult =
  | { outcome: 'applied'; transfer: PaymentTransferDto }
  | { outcome: 'stale'; transfer: PaymentTransferDto }
  | { outcome: 'in_flight' }
  | { outcome: 'unknown' };

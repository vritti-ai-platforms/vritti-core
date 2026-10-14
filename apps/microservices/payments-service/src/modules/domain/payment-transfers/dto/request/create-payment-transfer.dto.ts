export interface CreatePaymentTransferInput {
  intentId: string;
  linkedAccountId: string;
  providerAccountId: string;
  amount: bigint;
  currency: string;
  onHold?: boolean;
  onHoldUntil?: Date | null;
}

import type { RazorpayAuth, RazorpayHttpService } from '@/gateways/razorpay/services/razorpay-http.service';
import type { CreateTransferInput, GatewayAccountLookup, GatewaySplitCapability } from '../gateway-transport';
import { toMinorUnitsNumber } from './razorpay-amount';

const LINKED_ACCOUNT_MISSING_REASONS = ['linked_account_id_does_not_exist'] as const;

// Razorpay Route. Linked accounts are added in the Razorpay dashboard and entered as payout accounts by their id; a
// payment is split by the `transfers` its order carries, which Razorpay makes once the payment is captured. Holds no
// state and no secrets: the transport hands it the per-call key pair resolver
export class RazorpaySplit implements GatewaySplitCapability {
  constructor(
    private readonly http: RazorpayHttpService,
    private readonly resolveAuth: (credentials: Record<string, string>) => RazorpayAuth,
  ) {}

  // Looks a Route linked account up under the parent's keys; Razorpay answers another merchant's as missing too
  async lookupAccount(
    credentials: Record<string, string>,
    providerAccountId: string,
  ): Promise<GatewayAccountLookup | null> {
    const account = await this.http.find<{ id: string; status?: string }>(
      this.resolveAuth(credentials),
      `/accounts/${encodeURIComponent(providerAccountId)}`,
      { version: 'v2', missingReasons: LINKED_ACCOUNT_MISSING_REASONS },
    );
    if (!account) return null;
    return { status: account.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE' };
  }

  // Builds one entry of an order's `transfers`; on_hold_until is unix seconds
  transferBody(transfer: CreateTransferInput, index: number): Record<string, unknown> {
    return {
      account: transfer.providerAccountId,
      amount: toMinorUnitsNumber(transfer.amount, `transfers.${index}.amount`),
      currency: transfer.currency,
      ...(transfer.notes ? { notes: transfer.notes } : {}),
      ...(transfer.onHold !== undefined ? { on_hold: transfer.onHold } : {}),
      ...(transfer.onHoldUntil ? { on_hold_until: Math.floor(transfer.onHoldUntil.getTime() / 1000) } : {}),
    };
  }
}

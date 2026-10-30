import type { Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { CashfreeAuth, CashfreeHttpService } from '@/gateways/cashfree/services/cashfree-http.service';
import type {
  CreateLinkedAccountResult,
  CreateOrderInput,
  CreateTransferResult,
  FetchLinkedAccountStatusInput,
  GatewaySplitCapability,
  LinkedAccountLookup,
  LinkedAccountStatus,
  LinkedAccountStatusResult,
} from '../gateway-transport';
import { toMajorUnits } from './cashfree-amount';

const VENDOR_MISSING_MESSAGES = ['vendor does not exist'] as const;

interface CashfreeVendor {
  vendor_id?: string;
  status?: string;
}

// One vendor's share as an order carries it
export interface CashfreeOrderSplit {
  vendor_id: string;
  amount: number;
}

// Cashfree's vendor states onto the neutral set. Only an ACTIVE vendor is settled to: Easy Split keeps the share of
// any other in the merchant's own account, so a vendor whose bank details failed validation is one the merchant has
// to fix, not one still on its way
const VENDOR_STATUSES: Readonly<Record<string, LinkedAccountStatus>> = {
  ACTIVE: 'ACTIVE',
  BLOCKED: 'SUSPENDED',
  DELETED: 'SUSPENDED',
  BANK_VALIDATION_FAILED: 'ACTION_REQUIRED',
  ACTION_REQUIRED: 'ACTION_REQUIRED',
  IN_BENE_CREATION: 'IN_REVIEW',
  IN_REVIEW: 'IN_REVIEW',
};

// Cashfree Easy Split. Vendors are added in the Cashfree dashboard and entered as payout accounts by their vendor id;
// a payment is split by the vendors' shares travelling on its order as `order_splits`, and Cashfree settles them once
// the payment succeeds — so there is no linked-account setup and no transfer call to make here. Holds no state and no
// secrets: the transport hands it the per-call key pair resolver and its logger.
export class CashfreeSplit implements GatewaySplitCapability {
  constructor(
    private readonly http: CashfreeHttpService,
    private readonly resolveAuth: (credentials: Record<string, string>) => CashfreeAuth,
    private readonly logger: Logger,
  ) {}

  async createLinkedAccount(): Promise<CreateLinkedAccountResult> {
    throw new BadRequestException({
      label: 'Add Vendor In Cashfree',
      detail: 'Cashfree vendors are added in the Cashfree dashboard. Enter the vendor id as the payout account.',
    });
  }

  async createTransfers(): Promise<CreateTransferResult[]> {
    throw new BadRequestException({
      label: 'Split Sent With Order',
      detail: 'Cashfree splits a payment with the shares sent on its order, so there is nothing to transfer now.',
    });
  }

  // Looks an Easy Split vendor up by id; null when Cashfree has none under these keys
  async fetchLinkedAccount(credentials: Record<string, string>, vendorId: string): Promise<LinkedAccountLookup | null> {
    const vendor = await this.http.get<CashfreeVendor>(
      this.resolveAuth(credentials),
      `/easy-split/vendors/${encodeURIComponent(vendorId)}`,
      { missingMessages: VENDOR_MISSING_MESSAGES },
    );
    if (!vendor) return null;
    return { status: this.normalizeVendorStatus(vendor.status) };
  }

  async fetchLinkedAccountStatus(
    credentials: Record<string, string>,
    input: FetchLinkedAccountStatusInput,
  ): Promise<LinkedAccountStatusResult> {
    const vendor = await this.http.get<CashfreeVendor>(
      this.resolveAuth(credentials),
      `/easy-split/vendors/${encodeURIComponent(input.providerAccountId)}`,
    );
    return { status: this.normalizeVendorStatus(vendor?.status), requirements: [] };
  }

  // The order's `order_splits`: each leg as its vendor and rupee amount
  orderSplits(transfers: CreateOrderInput['transfers']): CashfreeOrderSplit[] {
    return (transfers ?? []).map((transfer, index) => ({
      vendor_id: transfer.providerAccountId,
      amount: toMajorUnits(transfer.amount, `transfers[${index}].amount`),
    }));
  }

  // Easy Split gives the shares no ids of their own; each is named after its order and vendor so its leg is marked
  // sent and never sent again
  sentTransfers(orderId: string, transfers: CreateOrderInput['transfers']): CreateTransferResult[] {
    return (transfers ?? []).map((transfer) => ({
      providerTransferId: `${orderId}:${transfer.providerAccountId}`,
      providerAccountId: transfer.providerAccountId,
      amount: transfer.amount,
      status: 'PENDING' as const,
    }));
  }

  // An unrecognised vendor status is held at PENDING rather than guessed as active
  private normalizeVendorStatus(status: string | undefined): LinkedAccountStatus {
    const mapped = status ? VENDOR_STATUSES[status] : undefined;
    if (mapped) return mapped;
    this.logger.warn(`Unrecognised Cashfree vendor status "${status ?? ''}" — treating as PENDING`);
    return 'PENDING';
  }
}

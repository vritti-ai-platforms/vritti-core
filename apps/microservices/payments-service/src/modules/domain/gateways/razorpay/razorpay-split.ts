import { HttpException, type Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { RazorpayAuth, RazorpayHttpService } from '@/gateways/razorpay/services/razorpay-http.service';
import type {
  CreateLinkedAccountInput,
  CreateLinkedAccountResult,
  CreateTransferInput,
  CreateTransferResult,
  FetchLinkedAccountStatusInput,
  GatewaySplitCapability,
  LinkedAccountSetupError,
  LinkedAccountStatus,
  LinkedAccountStatusResult,
  NormalizedTransfer,
  ResumeLinkedAccountInput,
  TransferStatus,
} from '../gateway-transport';
import { toMinorUnitsNumber } from './razorpay-amount';

const ROUTE_PRODUCT_NAME = 'route';
const ROUTE_ACCOUNT_TYPE = 'route';
const PAYMENT_ID_PREFIX = 'pay_';

export interface RazorpayLinkedAccount {
  id: string;
  status?: string;
}

export interface RazorpayStakeholder {
  id: string;
}

export interface RazorpayProductRequirement {
  field_reference?: string;
  resolution_url?: string;
  reason_code?: string;
  status?: string;
}

export interface RazorpayProductConfiguration {
  id: string;
  account_id?: string;
  product_name?: string;
  activation_status?: string;
  requirements?: RazorpayProductRequirement[];
}

export interface RazorpayTransfer {
  id: string;
  status?: string;
  source?: string | null;
  recipient?: string | null;
  amount: number;
  currency?: string;
  on_hold?: boolean;
  error?: { code?: string | null; description?: string | null } | null;
}

interface RazorpayCollection<T> {
  entity?: string;
  count?: number;
  items?: T[];
}

// Razorpay's field path → the CreateLinkedAccountInput key the merchant typed it into. Bare names are
// mapped too, since Razorpay sometimes names the leaf without its parent path.
const ACCOUNT_FIELD_MAP: Readonly<Record<string, string>> = {
  email: 'email',
  phone: 'phone',
  reference_id: 'referenceId',
  legal_business_name: 'legalBusinessName',
  business_type: 'businessType',
  contact_name: 'contactName',
  'profile.category': 'category',
  'profile.subcategory': 'subcategory',
  category: 'category',
  subcategory: 'subcategory',
  'profile.addresses.registered.street1': 'address.street1',
  'profile.addresses.registered.street2': 'address.street2',
  'profile.addresses.registered.city': 'address.city',
  'profile.addresses.registered.state': 'address.state',
  'profile.addresses.registered.postal_code': 'address.postalCode',
  'profile.addresses.registered.country': 'address.country',
  street1: 'address.street1',
  street2: 'address.street2',
  city: 'address.city',
  state: 'address.state',
  postal_code: 'address.postalCode',
  country: 'address.country',
  'legal_info.pan': 'pan',
  'legal_info.gst': 'gst',
  pan: 'pan',
  gst: 'gst',
};

const STAKEHOLDER_FIELD_MAP: Readonly<Record<string, string>> = {
  name: 'contactName',
  email: 'email',
};

const SETTLEMENT_FIELD_MAP: Readonly<Record<string, string>> = {
  'settlements.account_number': 'bank.accountNumber',
  'settlements.ifsc_code': 'bank.ifscCode',
  'settlements.beneficiary_name': 'bank.beneficiaryName',
  account_number: 'bank.accountNumber',
  ifsc_code: 'bank.ifscCode',
  beneficiary_name: 'bank.beneficiaryName',
};

// Razorpay's Route activation states onto the neutral set
const ACTIVATION_STATUSES: Readonly<Record<string, LinkedAccountStatus>> = {
  requested: 'PENDING',
  under_review: 'IN_REVIEW',
  needs_clarification: 'ACTION_REQUIRED',
  activated: 'ACTIVE',
  suspended: 'SUSPENDED',
};

// Razorpay holds transfers to a new linked account for a cooling period of 24 hours
const ROUTE_COOLING_PERIOD_MS = 24 * 60 * 60 * 1000;

const TRANSFER_STATUSES: Readonly<Record<string, TransferStatus>> = {
  created: 'CREATED',
  pending: 'PENDING',
  processed: 'PROCESSED',
  failed: 'FAILED',
  reversed: 'REVERSED',
  partially_reversed: 'PARTIALLY_REVERSED',
};

// Razorpay Route — linked accounts (v2 account APIs) and transfers off a captured payment (v1). Holds
// no state and no secrets: the transport hands it the per-call key pair resolver and its logger, so a
// bank edition that extends RazorpayTransport inherits this unchanged over its own client.
export class RazorpaySplit implements GatewaySplitCapability {
  constructor(
    private readonly http: RazorpayHttpService,
    private readonly resolveAuth: (credentials: Record<string, string>) => RazorpayAuth,
    private readonly logger: Logger,
  ) {}

  // Creates the linked account, its stakeholder, requests the Route product and attaches the settlement
  // bank account — the four calls Razorpay needs before a linked account can receive transfers
  async createLinkedAccount(
    credentials: Record<string, string>,
    input: CreateLinkedAccountInput,
    resume?: ResumeLinkedAccountInput,
  ): Promise<CreateLinkedAccountResult> {
    const auth = this.resolveAuth(credentials);
    this.assertProfile(input);

    // Step 1 creates the account and spends its reference_id. It runs only on a first attempt — a resume carries
    // the account an earlier attempt already created, so a retry never opens a second one
    let accountId = resume?.providerAccountId;
    if (!accountId) {
      const account = await this.http.post<RazorpayLinkedAccount>(auth, '/accounts', this.accountBody(input), {
        version: 'v2',
        fieldMap: ACCOUNT_FIELD_MAP,
      });
      accountId = account.id;
      this.logger.log(`Created linked account ${accountId} for reference ${input.referenceId}`);
    } else {
      this.logger.log(`Resuming setup of linked account ${accountId} for reference ${input.referenceId}`);
    }

    // The references gathered so far; each later step is skipped when an earlier attempt already completed it
    const providerData: Record<string, string> = { ...(resume?.providerData ?? {}) };
    const accountPath = `/accounts/${encodeURIComponent(accountId)}`;

    try {
      if (!providerData.stakeholderId) {
        const stakeholder = await this.http.post<RazorpayStakeholder>(
          auth,
          `${accountPath}/stakeholders`,
          { name: input.contactName, email: input.email },
          { version: 'v2', fieldMap: STAKEHOLDER_FIELD_MAP },
        );
        providerData.stakeholderId = stakeholder.id;
      }

      if (!providerData.productId) {
        const requested = await this.http.post<RazorpayProductConfiguration>(
          auth,
          `${accountPath}/products`,
          { product_name: ROUTE_PRODUCT_NAME, tnc_accepted: true },
          { version: 'v2' },
        );
        providerData.productId = requested.id;
      }

      const configured = await this.http.patch<RazorpayProductConfiguration>(
        auth,
        `${accountPath}/products/${encodeURIComponent(providerData.productId)}`,
        {
          settlements: {
            account_number: input.bank.accountNumber,
            ifsc_code: input.bank.ifscCode,
            beneficiary_name: input.bank.beneficiaryName,
          },
          tnc_accepted: true,
        },
        { version: 'v2', fieldMap: SETTLEMENT_FIELD_MAP },
      );

      const status = this.normalizeActivationStatus(configured.activation_status);
      this.logger.log(`Linked account ${accountId} Route product ${providerData.productId} is ${status}`);
      return {
        providerAccountId: accountId,
        providerData,
        status,
        transfersAllowedAt: new Date(Date.now() + ROUTE_COOLING_PERIOD_MS).toISOString(),
        setupError: null,
      };
    } catch (error) {
      // The account exists at Razorpay now, so the failure is reported alongside the ids rather than thrown: the
      // caller keeps them and the next attempt resumes from the step that failed
      const problem = problemOf(error);
      this.logger.warn(`Linked account ${accountId} was created but its setup did not complete: ${problem.detail}`);
      return {
        providerAccountId: accountId,
        providerData,
        status: 'PENDING',
        transfersAllowedAt: null,
        setupError: problem,
      };
    }
  }

  // Reads the Route product's activation state and whatever Razorpay still needs from the merchant
  async fetchLinkedAccountStatus(
    credentials: Record<string, string>,
    input: FetchLinkedAccountStatusInput,
  ): Promise<LinkedAccountStatusResult> {
    const auth = this.resolveAuth(credentials);
    const productId = input.providerData.productId;
    if (!productId) {
      throw new BadRequestException({
        label: 'Linked Account Incomplete',
        detail: 'This linked account has no Route product reference, so its status cannot be read. Register it again.',
      });
    }
    const product = await this.http.get<RazorpayProductConfiguration>(
      auth,
      `/accounts/${encodeURIComponent(input.providerAccountId)}/products/${encodeURIComponent(productId)}`,
      undefined,
      { version: 'v2' },
    );

    return {
      status: this.normalizeActivationStatus(product.activation_status),
      requirements: (product.requirements ?? [])
        .map((requirement) => requirement.field_reference)
        .filter((reference): reference is string => typeof reference === 'string' && reference.length > 0),
    };
  }

  // Splits a captured payment across linked accounts; Razorpay answers with one transfer per entry, in order
  async createTransfers(
    credentials: Record<string, string>,
    providerPaymentId: string,
    transfers: CreateTransferInput[],
  ): Promise<CreateTransferResult[]> {
    const auth = this.resolveAuth(credentials);
    if (transfers.length === 0) {
      throw new BadRequestException({
        label: 'No Transfers',
        detail: 'A split needs at least one linked account to route funds to.',
        errors: [{ field: 'transfers', message: 'At least one required' }],
      });
    }

    const response = await this.http.post<RazorpayCollection<RazorpayTransfer>>(
      auth,
      `/payments/${encodeURIComponent(providerPaymentId)}/transfers`,
      { transfers: transfers.map((transfer, index) => this.transferBody(transfer, index)) },
    );

    const items = response.items ?? [];
    this.logger.log(`Created ${items.length} transfer(s) on payment ${providerPaymentId}`);
    return items.map((item, index) => ({
      providerTransferId: item.id,
      providerAccountId: item.recipient ?? transfers[index]?.providerAccountId ?? '',
      amount: BigInt(item.amount),
      status: this.normalizeTransferStatus(item.status),
    }));
  }

  // Maps a Razorpay transfer entity (API response or webhook payload) onto the gateway-neutral shape
  normalizeTransfer(transfer: RazorpayTransfer): NormalizedTransfer {
    const source = transfer.source ?? null;
    return {
      providerTransferId: transfer.id,
      providerAccountId: transfer.recipient ?? null,
      // A transfer made on an order names the order as its source, not a payment
      providerPaymentId: source?.startsWith(PAYMENT_ID_PREFIX) ? source : null,
      amount: BigInt(transfer.amount),
      status: this.normalizeTransferStatus(transfer.status),
      errorCode: transfer.error?.code ?? null,
      errorDescription: transfer.error?.description ?? null,
      raw: transfer,
    };
  }

  // Razorpay needs a business classification that the neutral input leaves optional
  private assertProfile(input: CreateLinkedAccountInput): void {
    const missing = (['category', 'subcategory'] as const).filter((field) => !input[field]?.trim());
    if (missing.length > 0) {
      throw new BadRequestException({
        label: 'Business Category Required',
        detail: 'Razorpay needs a business category and subcategory to create a linked account.',
        errors: missing.map((field) => ({ field, message: 'Required' })),
      });
    }
  }

  // Builds the POST /v2/accounts body from the gateway-neutral input
  private accountBody(input: CreateLinkedAccountInput): Record<string, unknown> {
    const legalInfo = {
      ...(input.pan ? { pan: input.pan.toUpperCase() } : {}),
      ...(input.gst ? { gst: input.gst.toUpperCase() } : {}),
    };
    return {
      email: input.email,
      phone: input.phone.replace(/\D/g, ''),
      type: ROUTE_ACCOUNT_TYPE,
      reference_id: input.referenceId,
      legal_business_name: input.legalBusinessName,
      business_type: input.businessType,
      contact_name: input.contactName,
      profile: {
        category: input.category,
        subcategory: input.subcategory,
        addresses: {
          registered: {
            street1: input.address.street1,
            ...(input.address.street2 ? { street2: input.address.street2 } : {}),
            city: input.address.city,
            state: input.address.state,
            postal_code: input.address.postalCode,
            country: input.address.country,
          },
        },
      },
      ...(Object.keys(legalInfo).length > 0 ? { legal_info: legalInfo } : {}),
    };
  }

  // Builds one entry of the POST /v1/payments/{id}/transfers body; on_hold_until is unix seconds
  private transferBody(transfer: CreateTransferInput, index: number): Record<string, unknown> {
    return {
      account: transfer.providerAccountId,
      amount: toMinorUnitsNumber(transfer.amount, `transfers.${index}.amount`),
      currency: transfer.currency,
      ...(transfer.notes ? { notes: transfer.notes } : {}),
      ...(transfer.onHold !== undefined ? { on_hold: transfer.onHold } : {}),
      ...(transfer.onHoldUntil ? { on_hold_until: Math.floor(transfer.onHoldUntil.getTime() / 1000) } : {}),
    };
  }

  // An unrecognised activation status is held at PENDING rather than guessed as activated
  private normalizeActivationStatus(status: string | undefined): LinkedAccountStatus {
    const mapped = status ? ACTIVATION_STATUSES[status] : undefined;
    if (mapped) return mapped;
    this.logger.warn(`Unrecognised Route activation status "${status ?? ''}" — treating as PENDING`);
    return 'PENDING';
  }

  // An unrecognised transfer status is left at the neutral CREATED rather than guessed either way
  private normalizeTransferStatus(status: string | undefined): TransferStatus {
    const mapped = status ? TRANSFER_STATUSES[status] : undefined;
    if (mapped) return mapped;
    this.logger.warn(`Unrecognised transfer status "${status ?? ''}" — treating as CREATED`);
    return 'CREATED';
  }
}

// Reads the label and detail out of an RFC 9457 exception, falling back to a plain error message
function problemOf(error: unknown): LinkedAccountSetupError {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    if (typeof response === 'object' && response !== null) {
      const { label, detail } = response as { label?: unknown; detail?: unknown };
      return {
        label: typeof label === 'string' && label ? label : 'Linked Account Setup Incomplete',
        detail: typeof detail === 'string' && detail ? detail : error.message,
      };
    }
  }
  return {
    label: 'Linked Account Setup Incomplete',
    detail: error instanceof Error ? error.message : 'The gateway did not finish setting up the linked account.',
  };
}

export const GatewayCodeValues = {
  RAZORPAY: 'razorpay' as const,
  HDFC_RAZORPAY: 'hdfc-razorpay' as const,
};

export type NormalizedPaymentStatus = 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';

export interface NormalizedPayment {
  providerPaymentId: string;
  providerOrderId: string | null;
  status: NormalizedPaymentStatus;
  amount: bigint;
  currency: string;
  method: string | null;
  fee: bigint | null;
  tax: bigint | null;
  errorCode: string | null;
  errorDescription: string | null;
  raw: unknown;
}

// Provider-neutral onboarding state of a linked account; each transport maps its provider's states onto these
export type LinkedAccountStatus = 'PENDING' | 'IN_REVIEW' | 'ACTION_REQUIRED' | 'ACTIVE' | 'SUSPENDED';

export type TransferStatus = 'CREATED' | 'PENDING' | 'PROCESSED' | 'FAILED' | 'REVERSED' | 'PARTIALLY_REVERSED';

export interface NormalizedTransfer {
  providerTransferId: string;
  providerAccountId: string | null;
  providerPaymentId: string | null;
  amount: bigint;
  status: TransferStatus;
  errorCode: string | null;
  errorDescription: string | null;
  raw: unknown;
}

export interface NormalizedWebhookEvent {
  // Dedupe key derived ONLY from signed content, so a replayed body cannot pose as a new event by changing an
  // unsigned header. A provider retry resends the same body and therefore lands on the same key.
  dedupeKey: string;
  // The provider's own event id where it sends one (traceability only — it may arrive in an unsigned header)
  providerEventId: string;
  eventType: string;
  payment: NormalizedPayment | null;
  transfer: NormalizedTransfer | null;
  providerOrderId: string | null;
  raw: unknown;
}

export interface GatewayCustomer {
  name?: string;
  email?: string;
  phone?: string;
}

export interface CreateOrderInput {
  amount: bigint;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  customer?: GatewayCustomer;
}

export interface CreateOrderResult {
  providerOrderId: string;
  checkout: Record<string, unknown>;
}

export interface VerifyCheckoutSignatureInput {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface VerifyCredentialsResult {
  providerMerchantId: string | null;
}

export interface GatewayDescriptor {
  code: string;
  credentialFields: string[];
  supportsSplit: boolean;
}

export interface LinkedAccountAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface LinkedAccountBank {
  accountNumber: string;
  ifscCode: string;
  beneficiaryName: string;
}

export interface CreateLinkedAccountInput {
  referenceId: string;
  email: string;
  phone: string;
  legalBusinessName: string;
  businessType: string;
  contactName: string;
  // Business classification; only some providers need it, and a transport that does rejects a missing one
  category?: string;
  subcategory?: string;
  address: LinkedAccountAddress;
  pan?: string;
  gst?: string;
  bank: LinkedAccountBank;
}

// Opaque provider references the transport needs again later (e.g. Razorpay's stakeholder and product ids).
// Core stores it as-is and sends it back; nothing outside the transport reads it.
export type LinkedAccountProviderData = Record<string, string>;

export interface CreateLinkedAccountResult {
  providerAccountId: string;
  providerData: LinkedAccountProviderData;
  status: LinkedAccountStatus;
  // When the provider first accepts transfers to the account; null when it accepts them straight away
  transfersAllowedAt: string | null;
  // Set when the account was created at the provider but a later setup step failed. The ids gathered so far are
  // still returned so the caller can keep them and resume the setup instead of creating a second account.
  setupError: LinkedAccountSetupError | null;
}

export interface LinkedAccountSetupError {
  label: string;
  detail: string;
}

// What an earlier, partly completed creation left at the provider — passed back to finish the remaining steps
export interface ResumeLinkedAccountInput {
  providerAccountId: string;
  providerData: LinkedAccountProviderData;
}

export interface FetchLinkedAccountStatusInput {
  providerAccountId: string;
  providerData: LinkedAccountProviderData;
}

export interface LinkedAccountStatusResult {
  status: LinkedAccountStatus;
  requirements: string[];
}

export interface CreateTransferInput {
  providerAccountId: string;
  amount: bigint;
  currency: string;
  notes?: Record<string, string>;
  onHold?: boolean;
  onHoldUntil?: Date | null;
}

export interface CreateTransferResult {
  providerTransferId: string;
  providerAccountId: string;
  amount: bigint;
  status: TransferStatus;
}

export interface GatewaySplitCapability {
  createLinkedAccount(
    credentials: Record<string, string>,
    input: CreateLinkedAccountInput,
    resume?: ResumeLinkedAccountInput,
  ): Promise<CreateLinkedAccountResult>;
  fetchLinkedAccountStatus(
    credentials: Record<string, string>,
    input: FetchLinkedAccountStatusInput,
  ): Promise<LinkedAccountStatusResult>;
  createTransfers(
    credentials: Record<string, string>,
    providerPaymentId: string,
    transfers: CreateTransferInput[],
  ): Promise<CreateTransferResult[]>;
}

export interface PaymentGatewayTransport {
  readonly code: string;
  readonly credentialFields: readonly string[];
  readonly split?: GatewaySplitCapability;
  verifyCredentials(credentials: Record<string, string>): Promise<VerifyCredentialsResult>;
  createOrder(credentials: Record<string, string>, input: CreateOrderInput): Promise<CreateOrderResult>;
  fetchPayment(credentials: Record<string, string>, providerPaymentId: string): Promise<NormalizedPayment>;
  verifyCheckoutSignature(credentials: Record<string, string>, input: VerifyCheckoutSignatureInput): boolean;
  verifyWebhook(webhookSecret: string, rawBody: string, headers: Record<string, string>): boolean;
  parseWebhook(rawBody: string, headers: Record<string, string>): NormalizedWebhookEvent[];
}

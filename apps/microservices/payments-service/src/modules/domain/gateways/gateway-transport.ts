export const GatewayCodeValues = {
  RAZORPAY: 'razorpay' as const,
  HDFC_RAZORPAY: 'hdfc-razorpay' as const,
  CASHFREE: 'cashfree' as const,
  EASEBUZZ: 'easebuzz' as const,
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
  // Shares the gateway splits off once the payment is captured; only a gateway with split support takes them
  transfers?: CreateTransferInput[];
  // The intent the order pays, for gateways that key their order on it
  paymentIntentId?: string;
  // Where a gateway that redirects on its own sends the shopper back to, carrying the intent it paid
  returnUrl?: string;
  // Where a gateway that takes a webhook URL on each order delivers that order's webhooks; one that does not ignores it
  notifyUrl?: string;
  // Core's hosted checkout callback for this intent, for a gateway that posts the payment's result to a URL set on the
  // order; one whose checkout is handed the URL in the browser ignores it
  callbackUrl?: string;
  // The config's main account at the gateway. A gateway whose split must cover the whole amount sends what the legs
  // leave over to it; one that keeps the remainder in the main account on its own ignores it
  mainAccountId?: string;
}

export interface CreateOrderResult {
  providerOrderId: string;
  checkout: Record<string, unknown>;
  // The transfers the gateway created with the order, in the order they were asked for
  transfers: CreateTransferResult[];
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

export interface LinkedAccountLookup {
  status: LinkedAccountStatus;
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
  // Looks an existing linked account up by id under the given keys; null when the gateway has none
  fetchLinkedAccount(
    credentials: Record<string, string>,
    providerAccountId: string,
  ): Promise<LinkedAccountLookup | null>;
  createTransfers(
    credentials: Record<string, string>,
    providerPaymentId: string,
    transfers: CreateTransferInput[],
  ): Promise<CreateTransferResult[]>;
}

// What a gateway answered a refund with
export interface RefundResult {
  providerRefundId: string;
  status: string;
}

export interface PaymentGatewayTransport {
  readonly code: string;
  readonly credentialFields: readonly string[];
  readonly split?: GatewaySplitCapability;
  verifyCredentials(credentials: Record<string, string>): Promise<VerifyCredentialsResult>;
  createOrder(credentials: Record<string, string>, input: CreateOrderInput): Promise<CreateOrderResult>;
  fetchPayment(credentials: Record<string, string>, providerPaymentId: string): Promise<NormalizedPayment>;
  // Returns a captured payment's money, whole or in part; a gateway without it cannot refund through the platform yet
  refundPayment?(credentials: Record<string, string>, providerPaymentId: string, amount: bigint): Promise<RefundResult>;
  verifyCheckoutSignature(credentials: Record<string, string>, input: VerifyCheckoutSignatureInput): boolean;
  // Reads an order's payment back from the gateway, null while it has none. A gateway with it completes a browser
  // return by this server-side read alone, so nothing the browser posted is trusted, signature included
  fetchOrderPayment?(credentials: Record<string, string>, providerOrderId: string): Promise<NormalizedPayment | null>;
  verifyWebhook(webhookSecret: string, rawBody: string, headers: Record<string, string>): boolean;
  parseWebhook(rawBody: string, headers: Record<string, string>): NormalizedWebhookEvent[];
}

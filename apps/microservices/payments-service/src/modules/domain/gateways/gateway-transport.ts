export const GatewayCodeValues = {
  RAZORPAY: 'razorpay' as const,
  HDFC_RAZORPAY: 'hdfc-razorpay' as const,
  CASHFREE: 'cashfree' as const,
  EASEBUZZ: 'easebuzz' as const,
};

// The ways a shopper can pay, as the hosted checkout page offers them; each gateway lists the ones it takes
export const PaymentMethodValues = ['upi', 'card', 'netbanking', 'wallet'] as const;
export type PaymentMethodCode = (typeof PaymentMethodValues)[number];

// How the shopper's browser opens the gateway: HOSTED leaves the store for the gateway's own page, MODAL opens the
// gateway's payment window on the store's page. Set on the organization's gateway config in core
export const CheckoutModeValues = ['HOSTED', 'MODAL'] as const;
export type CheckoutMode = (typeof CheckoutModeValues)[number];

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
export type GatewayAccountStatus = 'PENDING' | 'IN_REVIEW' | 'ACTION_REQUIRED' | 'ACTIVE' | 'SUSPENDED';

export interface NormalizedWebhookEvent {
  // Dedupe key derived ONLY from signed content, so a replayed body cannot pose as a new event by changing an
  // unsigned header. A provider retry resends the same body and therefore lands on the same key.
  dedupeKey: string;
  // The provider's own event id where it sends one (traceability only — it may arrive in an unsigned header)
  providerEventId: string;
  eventType: string;
  payment: NormalizedPayment | null;
  // A refund event's refund: its outcome moves the refunded intent
  refund?: NormalizedRefund | null;
  providerOrderId: string | null;
  raw: unknown;
}

export type NormalizedRefundStatus = 'pending' | 'processed' | 'failed';

// A refund as the gateway reports it, by the payment it refunds
export interface NormalizedRefund {
  providerRefundId: string;
  providerPaymentId: string;
  // What the refund returns, in minor units; null when the gateway does not say. Less than the payment is a partial
  // refund
  amount: bigint | null;
  status: NormalizedRefundStatus;
  errorDescription: string | null;
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
  // The method the shopper picked on the hosted checkout page; the gateway's page opens on it
  method?: PaymentMethodCode;
  // How the browser opens this order's checkout; HOSTED when left out. A gateway with one way to open ignores it
  checkoutMode?: CheckoutMode;
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
  methods: PaymentMethodCode[];
}

// What a gateway says of a seller's account under the merchant's keys — a linked account, a vendor
export interface GatewayAccountLookup {
  status: GatewayAccountStatus;
}

export interface CreateTransferInput {
  providerAccountId: string;
  amount: bigint;
  currency: string;
  notes?: Record<string, string>;
  onHold?: boolean;
  onHoldUntil?: Date | null;
}

// What a gateway that splits payments can be asked besides taking the split on an order
export interface GatewaySplitCapability {
  // Looks a seller's account up by id under the given keys; null when the gateway has none
  lookupAccount(credentials: Record<string, string>, providerAccountId: string): Promise<GatewayAccountLookup | null>;
}

// One refund to ask a gateway for. Razorpay and Easebuzz refund the payment; Cashfree refunds under the order and
// keys the refund on the merchant's own id, which is new on every attempt so a retry after a failure is a new refund
export interface RefundRequest {
  providerPaymentId: string;
  providerOrderId: string | null;
  amount: bigint;
  refundId: string;
}

// One refund to read back: the payment and order it refunds, and the gateway's id for it
export interface RefundLookup {
  providerPaymentId: string;
  providerOrderId: string | null;
  providerRefundId: string;
}

// What a gateway answered a refund with
export interface RefundResult {
  providerRefundId: string;
  status: string;
}

export interface PaymentGatewayTransport {
  readonly code: string;
  readonly credentialFields: readonly string[];
  // The methods its page takes, in the order the hosted checkout page offers them
  readonly methods: readonly PaymentMethodCode[];
  readonly split?: GatewaySplitCapability;
  verifyCredentials(credentials: Record<string, string>): Promise<VerifyCredentialsResult>;
  createOrder(credentials: Record<string, string>, input: CreateOrderInput): Promise<CreateOrderResult>;
  fetchPayment(credentials: Record<string, string>, providerPaymentId: string): Promise<NormalizedPayment>;
  // Returns a captured payment's money, whole or in part; a gateway without it cannot refund through the platform yet
  refundPayment?(credentials: Record<string, string>, request: RefundRequest): Promise<RefundResult>;
  // Reads one refund back, for a refund whose webhook never arrived. A gateway without it leaves the refund pending
  fetchRefund?(credentials: Record<string, string>, lookup: RefundLookup): Promise<NormalizedRefund>;
  verifyCheckoutSignature(credentials: Record<string, string>, input: VerifyCheckoutSignatureInput): boolean;
  // Reads an order's payment back from the gateway, null while it has none. A gateway with it completes a browser
  // return by this server-side read alone, so nothing the browser posted is trusted, signature included
  fetchOrderPayment?(credentials: Record<string, string>, providerOrderId: string): Promise<NormalizedPayment | null>;
  verifyWebhook(webhookSecret: string, rawBody: string, headers: Record<string, string>): boolean;
  parseWebhook(rawBody: string, headers: Record<string, string>): NormalizedWebhookEvent[];
}

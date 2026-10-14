import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { PaymentLinkedAccountStatus } from '@/db/schema';

export type ProviderLinkedAccountStatus = Exclude<PaymentLinkedAccountStatus, 'FAILED'>;

export interface LinkedAccountAddressPayload {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface LinkedAccountPayload {
  referenceId: string;
  email: string;
  phone: string;
  legalBusinessName: string;
  businessType: string;
  contactName: string;
  category?: string;
  subcategory?: string;
  address: LinkedAccountAddressPayload;
  pan?: string;
  gst?: string;
  bank: { accountNumber: string; ifscCode: string; beneficiaryName: string };
}

export interface CreateLinkedAccountRequest {
  gatewayCode: string;
  credentials: Record<string, string>;
  account: LinkedAccountPayload;
  // What an earlier attempt already created at the provider, so the setup resumes instead of opening a second account
  resume?: { providerAccountId: string; providerData: Record<string, string> };
}

export interface CreateLinkedAccountResult {
  providerAccountId: string;
  providerData: Record<string, string>;
  status: ProviderLinkedAccountStatus;
  transfersAllowedAt: string | null;
  // Set when the account exists at the provider but a later setup step failed; the ids above are still valid
  setupError: { label: string; detail: string } | null;
}

export interface LinkedAccountStatusRequest {
  gatewayCode: string;
  credentials: Record<string, string>;
  providerAccountId: string;
  providerData: Record<string, string>;
}

export interface LinkedAccountStatusResult {
  status: ProviderLinkedAccountStatus;
  requirements: string[];
}

@Injectable()
export class PaymentLinkedAccountsGatewayService {
  private readonly logger = new Logger(PaymentLinkedAccountsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Has payments-service open a linked account (with its stakeholder and route product) on the collector's gateway
  async createLinkedAccount(request: CreateLinkedAccountRequest): Promise<CreateLinkedAccountResult> {
    this.logger.log(
      `payments.linkedAccounts.create — gateway: ${request.gatewayCode} reference: ${request.account.referenceId}`,
    );
    return this.nats.send<CreateLinkedAccountResult>('payments', 'payments.linkedAccounts.create', request);
  }

  // Asks payments-service for a linked account's current activation status
  async fetchLinkedAccountStatus(request: LinkedAccountStatusRequest): Promise<LinkedAccountStatusResult> {
    this.logger.log(
      `payments.linkedAccounts.status — gateway: ${request.gatewayCode} account: ${request.providerAccountId}`,
    );
    return this.nats.send<LinkedAccountStatusResult>('payments', 'payments.linkedAccounts.status', request);
  }
}

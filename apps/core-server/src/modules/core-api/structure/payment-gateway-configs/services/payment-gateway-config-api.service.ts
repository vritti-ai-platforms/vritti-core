import type { PaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/entity/payment-gateway-config.dto';
import type { CreatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-payment-gateway-config.dto';
import type { CreatePlatformPaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-platform-payment-gateway-config.dto';
import type { UpdatePlatformPaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/update-platform-payment-gateway-config.dto';
import type { PaymentGatewayConfigVerificationResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-config-verification-response.dto';
import type { PaymentGatewayConfigsPageResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-configs-page-response.dto';
import { requiresWebhookVerification } from '@domain/payment-gateway-config/gateway-credential-fields';
import {
  PaymentGatewayConfigDomainService,
  type PaymentGatewayConfigViewer,
} from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { PayoutAccountDomainRepository } from '@domain/payout-account/repositories/payout-account.repository';
import { Injectable } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { BadRequestException, ConflictException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { PaymentGatewayOptionDto } from '@/modules/payments-gateway/gateways/dto/response/payment-gateway-option.dto';
import {
  PaymentGatewaysGatewayService,
  type VerificationPaymentOptions,
} from '@/modules/payments-gateway/gateways/services/payment-gateways-gateway.service';
import { parseTableQueryParam } from '@/utils/parse-table-query';
import type { GetPaymentGatewayConfigsInternalDto } from '../dto/request/get-payment-gateway-configs-internal.dto';
import type {
  WebhookCheckStartedResponseDto,
  WebhookCheckStatusResponseDto,
} from '../dto/response/webhook-check-response.dto';

// A row still referenced elsewhere: 23503 for a plain foreign key, 23001 for one declared ON DELETE RESTRICT — which is
// how payout_accounts points at its gateway config
const PG_REFERENCED_ROW_CODES: ReadonlySet<string> = new Set(['23503', '23001']);

@Injectable()
export class PaymentGatewayConfigService {
  constructor(
    private readonly gatewayConfigService: PaymentGatewayConfigDomainService,
    readonly _payoutAccountRepository: PayoutAccountDomainRepository,
    private readonly paymentGatewaysGatewayService: PaymentGatewaysGatewayService,
  ) {}

  // Lists the gateways payments-service can charge through, for the UI to intersect with the catalog
  async listGateways(): Promise<PaymentGatewayOptionDto[]> {
    return this.paymentGatewaysGatewayService.listGateways();
  }

  // Resolves a table page from the view state cloud serializes; RLS decides which rows the viewer sees
  async findForTableWithQuery(
    viewer: PaymentGatewayConfigViewer,
    query: GetPaymentGatewayConfigsInternalDto,
  ): Promise<PaymentGatewayConfigsPageResponseDto> {
    return this.gatewayConfigService.findForTable(viewer, {
      filters: parseTableQueryParam<TableViewState['filters']>(query.filters, 'filters', []),
      search: parseTableQueryParam<TableViewState['search'] | null>(query.search, 'search', null),
      sort: parseTableQueryParam<TableViewState['sort']>(query.sort, 'sort', []),
      pagination: { limit: query.limit ?? 20, offset: query.offset ?? 0 },
    } as TableViewState);
  }

  // ---- The organization's own gateways ----

  // Lists every gateway the organization can use, its own and Vritti's, for pickers
  async list(): Promise<PaymentGatewayConfigDto[]> {
    return this.gatewayConfigService.list('organization');
  }

  // Connects one of the organization's own gateways
  // The keys are checked with the gateway first; a config is saved only once they pass
  async create(orgId: string, dto: CreatePaymentGatewayConfigDto): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    const keysVerifiedAt = await this.verifyKeys(dto.gatewayCode, dto.credentials);
    return this.gatewayConfigService.create(orgId, dto, keysVerifiedAt);
  }

  // Returns one gateway the organization can see
  async findById(id: string): Promise<PaymentGatewayConfigDto> {
    return this.gatewayConfigService.findById('organization', id);
  }

  // Removes an own gateway; the guard read carries its payout account count
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.gatewayConfigService.requireWritable('organization', id);
    try {
      return await this.gatewayConfigService.delete(existing);
    } catch (error: unknown) {
      // A payout account added after the count was read still holds the foreign key
      if (isForeignKeyViolation(error)) throw gatewayInUse('Payout accounts pay out through this gateway.');
      throw error;
    }
  }

  // Has the provider check an own gateway's credentials
  async verify(id: string): Promise<PaymentGatewayConfigVerificationResponseDto> {
    const existing = await this.gatewayConfigService.requireWritable('organization', id);
    return this.paymentGatewaysGatewayService.verifyConfig(existing);
  }

  // Opens the ₹10 verification payment on an own gateway that signs webhooks with its own secret, once its keys pass
  async startWebhookCheck(
    orgId: string,
    id: string,
    options: VerificationPaymentOptions = {},
  ): Promise<WebhookCheckStartedResponseDto> {
    const existing = await this.gatewayConfigService.requireWritable('organization', id);
    if (!requiresWebhookVerification(existing.gatewayCode)) {
      throw new BadRequestException({
        label: 'No Webhook Check Needed',
        detail: `${existing.gatewayCode} receives its webhook URL on every payment, so there is nothing to verify.`,
      });
    }
    if (!existing.verifiedAt) {
      throw new BadRequestException({
        label: 'Keys Not Verified',
        detail: 'Save the gateway with keys the gateway accepts before checking its webhook.',
      });
    }
    if (existing.webhookVerifiedAt) {
      throw new ConflictException({
        label: 'Webhook Already Verified',
        detail: 'This gateway’s webhook is already verified.',
      });
    }
    return this.paymentGatewaysGatewayService.startWebhookCheck(orgId, existing, options);
  }

  // Where a verification payment stands, for the dialog waiting on its outcome
  async findWebhookCheck(id: string, paymentIntentId: string): Promise<WebhookCheckStatusResponseDto> {
    const existing = await this.gatewayConfigService.requireWritable('organization', id);
    return this.paymentGatewaysGatewayService.findWebhookCheck(existing, paymentIntentId);
  }

  // ---- Platform gateways — Vritti's accounts on this deployment. Called with no organization scope ----

  // Lists Vritti's gateways on the deployment
  async listPlatform(): Promise<PaymentGatewayConfigDto[]> {
    return this.gatewayConfigService.list('platform');
  }

  // Sets up one of Vritti's gateways, which must split since Vritti pays each organization its share
  async createPlatform(
    dto: CreatePlatformPaymentGatewayConfigDto,
  ): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    if (!(await this.paymentGatewaysGatewayService.supportsSplit(dto.gatewayCode))) {
      throw new BadRequestException({
        label: 'Split Payments Required',
        detail:
          "Vritti's gateways pay each organization its share, so they need a gateway that can split payments. This one cannot.",
        errors: [{ field: 'gatewayCode', message: 'Cannot split payments' }],
      });
    }
    const keysVerifiedAt = await this.verifyKeys(dto.gatewayCode, dto.credentials);
    return this.gatewayConfigService.createPlatform(dto, keysVerifiedAt);
  }

  // Updates a platform row; its gateway never changes, since organizations' payout accounts exist only there
  async updatePlatform(id: string, dto: UpdatePlatformPaymentGatewayConfigDto): Promise<SuccessResponseDto> {
    const existing = await this.gatewayConfigService.requireWritable('platform', id);
    if (dto.gatewayCode !== undefined && dto.gatewayCode !== existing.gatewayCode) {
      throw new ConflictException({
        label: 'Gateway Cannot Change',
        detail:
          'Payout accounts registered under this gateway only exist at that gateway. Remove this row and set up a new one to switch.',
        errors: [{ field: 'gatewayCode', message: 'Cannot change once set up' }],
      });
    }
    const keysVerifiedAt =
      dto.credentials !== undefined ? await this.verifyKeys(existing.gatewayCode, dto.credentials) : undefined;
    return this.gatewayConfigService.updatePlatform(existing, dto, keysVerifiedAt);
  }

  // Validates the submitted credential fields for the gateway, then has the gateway itself accept them
  private verifyKeys(gatewayCode: string, credentials: Record<string, string>): Promise<Date> {
    return this.paymentGatewaysGatewayService.verifyCredentials(
      gatewayCode,
      this.gatewayConfigService.prepareCredentials(gatewayCode, credentials),
    );
  }

  // Has the provider check a platform row's credentials
  async verifyPlatform(id: string): Promise<PaymentGatewayConfigVerificationResponseDto> {
    const existing = await this.gatewayConfigService.requireWritable('platform', id);
    return this.paymentGatewaysGatewayService.verifyConfig(existing);
  }

  // Removes a platform row; organizations' payout accounts are invisible here, so the foreign key is the only guard
  async deletePlatform(id: string): Promise<SuccessResponseDto> {
    const existing = await this.gatewayConfigService.requireWritable('platform', id);
    try {
      return await this.gatewayConfigService.delete(existing);
    } catch (error: unknown) {
      if (isForeignKeyViolation(error)) {
        throw gatewayInUse("Organizations' payout accounts pay out through this Vritti gateway.");
      }
      throw error;
    }
  }
}

// Builds the 409 for a gateway payout accounts still pay out through
function gatewayInUse(who: string): ConflictException {
  return new ConflictException({
    label: 'Gateway In Use',
    detail: `${who} Remove those payout accounts before deleting it.`,
  });
}

// Detects a Postgres foreign-key violation, however deep the driver wrapped it
function isForeignKeyViolation(error: unknown, depth = 0): boolean {
  if (!error || typeof error !== 'object' || depth > 5) return false;
  const candidate = error as { code?: unknown; cause?: unknown };
  if (typeof candidate.code === 'string' && PG_REFERENCED_ROW_CODES.has(candidate.code)) return true;
  return isForeignKeyViolation(candidate.cause, depth + 1);
}

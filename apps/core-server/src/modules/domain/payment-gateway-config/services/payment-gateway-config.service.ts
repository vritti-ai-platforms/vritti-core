import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and, eq } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type PaymentGatewayConfig, type PaymentGatewayConfigType, paymentGatewayConfigs } from '@/db/schema';
import { PaymentCredentialsCryptoService } from '@/services/payment-credentials-crypto.service';
import { PaymentGatewayConfigDto } from '../dto/entity/payment-gateway-config.dto';
import type { CreatePaymentGatewayConfigDto } from '../dto/request/create-payment-gateway-config.dto';
import type { UpdatePaymentGatewayConfigDto } from '../dto/request/update-payment-gateway-config.dto';
import type { PaymentGatewayConfigVerificationResponseDto } from '../dto/response/payment-gateway-config-verification-response.dto';
import type { PaymentGatewayConfigsPageResponseDto } from '../dto/response/payment-gateway-configs-page-response.dto';
import { GATEWAY_CREDENTIAL_FIELDS, isSupportedGateway } from '../gateway-credential-fields';
import type { PaymentGatewayConfigContext } from '../payment-gateway-config-context';
import type { PaymentGatewayConfigScope } from '../payment-gateway-config-scope';
import { PaymentGatewayConfigDomainRepository } from '../repositories/payment-gateway-config.repository';

export interface DecryptedPaymentGatewayCredentials {
  gatewayCode: string;
  keyId: string;
  credentials: Record<string, string>;
  webhookSecret: string | null;
}

export interface PaymentWebhookTarget {
  id: string;
  organizationId: string;
  gatewayCode: string;
  webhookSecret: string | null;
}

interface ValidatedCredentials {
  keyId: string;
  credentials: Record<string, string>;
}

@Injectable()
export class PaymentGatewayConfigDomainService {
  private readonly logger = new Logger(PaymentGatewayConfigDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    legalEntityId: { column: paymentGatewayConfigs.legalEntityId, type: 'string' },
    bankAccountId: { column: paymentGatewayConfigs.bankAccountId, type: 'string' },
    siteId: { column: paymentGatewayConfigs.siteId, type: 'string' },
    appId: { column: paymentGatewayConfigs.appId, type: 'string' },
    type: { column: paymentGatewayConfigs.type, type: 'string' },
    gatewayCode: { column: paymentGatewayConfigs.gatewayCode, type: 'string' },
    label: { column: paymentGatewayConfigs.label, type: 'string' },
    keyId: { column: paymentGatewayConfigs.keyId, type: 'string' },
    providerMerchantId: { column: paymentGatewayConfigs.providerMerchantId, type: 'string' },
    splitEnabled: { column: paymentGatewayConfigs.splitEnabled, type: 'boolean' },
    verifiedAt: { column: paymentGatewayConfigs.verifiedAt, type: 'string' },
    createdAt: { column: paymentGatewayConfigs.createdAt, type: 'string' },
  };

  constructor(
    private readonly configRepository: PaymentGatewayConfigDomainRepository,
    private readonly crypto: PaymentCredentialsCryptoService,
  ) {}

  // Returns a page of the organization's configs for the data table
  async findForTable(orgId: string, state: TableViewState): Promise<PaymentGatewayConfigsPageResponseDto> {
    const { filters, search, sort, pagination } = state;
    const where = and(
      eq(paymentGatewayConfigs.organizationId, orgId),
      FilterProcessor.buildWhere(filters, PaymentGatewayConfigDomainService.FIELD_MAP),
      FilterProcessor.buildSearch(search, PaymentGatewayConfigDomainService.FIELD_MAP),
    );
    const orderBy = FilterProcessor.buildOrderBy(sort, PaymentGatewayConfigDomainService.FIELD_MAP);

    const { result, count } = await this.configRepository.findForTable({
      where,
      orderBy,
      limit: pagination.limit,
      offset: pagination.offset,
    });

    this.logger.log(`Fetched payment gateway configs table for org ${orgId} (${count} results)`);
    return { result: result.map(PaymentGatewayConfigDto.from), count };
  }

  // Lists a legal entity's configs
  async listByLegalEntity(orgId: string, legalEntityId: string): Promise<PaymentGatewayConfigDto[]> {
    const rows = await this.configRepository.findByLegalEntity(orgId, legalEntityId);
    return rows.map(PaymentGatewayConfigDto.from);
  }

  // Lists the configs that settle into one bank account
  async listByBankAccount(orgId: string, bankAccountId: string): Promise<PaymentGatewayConfigDto[]> {
    const rows = await this.configRepository.findByBankAccount(orgId, bankAccountId);
    return rows.map(PaymentGatewayConfigDto.from);
  }

  // Returns a single config
  async findById(orgId: string, id: string, scope?: PaymentGatewayConfigScope): Promise<PaymentGatewayConfigDto> {
    return PaymentGatewayConfigDto.from(await this.requireInScope(orgId, id, scope));
  }

  // Creates a config after validating the credential set and confirming the scope is free
  async create(orgId: string, dto: CreatePaymentGatewayConfigDto): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    const validated = this.validateCredentials(dto.gatewayCode, dto.credentials);
    const siteId = dto.siteId ?? null;
    const appId = dto.appId ?? null;
    await this.assertSlotFree(dto.legalEntityId, dto.type, siteId, appId);

    const row = await this.configRepository.create({
      organizationId: orgId,
      legalEntityId: dto.legalEntityId,
      type: dto.type,
      siteId,
      appId,
      gatewayCode: dto.gatewayCode,
      bankAccountId: dto.bankAccountId,
      label: dto.label ?? null,
      keyId: validated.keyId,
      credentials: this.crypto.encrypt(JSON.stringify(validated.credentials)),
      webhookSecret: dto.webhookSecret ? this.crypto.encrypt(dto.webhookSecret) : null,
      providerMerchantId: dto.providerMerchantId ?? null,
      splitEnabled: dto.splitEnabled ?? false,
    });

    this.logger.log(
      `Created payment gateway config ${row.id} (${row.gatewayCode}) for legal entity ${row.legalEntityId}`,
    );
    return {
      success: true,
      message: `Payment gateway config "${displayName(row)}" created successfully.`,
      data: PaymentGatewayConfigDto.from(row),
    };
  }

  // Updates a config; new credentials are re-validated and re-encrypted, absent ones are kept as stored.
  async update(
    orgId: string,
    id: string,
    dto: UpdatePaymentGatewayConfigDto,
    scope?: PaymentGatewayConfigScope,
  ): Promise<SuccessResponseDto> {
    const existing = await this.requireInScope(orgId, id, scope);

    const type = dto.type ?? existing.type;
    const gatewayCode = dto.gatewayCode ?? existing.gatewayCode;
    const siteId = dto.siteId === undefined ? existing.siteId : dto.siteId;
    const appId = dto.appId === undefined ? existing.appId : dto.appId;

    // A changed gateway invalidates the stored credential set, so it must arrive with a new one
    if (gatewayCode !== existing.gatewayCode && dto.credentials === undefined) {
      throw new BadRequestException({
        label: 'Credentials Required',
        detail: 'Changing the gateway replaces the credential fields, so send the new credentials with it.',
        errors: [{ field: 'credentials', message: 'Required when the gateway changes' }],
      });
    }

    const validated = dto.credentials !== undefined ? this.validateCredentials(gatewayCode, dto.credentials) : null;
    const gatewayChanged = gatewayCode !== existing.gatewayCode;

    const slotChanged = type !== existing.type || siteId !== existing.siteId || appId !== existing.appId;
    if (slotChanged) {
      await this.assertSlotFree(existing.legalEntityId, type, siteId, appId, existing.id);
    }

    const row = await this.configRepository.update(id, {
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.siteId !== undefined && { siteId: dto.siteId }),
      ...(dto.appId !== undefined && { appId: dto.appId }),
      ...(dto.gatewayCode !== undefined && { gatewayCode: dto.gatewayCode }),
      ...(dto.label !== undefined && { label: dto.label }),
      ...(dto.splitEnabled !== undefined && { splitEnabled: dto.splitEnabled }),
      ...(gatewayChanged && { providerMerchantId: null, webhookSecret: null }),
      ...(dto.providerMerchantId !== undefined && { providerMerchantId: dto.providerMerchantId }),
      ...(validated && {
        keyId: validated.keyId,
        credentials: this.crypto.encrypt(JSON.stringify(validated.credentials)),
        verifiedAt: null,
      }),
      ...(dto.webhookSecret !== undefined && {
        webhookSecret: dto.webhookSecret ? this.crypto.encrypt(dto.webhookSecret) : null,
      }),
    });

    this.logger.log(
      `Updated payment gateway config ${id}${validated ? ' with new credentials; verification cleared' : ''}`,
    );
    return { success: true, message: `Payment gateway config "${displayName(row)}" updated successfully.` };
  }

  // Deletes a config
  async delete(orgId: string, id: string, scope?: PaymentGatewayConfigScope): Promise<SuccessResponseDto> {
    const existing = await this.requireInScope(orgId, id, scope);
    await this.configRepository.delete(id);

    this.logger.log(`Deleted payment gateway config ${id}`);
    return { success: true, message: `Payment gateway config "${displayName(existing)}" deleted successfully.` };
  }

  // Decrypts a config's secrets for a payment caller; never exposed over HTTP
  async getDecryptedCredentials(orgId: string, id: string): Promise<DecryptedPaymentGatewayCredentials> {
    const row = await this.requireInOrg(orgId, id);
    return {
      gatewayCode: row.gatewayCode,
      keyId: row.keyId,
      credentials: JSON.parse(this.crypto.decrypt(row.credentials)) as Record<string, string>,
      webhookSecret: row.webhookSecret ? this.crypto.decrypt(row.webhookSecret) : null,
    };
  }

  // Records a provider check that passed, taking the merchant id it reported and keeping the stored one otherwise
  async markVerified(
    orgId: string,
    id: string,
    providerMerchantId: string | null,
  ): Promise<PaymentGatewayConfigVerificationResponseDto> {
    await this.requireInOrg(orgId, id);
    const verifiedAt = new Date();
    const row = await this.configRepository.update(id, {
      verifiedAt,
      ...(providerMerchantId !== null && { providerMerchantId }),
    });

    this.logger.log(
      `Verified payment gateway config ${id}${providerMerchantId ? ` (merchant ${providerMerchantId})` : ''}`,
    );
    return {
      success: true,
      message: `Payment gateway config "${displayName(row)}" verified successfully.`,
      data: { verifiedAt: verifiedAt.toISOString(), providerMerchantId: row.providerMerchantId ?? null },
    };
  }

  // Picks the config a payment routes through: outlet + app, then outlet, then app, then the legal entity default
  async resolveForContext(orgId: string, context: PaymentGatewayConfigContext): Promise<PaymentGatewayConfig | null> {
    const candidates = await this.configRepository.findCandidatesForContext(orgId, context);

    // Candidates arrive newest first, so a strict comparison keeps the newest of equally specific configs
    let best: PaymentGatewayConfig | null = null;
    for (const candidate of candidates) {
      if (!best || specificity(candidate) > specificity(best)) best = candidate;
    }
    return best;
  }

  // Resolves what a public webhook needs to be authenticated and forwarded.
  async findWebhookTarget(orgId: string, id: string): Promise<PaymentWebhookTarget | undefined> {
    const row = await this.configRepository.findById(id);
    if (!row || row.organizationId !== orgId) return undefined;
    return {
      id: row.id,
      organizationId: row.organizationId,
      gatewayCode: row.gatewayCode,
      webhookSecret: row.webhookSecret ? this.crypto.decrypt(row.webhookSecret) : null,
    };
  }

  // Loads the config, hiding rows that belong to another organization behind the same 404
  private async requireInOrg(orgId: string, id: string): Promise<PaymentGatewayConfig> {
    return this.requireInScope(orgId, id);
  }

  // Loads the config, hiding rows outside the organization or the caller's legal entity / bank account behind a 404
  private async requireInScope(
    orgId: string,
    id: string,
    scope?: PaymentGatewayConfigScope,
  ): Promise<PaymentGatewayConfig> {
    const row = await this.configRepository.findById(id);
    if (
      !row ||
      row.organizationId !== orgId ||
      (scope?.legalEntityId !== undefined && row.legalEntityId !== scope.legalEntityId) ||
      (scope?.bankAccountId !== undefined && row.bankAccountId !== scope.bankAccountId)
    ) {
      throw new NotFoundException('Payment gateway config not found.');
    }
    return row;
  }

  // Checks the credential set matches the gateway's field list exactly and derives the key id from it
  private validateCredentials(gatewayCode: string, credentials: Record<string, string>): ValidatedCredentials {
    if (!isSupportedGateway(gatewayCode)) {
      throw new BadRequestException({
        label: 'Unsupported Gateway',
        detail: `Supported gateways are ${Object.keys(GATEWAY_CREDENTIAL_FIELDS).join(', ')}.`,
        errors: [{ field: 'gatewayCode', message: 'Unsupported gateway' }],
      });
    }

    const spec = GATEWAY_CREDENTIAL_FIELDS[gatewayCode];
    const expected: readonly string[] = spec.fields;
    const clean: Record<string, string> = {};
    const errors: { field: string; message: string }[] = [];

    for (const field of expected) {
      const value = credentials[field];
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push({ field: `credentials.${field}`, message: 'Required' });
      } else {
        clean[field] = value.trim();
      }
    }
    for (const field of Object.keys(credentials)) {
      if (!expected.includes(field))
        errors.push({ field: `credentials.${field}`, message: 'Not a field of this gateway' });
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        label: 'Invalid Credentials',
        detail: `${gatewayCode} needs exactly these fields: ${expected.join(', ')}.`,
        errors,
      });
    }

    return { keyId: clean[spec.keyIdField], credentials: clean };
  }

  // Rejects a slot (legal entity, type, site, app) another config already occupies.
  private async assertSlotFree(
    legalEntityId: string,
    type: PaymentGatewayConfigType,
    siteId: string | null,
    appId: string | null,
    excludeId?: string,
  ): Promise<void> {
    const occupant = await this.configRepository.findSlotOccupant(legalEntityId, type, siteId, appId, excludeId);
    if (occupant) {
      throw new ConflictException({
        label: 'Slot Already Configured',
        detail: `This ${scopeName(siteId, appId)} already routes ${type} payments through ${displayName(occupant)}. Change or remove that configuration first.`,
        errors: [{ field: 'gatewayCode', message: 'Already configured for this scope' }],
      });
    }
  }
}

// Shows the label when set, otherwise the gateway code
function displayName(row: Pick<PaymentGatewayConfig, 'label' | 'gatewayCode'>): string {
  return row.label ?? row.gatewayCode;
}

// Names the narrowest scope a config is pinned to
function scopeName(siteId: string | null, appId: string | null): string {
  if (siteId && appId) return 'outlet and app';
  if (siteId) return 'outlet';
  if (appId) return 'app';
  return 'legal entity';
}

// Ranks how narrowly a config is pinned: a site outranks an app, and both outrank the legal entity default
function specificity(row: Pick<PaymentGatewayConfig, 'siteId' | 'appId'>): number {
  return (row.siteId ? 2 : 0) + (row.appId ? 1 : 0);
}

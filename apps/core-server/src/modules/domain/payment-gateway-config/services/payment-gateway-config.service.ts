import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and } from '@vritti/api-sdk/drizzle-orm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type PaymentGatewayConfig, PaymentGatewayConfigKindValues, paymentGatewayConfigs } from '@/db/schema';
import { PaymentCredentialsCryptoService } from '@/services/payment-credentials-crypto.service';
import { PaymentGatewayConfigDto } from '../dto/entity/payment-gateway-config.dto';
import type { CreatePaymentGatewayConfigDto } from '../dto/request/create-payment-gateway-config.dto';
import type { CreatePlatformPaymentGatewayConfigDto } from '../dto/request/create-platform-payment-gateway-config.dto';
import type { UpdatePaymentGatewayConfigDto } from '../dto/request/update-payment-gateway-config.dto';
import type { UpdatePlatformPaymentGatewayConfigDto } from '../dto/request/update-platform-payment-gateway-config.dto';
import type { PaymentGatewayConfigVerificationResponseDto } from '../dto/response/payment-gateway-config-verification-response.dto';
import type { PaymentGatewayConfigsPageResponseDto } from '../dto/response/payment-gateway-configs-page-response.dto';
import {
  GATEWAY_CREDENTIAL_FIELDS,
  isSupportedGateway,
  requiresWebhookSecret,
  webhookSigningCredential,
} from '../gateway-credential-fields';
import {
  type PaymentGatewayConfigDetail,
  PaymentGatewayConfigDomainRepository,
  type PaymentGatewayConfigGroup,
} from '../repositories/payment-gateway-config.repository';

export interface DecryptedPaymentGatewayCredentials {
  gatewayCode: string;
  keyId: string;
  // The main account at the gateway — for Easebuzz the main split label
  gatewayAccountId: string;
  credentials: Record<string, string>;
  webhookSecret: string | null;
}

export interface PaymentWebhookTarget {
  id: string;
  organizationId: string | null;
  gatewayCode: string;
  webhookSecret: string | null;
}

interface ValidatedCredentials {
  keyId: string;
  credentials: Record<string, string>;
}

export type PaymentGatewayConfigViewer = 'organization' | 'platform';

@Injectable()
export class PaymentGatewayConfigDomainService {
  private readonly logger = new Logger(PaymentGatewayConfigDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    gatewayCode: { column: paymentGatewayConfigs.gatewayCode, type: 'string' },
    kind: { column: paymentGatewayConfigs.kind, type: 'string' },
    keyId: { column: paymentGatewayConfigs.keyId, type: 'string' },
    gatewayAccountId: { column: paymentGatewayConfigs.gatewayAccountId, type: 'string' },
    platformFeeBps: { column: paymentGatewayConfigs.platformFeeBps, type: 'number' },
    verifiedAt: { column: paymentGatewayConfigs.verifiedAt, type: 'string' },
    createdAt: { column: paymentGatewayConfigs.createdAt, type: 'string' },
  };

  constructor(
    private readonly configRepository: PaymentGatewayConfigDomainRepository,
    private readonly crypto: PaymentCredentialsCryptoService,
  ) {}

  // Lists every config RLS lets the caller see, newest first
  async list(viewer: PaymentGatewayConfigViewer): Promise<PaymentGatewayConfigDto[]> {
    const rows = await this.configRepository.findAll();
    return rows.map((row) => PaymentGatewayConfigDto.from(row, { tenantView: viewer === 'organization' }));
  }

  // Returns a page of the configs the caller may see for the data table
  async findForTable(
    viewer: PaymentGatewayConfigViewer,
    state: TableViewState,
  ): Promise<PaymentGatewayConfigsPageResponseDto> {
    const { filters, search, sort, pagination } = state;
    const fieldMap = PaymentGatewayConfigDomainService.FIELD_MAP;
    const { result, count } = await this.configRepository.findForTable({
      where: and(FilterProcessor.buildWhere(filters, fieldMap), FilterProcessor.buildSearch(search, fieldMap)),
      orderBy: FilterProcessor.buildOrderBy(sort, fieldMap),
      limit: pagination.limit,
      offset: pagination.offset,
    });

    this.logger.log(`Fetched payment gateway configs table for ${viewer} (${count} results)`);
    return {
      result: result.map((row) => PaymentGatewayConfigDto.from(row, { tenantView: viewer === 'organization' })),
      count,
    };
  }

  // Returns a single config RLS lets the caller see, Vritti's key id withheld from an organization
  async findById(viewer: PaymentGatewayConfigViewer, id: string): Promise<PaymentGatewayConfigDto> {
    return PaymentGatewayConfigDto.from(await this.require(id), { tenantView: viewer === 'organization' });
  }

  // Connects one of the organization's own gateways, whose keys the caller has just had the gateway verify
  async create(
    orgId: string,
    dto: CreatePaymentGatewayConfigDto,
    keysVerifiedAt: Date,
  ): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    const row = await this.insert(orgId, PaymentGatewayConfigKindValues.ORG, dto, { verifiedAt: keysVerifiedAt });
    this.logger.log(`Connected payment gateway config ${row.id} (${row.gatewayCode}) for org ${orgId}`);
    return {
      success: true,
      message: `Payment gateway ${row.gatewayCode} connected successfully.`,
      data: PaymentGatewayConfigDto.from(row),
    };
  }

  // Sets up one of Vritti's gateways on this deployment
  async createPlatform(
    dto: CreatePlatformPaymentGatewayConfigDto,
    keysVerifiedAt: Date,
  ): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    const row = await this.insert(null, PaymentGatewayConfigKindValues.PLATFORM, dto, {
      platformFeeBps: dto.platformFeeBps ?? 0,
      verifiedAt: keysVerifiedAt,
    });
    this.logger.log(`Set up platform payment gateway config ${row.id} (${row.gatewayCode})`);
    return {
      success: true,
      message: `Platform payment gateway ${row.gatewayCode} set up successfully.`,
      data: PaymentGatewayConfigDto.from(row),
    };
  }

  // Loads the one row a write guards on, with its payout account count; an organization may not change Vritti's
  async requireWritable(viewer: PaymentGatewayConfigViewer, id: string): Promise<PaymentGatewayConfigDetail> {
    const row = await this.configRepository.findDetailById(id);
    if (!row) throw new NotFoundException('Payment gateway config not found.');
    if (viewer === 'organization' && row.kind !== PaymentGatewayConfigKindValues.ORG) {
      throw new ForbiddenException({
        label: 'Managed By Vritti',
        detail: "Vritti's gateways cannot be changed, verified or removed from here.",
      });
    }
    return row;
  }

  // Updates the guarded own config; new credentials are re-validated and re-encrypted, absent ones kept
  // Updates the guarded platform row: the shared fields plus Vritti's fee
  async updatePlatform(
    existing: PaymentGatewayConfigDetail,
    dto: UpdatePlatformPaymentGatewayConfigDto,
    keysVerifiedAt?: Date,
  ): Promise<SuccessResponseDto> {
    const row = await this.configRepository.update(existing.id, {
      ...(await this.updateFields(existing, dto, keysVerifiedAt)),
      ...(dto.platformFeeBps !== undefined && { platformFeeBps: dto.platformFeeBps }),
    });

    this.logger.log(`Updated platform payment gateway config ${existing.id}`);
    return { success: true, message: `Platform payment gateway ${row.gatewayCode} updated successfully.` };
  }

  // Removes the guarded config, refused while payout accounts the caller can see pay out through it
  async delete(existing: PaymentGatewayConfigDetail): Promise<SuccessResponseDto> {
    if (existing.payoutAccountCount > 0) throw gatewayInUse(existing.payoutAccountCount);
    await this.configRepository.delete(existing.id);

    this.logger.log(`Deleted payment gateway config ${existing.id}`);
    return { success: true, message: `Payment gateway ${existing.gatewayCode} removed successfully.` };
  }

  // Decrypts a config's secrets for a payment caller; never exposed over HTTP
  async getDecryptedCredentials(id: string): Promise<DecryptedPaymentGatewayCredentials> {
    return this.decryptCredentials(await this.require(id));
  }

  // Decrypts the secrets of a row the caller already loaded
  decryptCredentials(row: PaymentGatewayConfig): DecryptedPaymentGatewayCredentials {
    return {
      gatewayCode: row.gatewayCode,
      keyId: row.keyId,
      gatewayAccountId: row.gatewayAccountId,
      credentials: JSON.parse(this.crypto.decrypt(row.credentials)) as Record<string, string>,
      webhookSecret: row.webhookSecret ? this.crypto.decrypt(row.webhookSecret) : null,
    };
  }

  // Records a provider check that passed on the guarded config
  async markVerified(existing: PaymentGatewayConfigDetail): Promise<PaymentGatewayConfigVerificationResponseDto> {
    const verifiedAt = new Date();
    const row = await this.configRepository.update(existing.id, { verifiedAt });

    this.logger.log(`Verified payment gateway config ${existing.id}`);
    return {
      success: true,
      message: `Payment gateway ${row.gatewayCode} verified successfully.`,
      data: { verifiedAt: verifiedAt.toISOString(), gatewayAccountId: row.gatewayAccountId },
    };
  }

  // The credential set a gateway is asked to verify — the submitted fields validated for the gateway, extras dropped
  prepareCredentials(gatewayCode: string, credentials: Record<string, string>): Record<string, string> {
    return this.validateCredentials(gatewayCode, credentials).credentials;
  }

  // Records a webhook that arrived at the config's URL with a valid signature: the first one proves the URL and secret
  // registered at the gateway, every one marks the webhook as still alive
  async markWebhookReceived(configId: string): Promise<void> {
    const row = await this.configRepository.findById(configId);
    if (!row) return;
    const now = new Date();
    await this.configRepository.update(configId, {
      lastWebhookAt: now,
      ...(row.webhookVerifiedAt ? {} : { webhookVerifiedAt: now }),
    });
    if (!row.webhookVerifiedAt) this.logger.log(`Webhook verified for payment gateway config ${configId}`);
  }

  // Returns what a public webhook needs to be authenticated and forwarded
  async findWebhookTarget(id: string): Promise<PaymentWebhookTarget | undefined> {
    const row = await this.configRepository.findById(id);
    if (!row) return undefined;
    return {
      id: row.id,
      organizationId: row.organizationId,
      gatewayCode: row.gatewayCode,
      webhookSecret: row.webhookSecret ? this.crypto.decrypt(row.webhookSecret) : this.signingCredential(row),
    };
  }

  // Returns the API credential a gateway signs webhooks with, for a config with no webhook secret of its own
  private signingCredential(row: PaymentGatewayConfig): string | null {
    const field = webhookSigningCredential(row.gatewayCode);
    if (!field || !row.credentials) return null;
    const credentials = JSON.parse(this.crypto.decrypt(row.credentials)) as Record<string, string>;
    return credentials[field] || null;
  }

  // Validates and inserts a row into a group after checking the group has no row for the gateway
  private async insert(
    group: PaymentGatewayConfigGroup,
    kind: PaymentGatewayConfig['kind'],
    dto: CreatePaymentGatewayConfigDto,
    extra: Partial<Pick<PaymentGatewayConfig, 'platformFeeBps' | 'verifiedAt'>>,
  ): Promise<PaymentGatewayConfig> {
    const validated = this.validateCredentials(dto.gatewayCode, dto.credentials);
    assertWebhookSecret(dto.gatewayCode, Boolean(dto.webhookSecret));
    await this.assertNoConflicts(group, dto.gatewayCode);

    return this.configRepository.create({
      organizationId: group,
      kind,
      gatewayCode: dto.gatewayCode,
      keyId: validated.keyId,
      credentials: this.crypto.encrypt(JSON.stringify(validated.credentials)),
      webhookSecret: dto.webhookSecret ? this.crypto.encrypt(dto.webhookSecret) : null,
      gatewayAccountId: dto.gatewayAccountId,
      logoLightUrl: dto.logoLightUrl ?? null,
      logoDarkUrl: dto.logoDarkUrl ?? null,
      ...extra,
    });
  }

  // Builds the columns an update writes; a changed gateway must bring new credentials and drops the old one's
  private async updateFields(
    existing: PaymentGatewayConfig,
    dto: UpdatePaymentGatewayConfigDto,
    keysVerifiedAt?: Date,
  ): Promise<Partial<PaymentGatewayConfig>> {
    const gatewayCode = dto.gatewayCode ?? existing.gatewayCode;
    const gatewayChanged = gatewayCode !== existing.gatewayCode;
    if (gatewayChanged && dto.credentials === undefined) {
      throw new BadRequestException({
        label: 'Credentials Required',
        detail: 'Changing the gateway replaces the credential fields, so send the new credentials with it.',
        errors: [{ field: 'credentials', message: 'Required when the gateway changes' }],
      });
    }
    const validated = dto.credentials !== undefined ? this.validateCredentials(gatewayCode, dto.credentials) : null;
    if (validated && !keysVerifiedAt) {
      throw new BadRequestException({
        label: 'Credentials Not Verified',
        detail: 'New credentials are saved only after the gateway has verified them.',
        errors: [{ field: 'credentials', message: 'Not verified' }],
      });
    }
    if (gatewayChanged) await this.assertNoConflicts(existing.organizationId, gatewayCode, existing.id);

    // A switched gateway drops the old secret; otherwise the one sent, or the one on file
    const secretAfter =
      dto.webhookSecret !== undefined ? Boolean(dto.webhookSecret) : !gatewayChanged && existing.webhookSecret !== null;
    assertWebhookSecret(gatewayCode, secretAfter);
    // The webhook proof stands for one URL, secret and account; any of them changing needs a fresh signed webhook
    const webhookProofLost = gatewayChanged || validated !== null || dto.webhookSecret !== undefined;

    return {
      ...(dto.gatewayCode !== undefined && { gatewayCode: dto.gatewayCode }),
      ...(gatewayChanged && { webhookSecret: null, logoLightUrl: null, logoDarkUrl: null }),
      ...(dto.logoLightUrl !== undefined && { logoLightUrl: dto.logoLightUrl }),
      ...(dto.logoDarkUrl !== undefined && { logoDarkUrl: dto.logoDarkUrl }),
      ...(dto.gatewayAccountId !== undefined && { gatewayAccountId: dto.gatewayAccountId }),
      ...(validated && {
        keyId: validated.keyId,
        credentials: this.crypto.encrypt(JSON.stringify(validated.credentials)),
        verifiedAt: keysVerifiedAt,
      }),
      ...(webhookProofLost && { webhookVerifiedAt: null }),
      ...(dto.webhookSecret !== undefined && {
        webhookSecret: dto.webhookSecret ? this.crypto.encrypt(dto.webhookSecret) : null,
      }),
    };
  }

  // Refuses a second row for the gateway in the group, on its field
  private async assertNoConflicts(
    group: PaymentGatewayConfigGroup,
    gatewayCode: string,
    excludeId?: string,
  ): Promise<void> {
    const { gatewayCodeTaken } = await this.configRepository.findConflicts(group, gatewayCode, excludeId);
    if (!gatewayCodeTaken) return;
    const owner = group === null ? 'This deployment' : 'This organization';
    throw new ConflictException({
      label: 'Gateway Already Added',
      detail: `${owner} already has a ${gatewayCode} gateway. Change that one instead.`,
      errors: [{ field: 'gatewayCode', message: 'Already added' }],
    });
  }

  // Loads a config RLS lets the caller see, for a 404 rather than a bare failure
  private async require(id: string): Promise<PaymentGatewayConfig> {
    const row = await this.configRepository.findById(id);
    if (!row) throw new NotFoundException('Payment gateway config not found.');
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
}

// Builds the 409 for a gateway payout accounts still pay out through
function gatewayInUse(count: number): ConflictException {
  return new ConflictException({
    label: 'Gateway In Use',
    detail: `${pluralize('payout account', count, true)} ${count === 1 ? 'pays' : 'pay'} out through this gateway. Remove ${count === 1 ? 'it' : 'them'} first.`,
  });
}

// Refuses a config of a gateway that signs webhooks with its own secret when no secret is on it
function assertWebhookSecret(gatewayCode: string, hasSecret: boolean): void {
  if (hasSecret || !requiresWebhookSecret(gatewayCode)) return;
  throw new BadRequestException({
    label: 'Webhook Secret Required',
    detail: `${gatewayCode} signs its webhooks with a secret you set in its dashboard beside the webhook URL. Enter that same secret here.`,
    errors: [{ field: 'webhookSecret', message: 'Required' }],
  });
}

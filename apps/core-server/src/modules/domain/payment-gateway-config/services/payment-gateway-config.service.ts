import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type PaymentGatewayConfig, PaymentGatewayConfigKindValues } from '@/db/schema';
import { PaymentCredentialsCryptoService } from '@/services/payment-credentials-crypto.service';
import { PaymentGatewayConfigDto } from '../dto/entity/payment-gateway-config.dto';
import type { CreatePaymentGatewayConfigDto } from '../dto/request/create-payment-gateway-config.dto';
import type { CreatePlatformPaymentGatewayConfigDto } from '../dto/request/create-platform-payment-gateway-config.dto';
import type { UpdatePaymentGatewayConfigDto } from '../dto/request/update-payment-gateway-config.dto';
import type { UpdatePlatformPaymentGatewayConfigDto } from '../dto/request/update-platform-payment-gateway-config.dto';
import type { PaymentGatewayConfigVerificationResponseDto } from '../dto/response/payment-gateway-config-verification-response.dto';
import { GATEWAY_CREDENTIAL_FIELDS, isSupportedGateway } from '../gateway-credential-fields';
import {
  PaymentGatewayConfigDomainRepository,
  type PaymentGatewayConfigGroup,
} from '../repositories/payment-gateway-config.repository';

export interface DecryptedPaymentGatewayCredentials {
  gatewayCode: string;
  keyId: string;
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

// Who is calling: an organization (its id) or cloud admin acting for the platform (null). An organization sees its
// own ORG rows and every PLATFORM row; the platform caller sees PLATFORM rows only, which the RLS policy also
// guarantees since it runs with no org context
export type PaymentGatewayConfigScope = string | null;

// Collectors: an organization's own gateway accounts (ORG) and Vritti's on this deployment (PLATFORM, no
// organization, managed from cloud admin). A config only names an account — the shopper picks the gateway and the
// payout account of the legal entity, site or app decides where the money goes
@Injectable()
export class PaymentGatewayConfigDomainService {
  private readonly logger = new Logger(PaymentGatewayConfigDomainService.name);

  constructor(
    private readonly configRepository: PaymentGatewayConfigDomainRepository,
    private readonly crypto: PaymentCredentialsCryptoService,
  ) {}

  // Everything an organization may see: its own rows, then Vritti's with the key id withheld
  async list(orgId: string): Promise<PaymentGatewayConfigDto[]> {
    const [own, platform] = await Promise.all([
      this.configRepository.findGroup(orgId),
      this.configRepository.findGroup(null),
    ]);
    return [
      ...own.map((row) => PaymentGatewayConfigDto.from(row)),
      ...platform.map((row) => PaymentGatewayConfigDto.from(row, { tenantView: true })),
    ];
  }

  // The platform rows, as cloud admin sees them
  async listPlatform(): Promise<PaymentGatewayConfigDto[]> {
    const rows = await this.configRepository.findGroup(null);
    return rows.map((row) => PaymentGatewayConfigDto.from(row));
  }

  // Returns a single config the caller may see
  async findById(scope: PaymentGatewayConfigScope, id: string): Promise<PaymentGatewayConfigDto> {
    const row = await this.requireVisible(scope, id);
    return PaymentGatewayConfigDto.from(row, { tenantView: scope !== null });
  }

  // Connects one of the organization's own gateways
  async create(orgId: string, dto: CreatePaymentGatewayConfigDto): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    const row = await this.insert(orgId, PaymentGatewayConfigKindValues.ORG, dto, {});
    this.logger.log(`Connected payment gateway config ${row.id} (${row.gatewayCode}) for org ${orgId}`);
    return {
      success: true,
      message: `Payment gateway "${row.label}" connected successfully.`,
      data: PaymentGatewayConfigDto.from(row),
    };
  }

  // Sets up one of Vritti's gateways on this deployment
  async createPlatform(
    dto: CreatePlatformPaymentGatewayConfigDto,
  ): Promise<CreateResponseDto<PaymentGatewayConfigDto>> {
    const row = await this.insert(null, PaymentGatewayConfigKindValues.PLATFORM, dto, {
      platformFeeBps: dto.platformFeeBps ?? 0,
    });
    this.logger.log(`Set up platform payment gateway config ${row.id} (${row.gatewayCode})`);
    return {
      success: true,
      message: `Platform payment gateway "${row.label}" set up successfully.`,
      data: PaymentGatewayConfigDto.from(row),
    };
  }

  // Updates a config the caller owns; new credentials are re-validated and re-encrypted, absent ones kept
  async update(
    scope: PaymentGatewayConfigScope,
    id: string,
    dto: UpdatePaymentGatewayConfigDto,
  ): Promise<SuccessResponseDto> {
    const existing = await this.requireWritable(scope, id);
    const row = await this.configRepository.update(id, await this.updateFields(existing, dto));

    this.logger.log(
      `Updated payment gateway config ${id}${dto.credentials !== undefined ? ' with new credentials; verification cleared' : ''}`,
    );
    return { success: true, message: `Payment gateway "${row.label}" updated successfully.` };
  }

  // Updates a platform row: the shared fields plus Vritti's fee
  async updatePlatform(id: string, dto: UpdatePlatformPaymentGatewayConfigDto): Promise<SuccessResponseDto> {
    const existing = await this.requireWritable(null, id);
    const row = await this.configRepository.update(id, {
      ...(await this.updateFields(existing, dto)),
      ...(dto.platformFeeBps !== undefined && { platformFeeBps: dto.platformFeeBps }),
    });

    this.logger.log(`Updated platform payment gateway config ${id}`);
    return { success: true, message: `Platform payment gateway "${row.label}" updated successfully.` };
  }

  // Removes a config the caller owns
  async delete(scope: PaymentGatewayConfigScope, id: string): Promise<SuccessResponseDto> {
    const existing = await this.requireWritable(scope, id);
    await this.configRepository.delete(id);

    this.logger.log(`Deleted payment gateway config ${id}`);
    return { success: true, message: `Payment gateway "${existing.label}" removed successfully.` };
  }

  // Decrypts a config's secrets for a payment caller; never exposed over HTTP
  async getDecryptedCredentials(
    scope: PaymentGatewayConfigScope,
    id: string,
  ): Promise<DecryptedPaymentGatewayCredentials> {
    const row = await this.requireVisible(scope, id);
    return {
      gatewayCode: row.gatewayCode,
      keyId: row.keyId,
      credentials: JSON.parse(this.crypto.decrypt(row.credentials)) as Record<string, string>,
      webhookSecret: row.webhookSecret ? this.crypto.decrypt(row.webhookSecret) : null,
    };
  }

  // Records a provider check that passed
  async markVerified(
    scope: PaymentGatewayConfigScope,
    id: string,
  ): Promise<PaymentGatewayConfigVerificationResponseDto> {
    await this.requireWritable(scope, id);
    const verifiedAt = new Date();
    const row = await this.configRepository.update(id, { verifiedAt });

    this.logger.log(`Verified payment gateway config ${id}`);
    return {
      success: true,
      message: `Payment gateway "${row.label}" verified successfully.`,
      data: { verifiedAt: verifiedAt.toISOString(), gatewayAccountId: row.gatewayAccountId },
    };
  }

  // Resolves what a public webhook needs to be authenticated and forwarded
  async findWebhookTarget(orgId: string, id: string): Promise<PaymentWebhookTarget | undefined> {
    const row = await this.configRepository.findById(id);
    if (!row || !isVisibleTo(row, orgId)) return undefined;
    return {
      id: row.id,
      organizationId: row.organizationId,
      gatewayCode: row.gatewayCode,
      webhookSecret: row.webhookSecret ? this.crypto.decrypt(row.webhookSecret) : null,
    };
  }

  // Validates and inserts a row into a group
  private async insert(
    group: PaymentGatewayConfigGroup,
    kind: PaymentGatewayConfig['kind'],
    dto: CreatePaymentGatewayConfigDto,
    extra: Partial<Pick<PaymentGatewayConfig, 'platformFeeBps'>>,
  ): Promise<PaymentGatewayConfig> {
    const validated = this.validateCredentials(dto.gatewayCode, dto.credentials);
    await this.assertLabelFree(group, dto.label);

    return this.configRepository.create({
      organizationId: group,
      kind,
      gatewayCode: dto.gatewayCode,
      label: dto.label,
      keyId: validated.keyId,
      credentials: this.crypto.encrypt(JSON.stringify(validated.credentials)),
      webhookSecret: dto.webhookSecret ? this.crypto.encrypt(dto.webhookSecret) : null,
      gatewayAccountId: dto.gatewayAccountId,
      logoLightUrl: dto.logoLightUrl ?? null,
      logoDarkUrl: dto.logoDarkUrl ?? null,
      ...extra,
    });
  }

  // The columns an update writes: a changed gateway must bring new credentials and drops what belonged to the old one
  private async updateFields(
    existing: PaymentGatewayConfig,
    dto: UpdatePaymentGatewayConfigDto,
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
    if (dto.label !== undefined && dto.label !== existing.label) {
      await this.assertLabelFree(existing.organizationId, dto.label, existing.id);
    }

    return {
      ...(dto.gatewayCode !== undefined && { gatewayCode: dto.gatewayCode }),
      ...(dto.label !== undefined && { label: dto.label }),
      ...(gatewayChanged && { webhookSecret: null, logoLightUrl: null, logoDarkUrl: null }),
      ...(dto.logoLightUrl !== undefined && { logoLightUrl: dto.logoLightUrl }),
      ...(dto.logoDarkUrl !== undefined && { logoDarkUrl: dto.logoDarkUrl }),
      ...(dto.gatewayAccountId !== undefined && { gatewayAccountId: dto.gatewayAccountId }),
      ...(validated && {
        keyId: validated.keyId,
        credentials: this.crypto.encrypt(JSON.stringify(validated.credentials)),
        verifiedAt: null,
      }),
      ...(dto.webhookSecret !== undefined && {
        webhookSecret: dto.webhookSecret ? this.crypto.encrypt(dto.webhookSecret) : null,
      }),
    };
  }

  // Labels tell a group's rows apart, so two rows cannot share one
  private async assertLabelFree(group: PaymentGatewayConfigGroup, label: string, excludeId?: string): Promise<void> {
    const taken = await this.configRepository.findByLabel(group, label, excludeId);
    if (!taken) return;
    throw new ConflictException({
      label: 'Label In Use',
      detail: `"${label}" already names another gateway here. Pick a label that tells them apart.`,
      errors: [{ field: 'label', message: 'Already in use' }],
    });
  }

  // Loads a config the caller may see, hiding the rest behind the same 404
  private async requireVisible(scope: PaymentGatewayConfigScope, id: string): Promise<PaymentGatewayConfig> {
    const row = await this.configRepository.findById(id);
    if (!row || !isVisibleTo(row, scope)) throw new NotFoundException('Payment gateway config not found.');
    return row;
  }

  // Loads a config the caller may change: an organization its own rows, the platform caller the platform rows
  private async requireWritable(scope: PaymentGatewayConfigScope, id: string): Promise<PaymentGatewayConfig> {
    const row = await this.requireVisible(scope, id);
    if (scope !== null && row.kind !== PaymentGatewayConfigKindValues.ORG) {
      throw new ForbiddenException({
        label: 'Managed By Vritti',
        detail: "Vritti's gateways cannot be changed, verified or removed from here.",
      });
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
}

// A PLATFORM row is visible to everyone; an ORG row only to its organization. The platform caller (no org) sees
// PLATFORM rows only
function isVisibleTo(row: PaymentGatewayConfig, scope: PaymentGatewayConfigScope): boolean {
  if (row.kind === PaymentGatewayConfigKindValues.PLATFORM) return true;
  return scope !== null && row.organizationId === scope;
}

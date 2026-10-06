import { randomBytes } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import type { FeatureUnlocks, PlatformBucket } from '@vritti/api-sdk/catalog-resolver';
import { PLATFORMS } from '@vritti/api-sdk/catalog-resolver';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk/select';
import { generateSigningKeyPair } from '@vritti/api-sdk/signing';
import type { App, AppSmsOtpConfig, AppType, AppWhatsappOtpConfig } from '@/db/schema';
import { AppDomainRepository } from '../repositories/app.repository';

// Marks the value in logs and lets secret scanners recognise a leaked client id
const CLIENT_ID_PREFIX = 'vca_';

@Injectable()
export class AppDomainService {
  private readonly logger = new Logger(AppDomainService.name);

  constructor(private readonly repository: AppDomainRepository) {}

  // Options for the app picker, scoped to the caller's organization
  findForSelect(organizationId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findAppsForSelect(organizationId, query);
  }

  // Mints an app and its keypair
  async create(input: {
    organizationId: string;
    name: string;
    type: AppType;
    permissions?: FeatureUnlocks;
  }): Promise<App> {
    const { privateKey, publicKey } = generateSigningKeyPair();

    const app = await this.repository.create({
      organizationId: input.organizationId,
      clientId: `${CLIENT_ID_PREFIX}${randomBytes(16).toString('hex')}`,
      name: input.name.trim(),
      type: input.type,
      signingKey: privateKey,
      signingPublicKey: publicKey,
      // Omitted means an empty grant, which authenticates but can do nothing — a new
      // credential is inert until someone says what it is for.
      permissions: sanitizeGrants(input.permissions ?? {}),
    });

    this.logger.log(`Created ${input.type} app ${app.clientId} for org ${input.organizationId}`);
    return app;
  }

  listForOrg(organizationId: string): Promise<App[]> {
    return this.repository.findAllByOrg(organizationId);
  }

  findInOrg(id: string, organizationId: string): Promise<App | undefined> {
    return this.repository.findByIdInOrg(id, organizationId);
  }

  // Replaces the keypair, keeping the client id so a caller swaps one value
  async rotate(id: string): Promise<App> {
    const { privateKey, publicKey } = generateSigningKeyPair();
    const app = await this.repository.rotateKeys(id, privateKey, publicKey);
    this.logger.log(`Rotated keys for app ${app.clientId}`);
    return app;
  }

  async setActive(id: string, isActive: boolean): Promise<App> {
    return this.repository.update(id, { isActive });
  }

  // Stores which WhatsApp sender and template this credential issues sign-in codes with
  async setOtpConfig(id: string, whatsappOtpConfig: AppWhatsappOtpConfig | null): Promise<App> {
    const app = await this.repository.update(id, { whatsappOtpConfig });
    this.logger.log(`${whatsappOtpConfig ? 'Configured' : 'Cleared'} OTP for app ${app.clientId}`);
    return app;
  }

  // Stores which SMS provider and code policy this credential issues sign-in codes with
  async setSmsOtpConfig(id: string, smsOtpConfig: AppSmsOtpConfig | null): Promise<App> {
    const app = await this.repository.update(id, { smsOtpConfig });
    this.logger.log(`${smsOtpConfig ? 'Configured' : 'Cleared'} SMS OTP for app ${app.clientId}`);
    return app;
  }

  // The app a delivery callback belongs to, found by the sender it was configured with
  findByOtpPhoneNumber(phoneNumberId: string): Promise<App | undefined> {
    return this.repository.findByOtpPhoneNumber(phoneNumberId);
  }

  // Apps that would be left unable to send if a WhatsApp account were disconnected
  findByOtpAccount(organizationId: string, accountId: string): Promise<App[]> {
    return this.repository.findByOtpAccount(organizationId, accountId);
  }

  async rename(id: string, name: string): Promise<App> {
    return this.repository.update(id, { name: name.trim() });
  }

  // Replaces what the credential may do
  async setPermissions(id: string, permissions: FeatureUnlocks): Promise<App> {
    const app = await this.repository.update(id, { permissions: sanitizeGrants(permissions) });
    this.logger.log(`Set permissions on app ${app.clientId}: ${Object.keys(app.permissions).join(', ') || 'none'}`);
    return app;
  }

  // Removes the credential outright
  async delete(app: App): Promise<void> {
    await this.repository.deleteById(app.id);
    this.logger.log(`Deleted app ${app.clientId}`);
  }

  // Resolves a presented client id
  findByClientId(clientId: string): Promise<App | undefined> {
    return this.repository.findByClientId(clientId);
  }

  // Stamps usage after a request verifies
  touchLastUsed(appId: string): void {
    void this.repository.touchLastUsed(appId).catch(() => undefined);
  }
}

// Keeps only what `FeatureUnlocks` allows: feature codes mapping to per-platform arrays of action codes
function sanitizeGrants(grants: FeatureUnlocks): FeatureUnlocks {
  const clean: FeatureUnlocks = {};
  for (const [featureCode, platforms] of Object.entries(grants ?? {})) {
    if (!platforms || typeof platforms !== 'object') continue;
    const entry: Partial<Record<PlatformBucket, string[]>> = {};
    for (const platform of PLATFORMS) {
      const codes = platforms[platform];
      if (!Array.isArray(codes)) continue;
      entry[platform] = [...new Set(codes.filter((code): code is string => typeof code === 'string'))];
    }
    // Checked across every bucket — naming web/mobile here silently discarded app-only grants,
    // which is the only shape the credential permission editor actually sends
    if (PLATFORMS.some((platform) => entry[platform] !== undefined)) clean[featureCode] = entry;
  }
  return clean;
}

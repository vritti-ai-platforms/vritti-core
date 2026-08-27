import { randomBytes } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import type { FeatureUnlocks, PlatformBucket } from '@vritti/api-sdk/catalog-resolver';
import { PLATFORMS } from '@vritti/api-sdk/catalog-resolver';
import { generateSigningKeyPair } from '@vritti/api-sdk/signing';
import type { App, AppOtpConfig, AppType } from '@/db/schema';
import { AppDomainRepository } from '../repositories/app.repository';

/** Marks the value in logs and lets secret scanners recognise a leaked client id. */
const CLIENT_ID_PREFIX = 'vca_';

/**
 * Owns the credential rows.
 *
 * The signature check, clock skew and rejection policy live in
 * `AppRequestResolver`, which calls into here for the one thing only this server
 * can do: turning a client id into a row.
 */
@Injectable()
export class AppDomainService {
  private readonly logger = new Logger(AppDomainService.name);

  constructor(private readonly repository: AppDomainRepository) {}

  /**
   * Mints an app and its keypair.
   *
   * Both halves are stored, mirroring `cloud.deployments.signing_key` /
   * `signing_public_key` — the private half has to be readable later because it
   * lives in the client's environment, not just in whoever was watching the
   * screen the day it was created.
   */
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

  /** Replaces the keypair, keeping the client id so a caller swaps one value. */
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
  async setOtpConfig(id: string, otpConfig: AppOtpConfig | null): Promise<App> {
    const app = await this.repository.update(id, { otpConfig });
    this.logger.log(`${otpConfig ? 'Configured' : 'Cleared'} OTP for app ${app.clientId}`);
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

  /**
   * Replaces what the credential may do.
   *
   * A whole-set replace rather than a merge: the editor sends the complete selection,
   * so a permission absent from it has been taken away. Merging would make revoking
   * impossible.
   *
   * The grant is sanitized first. It arrives as free-form JSON over the cloud webhook,
   * and a malformed shape would not fail validation — it would simply resolve to nothing
   * later, at the point where the reason is hardest to see.
   */
  async setPermissions(id: string, permissions: FeatureUnlocks): Promise<App> {
    const app = await this.repository.update(id, { permissions: sanitizeGrants(permissions) });
    this.logger.log(`Set permissions on app ${app.clientId}: ${Object.keys(app.permissions).join(', ') || 'none'}`);
    return app;
  }

  /**
   * Removes the credential outright. The client id stops resolving on the next
   * request — the same uniform 401 an unknown client gets.
   */
  async delete(app: App): Promise<void> {
    await this.repository.deleteById(app.id);
    this.logger.log(`Deleted app ${app.clientId}`);
  }

  /**
   * Resolves a presented client id.
   *
   * Returns the row whatever its state. Refusing an inactive or revoked app is
   * `AppRequestResolver`'s job, so that every rejection looks identical from
   * outside; deciding it here would split that policy across two places.
   */
  findByClientId(clientId: string): Promise<App | undefined> {
    return this.repository.findByClientId(clientId);
  }

  /**
   * Stamps usage after a request verifies.
   *
   * Fire-and-forget by contract: the caller does not await it, and a failure to
   * record that a valid request happened must never fail that request.
   */
  touchLastUsed(appId: string): void {
    void this.repository.touchLastUsed(appId).catch(() => undefined);
  }
}

/**
 * Keeps only what `FeatureUnlocks` allows: feature codes mapping to per-platform arrays
 * of action codes.
 *
 * An empty array is meaningful and preserved — it means "a member of this feature with
 * no actions", which the resolver reads as view-only membership. `undefined` is the
 * absence of membership, so a platform key is dropped rather than defaulted.
 */
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

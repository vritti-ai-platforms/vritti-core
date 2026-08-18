import { randomBytes } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { generateSigningKeyPair } from '@vritti/api-sdk/signing';
import type { App, AppType } from '@/db/schema';
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
  async create(input: { organizationId: string; name: string; type: AppType }): Promise<App> {
    const { privateKey, publicKey } = generateSigningKeyPair();

    const app = await this.repository.create({
      organizationId: input.organizationId,
      clientId: `${CLIENT_ID_PREFIX}${randomBytes(16).toString('hex')}`,
      name: input.name.trim(),
      type: input.type,
      signingKey: privateKey,
      signingPublicKey: publicKey,
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

  async rename(id: string, name: string): Promise<App> {
    return this.repository.update(id, { name: name.trim() });
  }

  async revoke(id: string): Promise<App> {
    const app = await this.repository.revoke(id);
    this.logger.log(`Revoked app ${app.clientId}`);
    return app;
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

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { type App, apps } from '@/db/schema';

@Injectable()
export class AppDomainRepository extends PrimaryBaseRepository<typeof apps> {
  constructor(database: PrimaryDatabaseService) {
    super(database, apps);
  }

  /** Resolves a presented client id. The hot path on every signed app request. */
  async findByClientId(clientId: string): Promise<App | undefined> {
    return this.model.findFirst({
      where: { clientId },
    });
  }

  /** Every app an organization owns, newest first. */
  async findAllByOrg(organizationId: string): Promise<App[]> {
    return this.model.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Scoped by org as well as id on purpose: the caller supplies both, and
   * matching on id alone would let one organization address another's app.
   */
  async findByIdInOrg(id: string, organizationId: string): Promise<App | undefined> {
    return this.model.findFirst({
      where: { id, organizationId },
    });
  }

  /** Replaces the keypair, keeping the client id so callers only swap one value. */
  async rotateKeys(id: string, signingKey: string, signingPublicKey: string): Promise<App> {
    return this.update(id, { signingKey, signingPublicKey });
  }

  /**
   * Revokes without deleting — the row stays as a record that the credential
   * existed and when it stopped working.
   */
  async revoke(id: string): Promise<App> {
    return this.update(id, { isActive: false, revokedAt: new Date() });
  }

  /**
   * Stamps usage. Never awaited by the guard: failing to record that a valid
   * request happened must not fail the request.
   */
  async touchLastUsed(id: string): Promise<void> {
    await this.db.update(apps).set({ lastUsedAt: new Date() }).where(eq(apps.id, id));
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, sql } from '@vritti/api-sdk/drizzle-orm';
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

  // Apps configured to send sign-in codes from a given WhatsApp account
  async findByOtpAccount(organizationId: string, accountId: string): Promise<App[]> {
    return this.db
      .select()
      .from(apps)
      .where(
        and(eq(apps.organizationId, organizationId), sql`${apps.whatsappOtpConfig}->>'accountId' = ${accountId}`),
      ) as Promise<App[]>;
  }

  // Resolves the app that sends sign-in codes from a given number. Deliberately cross-tenant: a
  // delivery callback carries no org context, and `apps` has no RLS for exactly this class of lookup.
  async findByOtpPhoneNumber(phoneNumberId: string): Promise<App | undefined> {
    const [app] = await this.db
      .select()
      .from(apps)
      .where(sql`${apps.whatsappOtpConfig}->>'phoneNumberId' = ${phoneNumberId}`)
      .limit(1);
    return app;
  }

  /** Replaces the keypair, keeping the client id so callers only swap one value. */
  async rotateKeys(id: string, signingKey: string, signingPublicKey: string): Promise<App> {
    return this.update(id, { signingKey, signingPublicKey });
  }

  /** Removes the credential outright — no row, no resolvable client id, nothing to restore. */
  async deleteById(id: string): Promise<void> {
    await this.db.delete(apps).where(eq(apps.id, id));
  }

  /**
   * Stamps usage. Never awaited by the guard: failing to record that a valid
   * request happened must not fail the request.
   */
  async touchLastUsed(id: string): Promise<void> {
    await this.db.update(apps).set({ lastUsedAt: new Date() }).where(eq(apps.id, id));
  }
}

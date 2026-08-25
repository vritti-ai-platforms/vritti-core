import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, ne } from '@vritti/api-sdk/drizzle-orm';
import { type WhatsappAccount, whatsappAccounts } from '@/db/schema';

@Injectable()
export class WhatsappAccountsDomainRepository extends PrimaryBaseRepository<typeof whatsappAccounts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, whatsappAccounts);
  }

  // Lookup by WABA id, which is unique per organization
  async findByWabaId(wabaId: string): Promise<WhatsappAccount | undefined> {
    return this.model.findFirst({ where: { wabaId } });
  }

  // The account the sender falls back to when nothing narrows the choice
  async findDefault(): Promise<WhatsappAccount | undefined> {
    return this.model.findFirst({ where: { isDefault: true, isActive: true } });
  }

  // Clears the default flag on other rows so a new default cannot collide with the partial unique index
  async clearDefaults(exceptId?: string): Promise<void> {
    const where = exceptId
      ? and(eq(whatsappAccounts.isDefault, true), ne(whatsappAccounts.id, exceptId))
      : eq(whatsappAccounts.isDefault, true);

    await this.db.update(whatsappAccounts).set({ isDefault: false }).where(where);
  }
}

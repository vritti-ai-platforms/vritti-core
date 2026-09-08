import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
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

  /**
   * Every WABA this organization already holds.
   *
   * RLS scopes it, so it is exactly the set that must be excluded when deriving which granted WABA a
   * connect is for — a token's grant accumulates across every account the operator has ever
   * authorised, so on its own it cannot say which one is new.
   */
  async findAllWabaIds(): Promise<string[]> {
    const rows = await this.db.select({ wabaId: whatsappAccounts.wabaId }).from(whatsappAccounts);
    return rows.map((row) => row.wabaId);
  }
}

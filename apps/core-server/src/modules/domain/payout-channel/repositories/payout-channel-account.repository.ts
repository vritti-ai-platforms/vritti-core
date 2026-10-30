import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { payoutChannelAccounts } from '@/db/schema';

@Injectable()
export class PayoutChannelAccountDomainRepository extends PrimaryBaseRepository<typeof payoutChannelAccounts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, payoutChannelAccounts);
  }

  // Switches on one payout account of the channel's bank account; switching it on twice is a no-op
  async switchOn(row: {
    organizationId: string;
    payoutChannelId: string;
    payoutAccountId: string;
    bankAccountId: string;
  }): Promise<void> {
    await this.db.insert(payoutChannelAccounts).values(row).onConflictDoNothing();
  }

  // Switches off one payout account for the channel
  async switchOff(payoutChannelId: string, payoutAccountId: string): Promise<void> {
    await this.deleteMany(
      and(
        eq(payoutChannelAccounts.payoutChannelId, payoutChannelId),
        eq(payoutChannelAccounts.payoutAccountId, payoutAccountId),
      ) as SQL,
    );
  }

  // Switches off every payout account of a channel, before it moves to another bank account
  async switchOffAll(payoutChannelId: string): Promise<void> {
    await this.deleteMany(eq(payoutChannelAccounts.payoutChannelId, payoutChannelId));
  }
}

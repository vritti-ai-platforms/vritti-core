import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { payoutChannels } from '@/db/schema';

@Injectable()
// The payout accounts switched on for a scope — core.payout_channels
export class PayoutChannelDomainRepository extends PrimaryBaseRepository<typeof payoutChannels> {
  constructor(database: PrimaryDatabaseService) {
    super(database, payoutChannels);
  }

  // Switches on one payout account of the channel's bank account; switching it on twice is a no-op
  async switchOn(row: {
    organizationId: string;
    payoutChannelBankAccountId: string;
    payoutAccountId: string;
    bankAccountId: string;
  }): Promise<void> {
    await this.db.insert(payoutChannels).values(row).onConflictDoNothing();
  }

  // Switches off one payout account for the channel
  async switchOff(payoutChannelBankAccountId: string, payoutAccountId: string): Promise<void> {
    await this.deleteMany(
      and(
        eq(payoutChannels.payoutChannelBankAccountId, payoutChannelBankAccountId),
        eq(payoutChannels.payoutAccountId, payoutAccountId),
      ) as SQL,
    );
  }

  // Switches off every payout account of a channel, before it moves to another bank account
  async switchOffAll(payoutChannelBankAccountId: string): Promise<void> {
    await this.deleteMany(eq(payoutChannels.payoutChannelBankAccountId, payoutChannelBankAccountId));
  }
}

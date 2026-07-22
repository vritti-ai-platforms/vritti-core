import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type PartySocialProfile, parties, partySocialProfiles, type SocialPlatform } from '@/db/schema';

@Injectable()
export class PartySocialProfilesDomainRepository extends PrimaryBaseRepository<typeof partySocialProfiles> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partySocialProfiles);
  }

  // Returns paginated social profiles filtered by an already-built where clause
  findForTable(options: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: PartySocialProfile[];
    count: number;
  }> {
    return this.findAllAndCount({
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns true when the owning party exists
  async partyExists(partyId: string): Promise<boolean> {
    const [row] = await this.db.select({ id: parties.id }).from(parties).where(eq(parties.id, partyId)).limit(1);
    return Boolean(row);
  }

  // Returns the party's profile for a platform, if one is set (used for the single-value WEBSITE upsert)
  async findByPartyAndPlatform(partyId: string, platform: SocialPlatform): Promise<PartySocialProfile | undefined> {
    const [row] = await this.db
      .select()
      .from(partySocialProfiles)
      .where(and(eq(partySocialProfiles.partyId, partyId), eq(partySocialProfiles.platform, platform)))
      .limit(1);
    return row as PartySocialProfile | undefined;
  }
}

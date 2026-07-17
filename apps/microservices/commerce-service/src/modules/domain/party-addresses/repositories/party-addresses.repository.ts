import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type NewPartyAddress, parties, type PartyAddress, partyAddresses } from '@/db/schema';

@Injectable()
export class PartyAddressesRepository extends PrimaryBaseRepository<typeof partyAddresses> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partyAddresses);
  }

  // Returns paginated addresses filtered by an already-built where clause
  findForTable(options: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: PartyAddress[];
    count: number;
  }> {
    return this.findAllAndCount({
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Inserts a party address row
  async add(data: NewPartyAddress): Promise<PartyAddress> {
    const [row] = await this.db.insert(partyAddresses).values(data).returning();
    return row as PartyAddress;
  }

  // Loads a single address by id
  async findById(id: string): Promise<PartyAddress | undefined> {
    const [row] = await this.db.select().from(partyAddresses).where(eq(partyAddresses.id, id)).limit(1);
    return row as PartyAddress | undefined;
  }

  // Updates a party address row
  async update(id: string, data: Partial<NewPartyAddress>): Promise<PartyAddress> {
    const [row] = await this.db.update(partyAddresses).set(data).where(eq(partyAddresses.id, id)).returning();
    return row as PartyAddress;
  }

  // Deletes an address row
  async remove(id: string): Promise<void> {
    await this.db.delete(partyAddresses).where(eq(partyAddresses.id, id));
  }

  // Updates the owning party's country code
  async setPartyCountry(partyId: string, countryCode: string): Promise<void> {
    await this.db.update(parties).set({ countryCode }).where(eq(parties.id, partyId));
  }

  // Clears the primary flag on all of a party's addresses
  async clearPrimary(partyId: string): Promise<void> {
    await this.db.update(partyAddresses).set({ isPrimary: false }).where(eq(partyAddresses.partyId, partyId));
  }
}

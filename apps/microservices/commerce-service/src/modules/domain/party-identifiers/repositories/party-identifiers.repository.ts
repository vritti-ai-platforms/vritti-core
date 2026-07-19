import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  type NewPartyIdentifier,
  type PartyIdentifier,
  type PartyIdentifierType,
  type PartyType,
  parties,
  partyIdentifiers,
} from '@/db/schema';

@Injectable()
export class PartyIdentifiersDomainRepository extends PrimaryBaseRepository<typeof partyIdentifiers> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partyIdentifiers);
  }

  // Returns paginated identifiers filtered by an already-built where clause
  findForTable(options: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: PartyIdentifier[];
    count: number;
  }> {
    return this.findAllAndCount({
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns the party_type of the owning party, or undefined if the party does not exist
  async getPartyType(partyId: string): Promise<PartyType | undefined> {
    const [row] = await this.db
      .select({ partyType: parties.partyType })
      .from(parties)
      .where(eq(parties.id, partyId))
      .limit(1);
    return row?.partyType as PartyType | undefined;
  }

  // Looks up an identifier by type and value within the org
  async findByTypeValue(idType: PartyIdentifierType, idValue: string): Promise<PartyIdentifier | undefined> {
    const [row] = await this.db
      .select()
      .from(partyIdentifiers)
      .where(and(eq(partyIdentifiers.idType, idType), eq(partyIdentifiers.idValue, idValue)))
      .limit(1);
    return row as PartyIdentifier | undefined;
  }

  // Inserts a party identifier row
  async add(data: NewPartyIdentifier): Promise<PartyIdentifier> {
    const [row] = await this.db.insert(partyIdentifiers).values(data).returning();
    return row as PartyIdentifier;
  }

  // Loads a single identifier by id
  async findById(id: string): Promise<PartyIdentifier | undefined> {
    const [row] = await this.db.select().from(partyIdentifiers).where(eq(partyIdentifiers.id, id)).limit(1);
    return row as PartyIdentifier | undefined;
  }

  // Deletes an identifier row
  async remove(id: string): Promise<void> {
    await this.db.delete(partyIdentifiers).where(eq(partyIdentifiers.id, id));
  }
}

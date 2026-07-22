import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, getTableColumns, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type NewPartyAddress,
  type PartyAddress,
  PartyFunctionTypeValues,
  partyAddresses,
  partyFunctions,
} from '@/db/schema';
import type { PartyAddressFunction, PartyAddressWithFunctions } from '../dto/entity/party-address.dto';

const functionsAgg = sql<PartyAddressFunction[]>`COALESCE(
  json_agg(json_build_object('function', ${partyFunctions.function}, 'isPrimary', ${partyFunctions.isPrimary}))
    FILTER (WHERE ${partyFunctions.id} IS NOT NULL),
  '[]'::json
)`;

@Injectable()
export class PartyAddressesDomainRepository extends PrimaryBaseRepository<typeof partyAddresses> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partyAddresses);
  }

  // Returns paginated addresses (with aggregated functions) filtered by an already-built where clause
  findForTable(options: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: PartyAddressWithFunctions[];
    count: number;
  }> {
    return this.findAllAndCount<PartyAddressWithFunctions>({
      select: { ...getTableColumns(partyAddresses), functions: functionsAgg },
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
      leftJoins: [{ table: partyFunctions, on: eq(partyFunctions.partyAddressId, partyAddresses.id) }],
      groupBy: [partyAddresses.id],
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

  // Returns the number of addresses a party has
  async countByParty(partyId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(partyAddresses)
      .where(eq(partyAddresses.partyId, partyId));
    return row?.count ?? 0;
  }

  // Loads a party's primary REGISTERED address (its main postal address), if one exists
  async findPrimaryRegisteredByPartyId(partyId: string): Promise<PartyAddress | undefined> {
    const [row] = await this.db
      .select({ address: partyAddresses })
      .from(partyAddresses)
      .innerJoin(partyFunctions, eq(partyFunctions.partyAddressId, partyAddresses.id))
      .where(
        and(
          eq(partyAddresses.partyId, partyId),
          eq(partyFunctions.function, PartyFunctionTypeValues.REGISTERED),
          eq(partyFunctions.isPrimary, true),
        ),
      )
      .orderBy(desc(partyAddresses.createdAt))
      .limit(1);
    return row?.address as PartyAddress | undefined;
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
}

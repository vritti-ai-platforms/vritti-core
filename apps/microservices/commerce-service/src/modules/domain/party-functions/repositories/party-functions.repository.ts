import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, ne, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type PartyFunction,
  type PartyFunctionType,
  type PartyRelationship,
  partyFunctions,
  partyRelationships,
} from '@/db/schema';

@Injectable()
export class PartyFunctionsDomainRepository extends PrimaryBaseRepository<typeof partyFunctions> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partyFunctions);
  }

  // Returns the party functions attached to a given address
  async findByAddress(addressId: string): Promise<PartyFunction[]> {
    return this.db.select().from(partyFunctions).where(eq(partyFunctions.partyAddressId, addressId));
  }

  // Returns the party functions attached to a given relationship
  async findByRelationship(relationshipId: string): Promise<PartyFunction[]> {
    return this.db.select().from(partyFunctions).where(eq(partyFunctions.partyRelationshipId, relationshipId));
  }

  // Clears the primary flag on a party's other rows of the same function before flipping a new one to primary
  async clearPrimary(partyId: string, functionCode: PartyFunctionType, exceptId?: string): Promise<void> {
    const base = and(eq(partyFunctions.partyId, partyId), eq(partyFunctions.function, functionCode));
    const where = exceptId ? and(base, ne(partyFunctions.id, exceptId)) : base;
    await this.db.update(partyFunctions).set({ isPrimary: false }).where(where);
  }

  // Returns the relationship that holds a party's primary row for a contact-function, if one is set
  async findPrimaryRelationship(
    partyId: string,
    functionCode: PartyFunctionType,
  ): Promise<PartyRelationship | undefined> {
    const [row] = await this.db
      .select({ relationship: partyRelationships })
      .from(partyFunctions)
      .innerJoin(partyRelationships, eq(partyRelationships.id, partyFunctions.partyRelationshipId))
      .where(
        and(
          eq(partyFunctions.partyId, partyId),
          eq(partyFunctions.function, functionCode),
          eq(partyFunctions.isPrimary, true),
        ),
      )
      .limit(1);
    return row?.relationship as PartyRelationship | undefined;
  }

  // Returns true when the relationship already holds the given function
  async relationshipHasFunction(relationshipId: string, functionCode: PartyFunctionType): Promise<boolean> {
    const [row] = await this.db
      .select({ one: sql<number>`1` })
      .from(partyFunctions)
      .where(and(eq(partyFunctions.partyRelationshipId, relationshipId), eq(partyFunctions.function, functionCode)))
      .limit(1);
    return Boolean(row);
  }
}

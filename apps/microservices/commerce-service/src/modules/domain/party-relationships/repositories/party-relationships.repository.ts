import { Injectable } from '@nestjs/common';
import {
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq, ilike, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { alias } from '@vritti/api-sdk/drizzle-pg-core';
import {
  type NewPartyRelationship,
  PartyCommunicationChannelValues,
  type PartyFunctionType,
  type PartyRelationship,
  parties,
  partyCommunications,
  partyFunctions,
  partyRelationships,
} from '@/db/schema';
import type { PartyRelationshipRow, RelationshipFunction } from '../dto/entity/party-relationship.dto';

const childEmailComm = alias(partyCommunications, 'child_email_comm');
const childPhoneComm = alias(partyCommunications, 'child_phone_comm');

const functionsAgg = sql<RelationshipFunction[]>`COALESCE(
  json_agg(json_build_object('function', ${partyFunctions.function}, 'isPrimary', ${partyFunctions.isPrimary}))
    FILTER (WHERE ${partyFunctions.id} IS NOT NULL),
  '[]'::json
)`;

@Injectable()
export class PartyRelationshipsDomainRepository extends PrimaryBaseRepository<typeof partyRelationships> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partyRelationships);
  }

  // Returns paginated relationships joined with the child person's name, main lines, and the relationship's functions
  async findRelationshipsForTable(options: {
    where?: SQL;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: PartyRelationshipRow[]; count: number }> {
    const rowsPromise = this.db
      .select({
        relationship: partyRelationships,
        childName: parties.displayName,
        childEmail: childEmailComm.value,
        childPhone: childPhoneComm.value,
        functions: functionsAgg,
      })
      .from(partyRelationships)
      .leftJoin(parties, eq(parties.id, partyRelationships.childPartyId))
      .leftJoin(
        childEmailComm,
        and(
          eq(childEmailComm.partyId, partyRelationships.childPartyId),
          eq(childEmailComm.channel, PartyCommunicationChannelValues.EMAIL),
          eq(childEmailComm.isPrimary, true),
        ),
      )
      .leftJoin(
        childPhoneComm,
        and(
          eq(childPhoneComm.partyId, partyRelationships.childPartyId),
          eq(childPhoneComm.channel, PartyCommunicationChannelValues.PHONE),
          eq(childPhoneComm.isPrimary, true),
        ),
      )
      .leftJoin(partyFunctions, eq(partyFunctions.partyRelationshipId, partyRelationships.id))
      .where(options.where)
      .groupBy(partyRelationships.id, parties.displayName, childEmailComm.value, childPhoneComm.value)
      .orderBy(...(options.orderBy ?? []))
      .limit(options.limit)
      .offset(options.offset);

    const countPromise = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(partyRelationships)
      .leftJoin(parties, eq(parties.id, partyRelationships.childPartyId))
      .where(options.where);

    const [rows, countResult] = await Promise.all([rowsPromise, countPromise]);
    return {
      result: rows.map((row) => ({
        ...row.relationship,
        childName: row.childName ?? null,
        childEmail: row.childEmail ?? null,
        childPhone: row.childPhone ?? null,
        functions: row.functions ?? [],
      })),
      count: countResult[0]?.count ?? 0,
    };
  }

  // Returns paginated relationships joined with the parent company's display name
  async findCompaniesForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: (PartyRelationship & { companyName: string | null })[];
    count: number;
  }> {
    const rowsPromise = this.db
      .select({
        relationship: partyRelationships,
        companyName: parties.displayName,
      })
      .from(partyRelationships)
      .leftJoin(parties, eq(parties.id, partyRelationships.parentPartyId))
      .where(options.where)
      .orderBy(...(options.orderBy ?? []))
      .limit(options.limit)
      .offset(options.offset);

    const countPromise = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(partyRelationships)
      .leftJoin(parties, eq(parties.id, partyRelationships.parentPartyId))
      .where(options.where);

    const [rows, countResult] = await Promise.all([rowsPromise, countPromise]);
    return {
      result: rows.map((row) => ({
        ...row.relationship,
        companyName: row.companyName ?? null,
      })),
      count: countResult[0]?.count ?? 0,
    };
  }

  // Returns paginated relationship (person) options of a company party, optionally holders of a function.
  // The picker value is the relationship id (used as supplier_sites.order_relationship_id).
  async findOptionsForSelect(
    partyId: string,
    query: SelectOptionsQueryDto,
    functionCode?: PartyFunctionType,
  ): Promise<SelectQueryResult> {
    const limit = Number(query.limit) || 20;
    const offset = Number(query.offset) || 0;

    const conditions: SQL[] = [eq(partyRelationships.parentPartyId, partyId), eq(partyRelationships.isActive, true)];
    if (functionCode) conditions.push(eq(partyFunctions.function, functionCode));
    if (query.search) conditions.push(ilike(parties.displayName, `%${query.search}%`));

    const isPrimaryExpr = functionCode ? partyFunctions.isPrimary : sql<boolean>`false`;
    const base = this.db
      .select({
        value: partyRelationships.id,
        label: parties.displayName,
        description: partyRelationships.jobTitle,
        isPrimary: isPrimaryExpr,
        totalCount: sql<number>`count(*) over()`.mapWith(Number),
      })
      .from(partyRelationships)
      .innerJoin(parties, eq(parties.id, partyRelationships.childPartyId))
      .$dynamic();

    if (functionCode) {
      base.innerJoin(partyFunctions, eq(partyFunctions.partyRelationshipId, partyRelationships.id));
    }

    const orderBy = functionCode
      ? [desc(partyFunctions.isPrimary), asc(parties.displayName)]
      : [asc(parties.displayName)];

    const rows = await base
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const totalCount = rows.length > 0 ? rows[0].totalCount : 0;
    return {
      options: rows.map((row) => ({
        value: row.value,
        label: row.label ?? 'Contact',
        description: row.description ?? undefined,
        additionals: { isPrimary: row.isPrimary },
      })),
      hasMore: offset + limit < totalCount,
      totalCount,
    };
  }

  // Returns whether a party exists by id
  async partyExists(partyId: string): Promise<boolean> {
    const [row] = await this.db.select({ id: parties.id }).from(parties).where(eq(parties.id, partyId)).limit(1);
    return !!row;
  }

  // Creates a party relationship row
  async addRelationship(data: NewPartyRelationship): Promise<PartyRelationship> {
    const [row] = await this.db.insert(partyRelationships).values(data).returning();
    return row as PartyRelationship;
  }

  // Loads a single party relationship by id
  async findRelationshipById(id: string): Promise<PartyRelationship | undefined> {
    const [row] = await this.db.select().from(partyRelationships).where(eq(partyRelationships.id, id)).limit(1);
    return row as PartyRelationship | undefined;
  }

  // Updates a party relationship row
  async updateRelationship(id: string, data: Partial<NewPartyRelationship>): Promise<PartyRelationship> {
    const [row] = await this.db.update(partyRelationships).set(data).where(eq(partyRelationships.id, id)).returning();
    return row as PartyRelationship;
  }

  // Deletes a party relationship row
  async removeRelationship(id: string): Promise<void> {
    await this.db.delete(partyRelationships).where(eq(partyRelationships.id, id));
  }
}

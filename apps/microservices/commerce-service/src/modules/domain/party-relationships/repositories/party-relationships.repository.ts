import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, getColumns, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { alias, QueryBuilder } from '@vritti/api-sdk/drizzle-pg-core';
import {
  type FindForSelectJoin,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  selectPageOptions,
} from '@vritti/api-sdk/select';
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

export type PersonCompanyRow = PartyRelationship & {
  companyName: string | null;
};

const childEmailComm = alias(partyCommunications, 'child_email_comm');
const childPhoneComm = alias(partyCommunications, 'child_phone_comm');

const functionsSubquery = sql<RelationshipFunction[]>`COALESCE((${new QueryBuilder()
  .select({
    functions: sql`json_agg(json_build_object('function', ${partyFunctions.function}, 'isPrimary', ${partyFunctions.isPrimary}))`,
  })
  .from(partyFunctions)
  .where(eq(partyFunctions.partyRelationshipId, partyRelationships.id))}), '[]'::json)`;

@Injectable()
export class PartyRelationshipsDomainRepository extends PrimaryBaseRepository<typeof partyRelationships> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partyRelationships);
  }

  // Returns paginated relationships with the child person's name, main lines and functions, filtered by an
  // already-built where clause
  findRelationshipsForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: PartyRelationshipRow[]; count: number }> {
    return this.findAllAndCount<PartyRelationshipRow>({
      select: {
        ...getColumns(partyRelationships),
        childName: parties.displayName,
        childEmail: childEmailComm.value,
        childPhone: childPhoneComm.value,
        functions: functionsSubquery,
      },
      leftJoins: [
        { table: parties, on: eq(parties.id, partyRelationships.childPartyId) },
        {
          table: childEmailComm,
          on: and(
            eq(childEmailComm.partyId, partyRelationships.childPartyId),
            eq(childEmailComm.channel, PartyCommunicationChannelValues.EMAIL),
            eq(childEmailComm.isPrimary, true),
          ),
        },
        {
          table: childPhoneComm,
          on: and(
            eq(childPhoneComm.partyId, partyRelationships.childPartyId),
            eq(childPhoneComm.channel, PartyCommunicationChannelValues.PHONE),
            eq(childPhoneComm.isPrimary, true),
          ),
        },
      ],
      ...options,
    });
  }

  // Returns paginated relationships with the parent company's display name, filtered by an already-built where clause
  findCompaniesForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: PersonCompanyRow[]; count: number }> {
    return this.findAllAndCount<PersonCompanyRow>({
      select: { ...getColumns(partyRelationships), companyName: parties.displayName },
      leftJoin: { table: parties, on: eq(parties.id, partyRelationships.parentPartyId) },
      ...options,
    });
  }

  // Returns a company party's active relationships as person select options; with a function, only its holders,
  // primary holder first
  findOptionsForSelect(
    partyId: string,
    query: SelectOptionsQueryDto,
    functionCode?: PartyFunctionType,
  ): Promise<SelectQueryResult> {
    const joins: FindForSelectJoin[] = [
      { table: parties, on: eq(parties.id, partyRelationships.childPartyId), type: 'inner' },
    ];
    const conditions: SQL[] = [];
    if (functionCode) {
      joins.push({
        table: partyFunctions,
        on: eq(partyFunctions.partyRelationshipId, partyRelationships.id),
        type: 'inner',
      });
      conditions.push(eq(partyFunctions.function, functionCode));
    }
    return this.findForSelect({
      ...selectPageOptions(query),
      value: 'id',
      label: sql`coalesce(${parties.displayName}, 'Contact')`,
      description: 'jobTitle',
      additionalExpressions: { isPrimary: functionCode ? sql`${partyFunctions.isPrimary}` : sql`false` },
      searchKeys: ['displayName'],
      orderBy: functionCode ? { isPrimary: 'desc', displayName: 'asc' } : { displayName: 'asc' },
      where: { parentPartyId: partyId, isActive: true },
      joins,
      conditions,
    });
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

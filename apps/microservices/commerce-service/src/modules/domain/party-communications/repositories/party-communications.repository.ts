import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, exists, getColumns, inArray, ne, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { QueryBuilder } from '@vritti/api-sdk/drizzle-pg-core';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import {
  CONTACTABLE_CHANNELS,
  type MessagingApp,
  type PartyCommunication,
  type PartyCommunicationChannel,
  type PartyFunctionType,
  PartyTypeValues,
  parties,
  partyCommunicationApps,
  partyCommunications,
  partyFunctions,
  supplierEnrollments,
} from '@/db/schema';
import type { PartyCommunicationAppDto, PartyCommunicationFunction } from '../dto/entity/party-communication.dto';

export type PartyCommunicationRow = PartyCommunication & {
  apps: PartyCommunicationAppDto[];
  functions: PartyCommunicationFunction[];
};

// Restricts a read to channels that are an actual way to reach someone
const contactableOnly = () => inArray(partyCommunications.channel, [...CONTACTABLE_CHANNELS]);

const appsSubquery = sql<PartyCommunicationAppDto[]>`COALESCE((${new QueryBuilder()
  .select({
    apps: sql`json_agg(json_build_object('app', ${partyCommunicationApps.app}, 'handle', ${partyCommunicationApps.handle}))`,
  })
  .from(partyCommunicationApps)
  .where(eq(partyCommunicationApps.communicationId, partyCommunications.id))}), '[]'::json)`;

const functionsSubquery = sql<PartyCommunicationFunction[]>`COALESCE((${new QueryBuilder()
  .select({ functions: sql`json_agg(${partyFunctions.function})` })
  .from(partyFunctions)
  .where(eq(partyFunctions.partyCommunicationId, partyCommunications.id))}), '[]'::json)`;

@Injectable()
export class PartyCommunicationsDomainRepository extends PrimaryBaseRepository<typeof partyCommunications> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partyCommunications);
  }

  // Returns paginated contactable communications with their messaging apps and functions, filtered by an
  // already-built where clause
  findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: PartyCommunicationRow[]; count: number }> {
    const { where, ...page } = options;
    return this.findAllAndCount<PartyCommunicationRow>({
      select: { ...getColumns(partyCommunications), apps: appsSubquery, functions: functionsSubquery },
      where: and(where, contactableOnly()),
      ...page,
    });
  }

  // Replaces the full set of messaging apps for a communication (delete-all then re-insert). Runs in the caller's
  // transaction.
  async replaceApps(communicationId: string, apps: { app: MessagingApp; handle?: string | null }[]): Promise<void> {
    await this.db.delete(partyCommunicationApps).where(eq(partyCommunicationApps.communicationId, communicationId));
    if (apps.length > 0) {
      await this.db
        .insert(partyCommunicationApps)
        .values(apps.map((a) => ({ communicationId, app: a.app, handle: a.handle ?? null })));
    }
  }

  // Returns true when the owning party exists
  async partyExists(partyId: string): Promise<boolean> {
    const [row] = await this.db.select({ id: parties.id }).from(parties).where(eq(parties.id, partyId)).limit(1);
    return Boolean(row);
  }

  // Returns a party's contactable communications, primary first then by channel
  async findByParty(partyId: string): Promise<PartyCommunication[]> {
    const rows = await this.db
      .select()
      .from(partyCommunications)
      .where(and(eq(partyCommunications.partyId, partyId), contactableOnly()))
      .orderBy(asc(partyCommunications.channel), desc(partyCommunications.isPrimary));
    return rows as PartyCommunication[];
  }

  // Resolves the parties reachable at a presented email or phone, oldest party first
  async findPartyIdsByValue(channel: PartyCommunicationChannel, normalizedValue: string): Promise<string[]> {
    const rows = await this.db
      .select({ partyId: partyCommunications.partyId })
      .from(partyCommunications)
      .innerJoin(parties, eq(parties.id, partyCommunications.partyId))
      .where(
        and(
          eq(partyCommunications.channel, channel),
          sql`lower(${partyCommunications.value}) = ${normalizedValue}`,
          eq(partyCommunications.isActive, true),
          eq(parties.partyType, PartyTypeValues.PERSON),
        ),
      )
      .orderBy(asc(parties.createdAt));

    // Two rows differing only in case both match, so the same party can come back twice.
    return [...new Set(rows.map((row) => row.partyId))];
  }

  // Returns the party's primary communication for a channel, if one is set
  async findPrimary(partyId: string, channel: PartyCommunicationChannel): Promise<PartyCommunication | undefined> {
    const [row] = await this.db
      .select()
      .from(partyCommunications)
      .where(
        and(
          eq(partyCommunications.partyId, partyId),
          eq(partyCommunications.channel, channel),
          eq(partyCommunications.isPrimary, true),
        ),
      )
      .limit(1);
    return row as PartyCommunication | undefined;
  }

  // Looks up a communication by party, channel and value The party's existing row on this channel with this value, if
  // any
  async findByPartyChannelValue(
    partyId: string,
    channel: PartyCommunicationChannel,
    value: string,
  ): Promise<PartyCommunication | undefined> {
    const [row] = await this.db
      .select()
      .from(partyCommunications)
      .where(
        and(
          eq(partyCommunications.partyId, partyId),
          eq(partyCommunications.channel, channel),
          sql`lower(${partyCommunications.value}) = lower(${value})`,
        ),
      )
      .limit(1);
    return row as PartyCommunication | undefined;
  }

  // Clears is_primary on all other communications of a party+channel before flipping a new one to primary
  async clearPrimaryForChannel(partyId: string, channel: PartyCommunicationChannel, exceptId?: string): Promise<void> {
    const base = and(eq(partyCommunications.partyId, partyId), eq(partyCommunications.channel, channel));
    const where = exceptId ? and(base, ne(partyCommunications.id, exceptId)) : base;
    await this.db.update(partyCommunications).set({ isPrimary: false }).where(where);
  }

  // Returns a party's active communications on one channel as select options, optionally only holders of a function
  findOptionsForSelect(
    partyId: string,
    channel: PartyCommunicationChannel,
    query: SelectOptionsQueryDto,
    functionCode?: PartyFunctionType,
  ): Promise<SelectQueryResult> {
    const conditions: SQL[] = [];
    if (functionCode) {
      conditions.push(
        exists(
          this.db
            .select({ one: sql`1` })
            .from(partyFunctions)
            .where(
              and(
                eq(partyFunctions.partyCommunicationId, partyCommunications.id),
                eq(partyFunctions.function, functionCode),
              ),
            ),
        ),
      );
    }
    return this.findForSelect({
      ...selectPageOptions(query),
      value: 'id',
      label: 'value',
      additionalKeys: query.additionalKeys,
      searchKeys: ['value'],
      orderByKey: 'value',
      orderDirection: 'asc',
      where: { partyId, channel, isActive: true },
      conditions,
    });
  }

  // Returns true when a supplier enrollment uses the communication as its order email or order phone
  async isUsedBySupplierEnrollment(id: string): Promise<boolean> {
    const [row] = await this.db
      .select({ one: sql<number>`1` })
      .from(supplierEnrollments)
      .where(
        or(
          eq(supplierEnrollments.orderEmailCommunicationId, id),
          eq(supplierEnrollments.orderPhoneCommunicationId, id),
        ),
      )
      .limit(1);
    return Boolean(row);
  }
}

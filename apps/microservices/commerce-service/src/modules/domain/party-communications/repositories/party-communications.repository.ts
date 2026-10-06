import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, inArray, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  CONTACTABLE_CHANNELS,
  type MessagingApp,
  type PartyCommunication,
  type PartyCommunicationChannel,
  PartyTypeValues,
  parties,
  partyCommunicationApps,
  partyCommunications,
} from '@/db/schema';
import type { PartyCommunicationAppDto } from '../dto/entity/party-communication.dto';

export type PartyCommunicationRow = PartyCommunication & { apps: PartyCommunicationAppDto[] };

// Restricts a read to channels that are an actual way to reach someone
const contactableOnly = () => inArray(partyCommunications.channel, [...CONTACTABLE_CHANNELS]);

const appsAgg = sql<PartyCommunicationAppDto[]>`COALESCE(
  json_agg(json_build_object('app', ${partyCommunicationApps.app}, 'handle', ${partyCommunicationApps.handle}))
    FILTER (WHERE ${partyCommunicationApps.id} IS NOT NULL),
  '[]'::json
)`;

@Injectable()
export class PartyCommunicationsDomainRepository extends PrimaryBaseRepository<typeof partyCommunications> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partyCommunications);
  }

  // Returns paginated communications with their messaging apps aggregated
  async findForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: PartyCommunicationRow[];
    count: number;
  }> {
    const where = options.where ? and(options.where, contactableOnly()) : contactableOnly();

    const rowsPromise = this.db
      .select({ communication: partyCommunications, apps: appsAgg })
      .from(partyCommunications)
      .leftJoin(partyCommunicationApps, eq(partyCommunicationApps.communicationId, partyCommunications.id))
      .where(where)
      .groupBy(partyCommunications.id)
      .orderBy(...(options.orderBy ?? []))
      .limit(options.limit)
      .offset(options.offset);

    const countPromise = this.db.select({ count: sql<number>`count(*)::int` }).from(partyCommunications).where(where);

    const [rows, countResult] = await Promise.all([rowsPromise, countPromise]);
    return {
      result: rows.map((row) => ({ ...row.communication, apps: row.apps ?? [] })),
      count: countResult[0]?.count ?? 0,
    };
  }

  // Replaces the full set of messaging apps for a communication (delete-all then re-insert). Runs in the caller's transaction.
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

    // Two rows differing only in case both match, so the same party can come
    // back twice. Dedupe while keeping oldest-first order.
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

  // Looks up a communication by party, channel and value
  // The party's existing row on this channel with this value, if any
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
}

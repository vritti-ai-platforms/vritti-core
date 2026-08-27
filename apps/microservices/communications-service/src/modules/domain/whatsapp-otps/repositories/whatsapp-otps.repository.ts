import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, gt, isNull, sql } from '@vritti/api-sdk/drizzle-orm';
import { type WhatsappOtp, whatsappOtps } from '@/db/schema';

export interface WhatsappOtpStatsRow {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  verified: number;
  failed: number;
}

export interface WhatsappOtpDailyRow {
  date: string;
  sent: number;
  delivered: number;
  read: number;
  verified: number;
  failed: number;
}

export interface WhatsappOtpAppRow {
  appId: string;
  sent: number;
  verified: number;
  failed: number;
}

const EMPTY_STATS: WhatsappOtpStatsRow = { total: 0, sent: 0, delivered: 0, read: 0, verified: 0, failed: 0 };

// count(*) comes back from postgres as a bigint string; mapWith keeps the driver honest about the type.
//
// The five status counts mirror resolveStatus() exactly and are mutually exclusive, so a breakdown
// sums to `total`. Counting `sent` as "error is null" would have overlapped every other status.
const undelivered = sql`not ${whatsappOtps.isVerified} and ${whatsappOtps.error} is null`;

const total = sql<number>`count(*)`.mapWith(Number);
const verified = sql<number>`count(*) filter (where ${whatsappOtps.isVerified})`.mapWith(Number);
const failed =
  sql<number>`count(*) filter (where not ${whatsappOtps.isVerified} and ${whatsappOtps.error} is not null)`.mapWith(
    Number,
  );
const read = sql<number>`count(*) filter (where ${undelivered} and ${whatsappOtps.deliveryStatus} = 'read')`.mapWith(
  Number,
);
const delivered =
  sql<number>`count(*) filter (where ${undelivered} and ${whatsappOtps.deliveryStatus} = 'delivered')`.mapWith(Number);
const sent =
  sql<number>`count(*) filter (where ${undelivered} and (${whatsappOtps.deliveryStatus} is null or ${whatsappOtps.deliveryStatus} not in ('delivered', 'read')))`.mapWith(
    Number,
  );

// Days are bucketed in UTC, matching how the service builds the calendar it fills these into
const utcDay = sql<string>`to_char(date_trunc('day', ${whatsappOtps.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`;

@Injectable()
export class WhatsappOtpsDomainRepository extends PrimaryBaseRepository<typeof whatsappOtps> {
  constructor(database: PrimaryDatabaseService) {
    super(database, whatsappOtps);
  }

  // The one code a verify attempt may match — newest unexpired, unverified, successfully sent
  async findLive(appId: string, recipient: string): Promise<WhatsappOtp | undefined> {
    const [live] = await this.db
      .select()
      .from(whatsappOtps)
      .where(
        and(
          eq(whatsappOtps.appId, appId),
          eq(whatsappOtps.recipient, recipient),
          eq(whatsappOtps.isVerified, false),
          gt(whatsappOtps.expiresAt, new Date()),
          isNull(whatsappOtps.error),
        ),
      )
      .orderBy(desc(whatsappOtps.createdAt))
      .limit(1);

    return live;
  }

  // Expires every live code for this recipient so a resend leaves exactly one valid at a time
  async expireLive(appId: string, recipient: string): Promise<void> {
    await this.db
      .update(whatsappOtps)
      .set({ expiresAt: new Date() })
      .where(
        and(
          eq(whatsappOtps.appId, appId),
          eq(whatsappOtps.recipient, recipient),
          eq(whatsappOtps.isVerified, false),
          gt(whatsappOtps.expiresAt, new Date()),
        ),
      );
  }

  // Counts an attempt atomically, so a wrong guess costs one even if the request dies mid-flight
  async incrementAttempts(id: string): Promise<WhatsappOtp | undefined> {
    const [counted] = await this.db
      .update(whatsappOtps)
      .set({ attempts: sql`${whatsappOtps.attempts} + 1` })
      .where(eq(whatsappOtps.id, id))
      .returning();

    return counted;
  }

  // Marks a code as used; nothing may verify against it afterwards
  async markVerified(id: string): Promise<void> {
    await this.db.update(whatsappOtps).set({ isVerified: true, verifiedAt: new Date() }).where(eq(whatsappOtps.id, id));
  }

  // The code a delivery callback refers to. Meta's wamid is globally unique, so no other key is needed
  async findByMessageId(messageId: string): Promise<WhatsappOtp | undefined> {
    const [row] = await this.db.select().from(whatsappOtps).where(eq(whatsappOtps.messageId, messageId)).limit(1);
    return row;
  }

  // Whether any code was ever issued against an account, so core can refuse to orphan a live sender
  countForAccount(accountId: string): Promise<number> {
    return this.count(eq(whatsappOtps.accountId, accountId));
  }

  // Headline counts for the Overview tab, derived the same way the DTO derives status
  async stats(since: Date): Promise<WhatsappOtpStatsRow> {
    const [totals] = await this.db
      .select({ total, sent, delivered, read, verified, failed })
      .from(whatsappOtps)
      .where(gt(whatsappOtps.createdAt, since));

    // An aggregate without GROUP BY always yields one row; the fallback only satisfies the type
    return totals ?? EMPTY_STATS;
  }

  // Counts per day, sparse — days with no codes are absent and the service fills them in
  statsByDay(since: Date): Promise<WhatsappOtpDailyRow[]> {
    return this.db
      .select({ date: utcDay, sent, delivered, read, verified, failed })
      .from(whatsappOtps)
      .where(gt(whatsappOtps.createdAt, since))
      .groupBy(utcDay)
      .orderBy(utcDay);
  }

  // Per-credential breakdown, so one storefront's failures are attributable
  statsByApp(since: Date): Promise<WhatsappOtpAppRow[]> {
    return this.db
      .select({ appId: whatsappOtps.appId, sent, verified, failed })
      .from(whatsappOtps)
      .where(gt(whatsappOtps.createdAt, since))
      .groupBy(whatsappOtps.appId);
  }
}

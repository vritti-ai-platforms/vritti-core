import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, gt, isNull, sql } from '@vritti/api-sdk/drizzle-orm';
import { type SmsOtp, smsOtps } from '@/db/schema';

export interface SmsOtpStatsRow {
  total: number;
  sent: number;
  delivered: number;
  verified: number;
  failed: number;
}

export interface SmsOtpDailyRow {
  date: string;
  sent: number;
  delivered: number;
  verified: number;
  failed: number;
}

export interface SmsOtpAppRow {
  appId: string;
  sent: number;
  verified: number;
  failed: number;
}

const EMPTY_STATS: SmsOtpStatsRow = { total: 0, sent: 0, delivered: 0, verified: 0, failed: 0 };

// The status counts mirror resolveStatus() exactly and are mutually exclusive, so a breakdown
// sums to `total` (no `read` — SMS has no read receipts)
const undelivered = sql`not ${smsOtps.isVerified} and ${smsOtps.error} is null`;

const total = sql<number>`count(*)`.mapWith(Number);
const verified = sql<number>`count(*) filter (where ${smsOtps.isVerified})`.mapWith(Number);
const failed = sql<number>`count(*) filter (where not ${smsOtps.isVerified} and ${smsOtps.error} is not null)`.mapWith(
  Number,
);
const delivered =
  sql<number>`count(*) filter (where ${undelivered} and ${smsOtps.deliveryStatus} = 'delivered')`.mapWith(Number);
const sent =
  sql<number>`count(*) filter (where ${undelivered} and (${smsOtps.deliveryStatus} is null or ${smsOtps.deliveryStatus} <> 'delivered'))`.mapWith(
    Number,
  );

// Days are bucketed in UTC, matching how the service builds the calendar it fills these into
const utcDay = sql<string>`to_char(date_trunc('day', ${smsOtps.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`;

@Injectable()
export class SmsOtpsDomainRepository extends PrimaryBaseRepository<typeof smsOtps> {
  constructor(database: PrimaryDatabaseService) {
    super(database, smsOtps);
  }

  // The one code a verify attempt may match — newest unexpired, unverified, successfully sent
  async findLive(appId: string, recipient: string): Promise<SmsOtp | undefined> {
    const [live] = await this.db
      .select()
      .from(smsOtps)
      .where(
        and(
          eq(smsOtps.appId, appId),
          eq(smsOtps.recipient, recipient),
          eq(smsOtps.isVerified, false),
          gt(smsOtps.expiresAt, new Date()),
          isNull(smsOtps.error),
        ),
      )
      .orderBy(desc(smsOtps.createdAt))
      .limit(1);

    return live;
  }

  // Expires every live code for this recipient so a resend leaves exactly one valid at a time
  async expireLive(appId: string, recipient: string): Promise<void> {
    await this.db
      .update(smsOtps)
      .set({ expiresAt: new Date() })
      .where(
        and(
          eq(smsOtps.appId, appId),
          eq(smsOtps.recipient, recipient),
          eq(smsOtps.isVerified, false),
          gt(smsOtps.expiresAt, new Date()),
        ),
      );
  }

  // Counts an attempt atomically, so a wrong guess costs one even if the request dies mid-flight
  async incrementAttempts(id: string): Promise<SmsOtp | undefined> {
    const [counted] = await this.db
      .update(smsOtps)
      .set({ attempts: sql`${smsOtps.attempts} + 1` })
      .where(eq(smsOtps.id, id))
      .returning();

    return counted;
  }

  // Marks a code as used; nothing may verify against it afterwards
  async markVerified(id: string): Promise<void> {
    await this.db.update(smsOtps).set({ isVerified: true, verifiedAt: new Date() }).where(eq(smsOtps.id, id));
  }

  // The code a delivery callback refers to, once a real provider ships webhooks
  async findByMessageId(messageId: string): Promise<SmsOtp | undefined> {
    const [row] = await this.db.select().from(smsOtps).where(eq(smsOtps.messageId, messageId)).limit(1);
    return row;
  }

  // Whether any code was ever issued through a provider, so a delete can be refused later
  countForProvider(providerId: string): Promise<number> {
    return this.count(eq(smsOtps.providerId, providerId));
  }

  // Headline counts for the Overview tab, derived the same way the DTO derives status
  async stats(since: Date): Promise<SmsOtpStatsRow> {
    const [totals] = await this.db
      .select({ total, sent, delivered, verified, failed })
      .from(smsOtps)
      .where(gt(smsOtps.createdAt, since));

    // An aggregate without GROUP BY always yields one row; the fallback only satisfies the type
    return totals ?? EMPTY_STATS;
  }

  // Counts per day, sparse — days with no codes are absent and the service fills them in
  statsByDay(since: Date): Promise<SmsOtpDailyRow[]> {
    return this.db
      .select({ date: utcDay, sent, delivered, verified, failed })
      .from(smsOtps)
      .where(gt(smsOtps.createdAt, since))
      .groupBy(utcDay)
      .orderBy(utcDay);
  }

  // Per-credential breakdown, so one storefront's failures are attributable
  statsByApp(since: Date): Promise<SmsOtpAppRow[]> {
    return this.db
      .select({ appId: smsOtps.appId, sent, verified, failed })
      .from(smsOtps)
      .where(gt(smsOtps.createdAt, since))
      .groupBy(smsOtps.appId);
  }
}

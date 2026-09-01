import { randomInt } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { hashToken } from '@vritti/api-sdk/auth';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/database';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { type SmsProviderCode, smsOtps } from '@/db/schema';
import { SmsOtpDto } from '../dto/entity/sms-otp.dto';
import type { PreparedOtp, VerifySmsOtpResultDto } from '../dto/entity/sms-otp-result.dto';
import { type SmsOtpDailyPointDto, SmsOtpStatsDto } from '../dto/entity/sms-otp-stats.dto';
import type { SendSmsOtpDto } from '../dto/request/send-sms-otp.dto';
import { DELIVERED, FAILED, isForwardTransition, type SmsOtpStatusDto } from '../dto/request/sms-otp-status.dto';
import type { VerifySmsOtpDto } from '../dto/request/verify-sms-otp.dto';
import { SmsOtpsDomainRepository } from '../repositories/sms-otps.repository';

const STATS_WINDOW_DAYS = 30;

@Injectable()
export class SmsOtpsDomainService {
  private readonly logger = new Logger(SmsOtpsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    recipient: { column: smsOtps.recipient, type: 'string' },
    appId: { column: smsOtps.appId, type: 'string' },
    providerId: { column: smsOtps.providerId, type: 'string' },
    provider: { column: smsOtps.provider, type: 'string' },
    isVerified: { column: smsOtps.isVerified, type: 'boolean' },
    attempts: { column: smsOtps.attempts, type: 'number' },
    createdAt: { column: smsOtps.createdAt, type: 'string' },
    verifiedAt: { column: smsOtps.verifiedAt, type: 'string' },
  };

  constructor(private readonly repository: SmsOtpsDomainRepository) {}

  // Issues a code and stores its hash, leaving delivery to the caller. `id` and `code` are null when
  // the recipient is still within the resend cooldown, which is the only thing standing between this
  // endpoint and someone else's SMS bill.
  async startSend(dto: SendSmsOtpDto, provider: SmsProviderCode): Promise<PreparedOtp> {
    const live = await this.repository.findLive(dto.appId, dto.recipient);

    if (live) {
      const cooldownEndsAt = new Date(live.createdAt.getTime() + dto.resendCooldownSeconds * 1000);
      if (cooldownEndsAt > new Date()) {
        return { id: null, code: null, expiresAt: live.expiresAt, resendAvailableAt: cooldownEndsAt };
      }
    }

    // Expire before inserting so exactly one code is ever valid for a recipient
    await this.repository.expireLive(dto.appId, dto.recipient);

    const code = this.generateCode(dto.codeLength);
    const expiresAt = new Date(Date.now() + dto.expirySeconds * 1000);

    const entity = await this.repository.create({
      appId: dto.appId,
      providerId: dto.providerId,
      provider,
      recipient: dto.recipient,
      codeHash: hashToken(code),
      maxAttempts: dto.maxAttempts,
      expiresAt,
    });

    return {
      id: entity.id,
      code,
      expiresAt,
      resendAvailableAt: new Date(entity.createdAt.getTime() + dto.resendCooldownSeconds * 1000),
    };
  }

  // Records the provider's message id once the send succeeded (null for transports without one)
  async recordSent(id: string, messageId: string | null): Promise<void> {
    await this.repository.update(id, { messageId });
  }

  // Records why delivery failed; the row stays so the failure rate is visible on the Overview tab
  async recordFailure(id: string, error: string): Promise<void> {
    await this.repository.update(id, { error });
  }

  // Applies one delivery callback (dormant until a real provider ships webhooks). Idempotent on
  // messageId and refuses to move a status backwards.
  async applyDeliveryStatus(dto: SmsOtpStatusDto): Promise<boolean> {
    const otp = await this.repository.findByMessageId(dto.messageId);
    if (!otp) {
      this.logger.warn(`Delivery status ${dto.status} for unknown message ${dto.messageId} — ignoring`);
      return false;
    }

    if (!isForwardTransition(otp.deliveryStatus, dto.status)) {
      this.logger.log(`Ignoring out-of-order ${dto.status} for ${dto.messageId} (already ${otp.deliveryStatus})`);
      return false;
    }

    await this.repository.update(otp.id, {
      deliveryStatus: dto.status,
      deliveredAt: dto.status === DELIVERED ? new Date(dto.timestamp) : otp.deliveredAt,
      // A code the vendor could not deliver never reached anyone, so it stops counting as sent
      error: dto.status === FAILED ? (dto.error ?? 'The SMS could not be delivered.') : otp.error,
    });

    this.logger.log(`Delivery ${dto.status} for ${dto.messageId} (otp ${otp.id})`);
    return true;
  }

  // Checks a code against the one live for this credential and number
  async verify(dto: VerifySmsOtpDto): Promise<VerifySmsOtpResultDto> {
    const live = await this.repository.findLive(dto.appId, dto.recipient);

    // Every failure below returns this same shape: distinguishing them would tell an attacker
    // which numbers have codes in flight and how close they are to the attempt cap
    if (!live) return { verified: false };
    if (live.attempts >= live.maxAttempts) return { verified: false };

    // Counted before comparing, so a wrong guess costs an attempt even if this request dies
    const counted = await this.repository.incrementAttempts(live.id);
    if (!counted || counted.codeHash !== hashToken(dto.code)) return { verified: false };

    await this.repository.markVerified(live.id);
    this.logger.log(`Verified SMS OTP for ${dto.recipient} on app ${dto.appId}`);
    return { verified: true };
  }

  // Returns paginated, filtered, and sorted codes for the monitoring data table
  async findForTable(state: TableViewState): Promise<{ result: SmsOtpDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, SmsOtpsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SmsOtpsDomainService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SmsOtpsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(smsOtps.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(SmsOtpDto.from), count };
  }

  // Aggregates the last 30 days for the Overview tab's tiles, chart, and per-app breakdown
  async stats(): Promise<SmsOtpStatsDto> {
    const since = new Date(Date.now() - STATS_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const [totals, byDay, byApp] = await Promise.all([
      this.repository.stats(since),
      this.repository.statsByDay(since),
      this.repository.statsByApp(since),
    ]);

    const dto = new SmsOtpStatsDto();
    dto.total = totals.total;
    dto.sent = totals.sent;
    dto.delivered = totals.delivered;
    dto.verified = totals.verified;
    dto.failed = totals.failed;
    dto.verificationRate = totals.total > 0 ? Math.round((totals.verified / totals.total) * 100) : 0;
    dto.byDay = this.fillMissingDays(byDay, since);
    dto.byApp = byApp;
    return dto;
  }

  // Counts codes ever issued through a provider, so its delete can be refused later
  countForProvider(providerId: string): Promise<number> {
    return this.repository.countForProvider(providerId);
  }

  // Returns one point per day in the window so a quiet day charts as zero rather than a gap
  private fillMissingDays(counted: SmsOtpDailyPointDto[], since: Date): SmsOtpDailyPointDto[] {
    const byDate = new Map(counted.map((point) => [point.date, point]));
    const day = new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), since.getUTCDate()));
    const series: SmsOtpDailyPointDto[] = [];

    // UTC throughout, matching the repository's `at time zone 'UTC'` bucketing
    while (day.getTime() <= Date.now()) {
      const date = day.toISOString().slice(0, 10);
      series.push(byDate.get(date) ?? { date, sent: 0, delivered: 0, verified: 0, failed: 0 });
      day.setUTCDate(day.getUTCDate() + 1);
    }

    return series;
  }

  private generateCode(length: number): string {
    // randomInt is CSPRNG-backed; Math.random would make codes predictable from a few samples
    return Array.from({ length }, () => randomInt(0, 10)).join('');
  }
}

import { randomInt } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { hashToken } from '@vritti/api-sdk/auth';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/database';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { whatsappOtps } from '@/db/schema';
import { WhatsappOtpDto } from '../dto/entity/whatsapp-otp.dto';
import type { PreparedOtp, VerifyWhatsappOtpResultDto } from '../dto/entity/whatsapp-otp-result.dto';
import { type WhatsappOtpDailyPointDto, WhatsappOtpStatsDto } from '../dto/entity/whatsapp-otp-stats.dto';
import type { SendWhatsappOtpDto } from '../dto/request/send-whatsapp-otp.dto';
import type { VerifyWhatsappOtpDto } from '../dto/request/verify-whatsapp-otp.dto';
import {
  DELIVERED,
  FAILED,
  isForwardTransition,
  type WhatsappOtpStatusDto,
} from '../dto/request/whatsapp-otp-status.dto';
import { WhatsappOtpsDomainRepository } from '../repositories/whatsapp-otps.repository';

const STATS_WINDOW_DAYS = 30;

@Injectable()
export class WhatsappOtpsDomainService {
  private readonly logger = new Logger(WhatsappOtpsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    recipient: { column: whatsappOtps.recipient, type: 'string' },
    appId: { column: whatsappOtps.appId, type: 'string' },
    accountId: { column: whatsappOtps.accountId, type: 'string' },
    isVerified: { column: whatsappOtps.isVerified, type: 'boolean' },
    attempts: { column: whatsappOtps.attempts, type: 'number' },
    createdAt: { column: whatsappOtps.createdAt, type: 'string' },
    verifiedAt: { column: whatsappOtps.verifiedAt, type: 'string' },
  };

  constructor(private readonly repository: WhatsappOtpsDomainRepository) {}

  // Issues a code and stores its hash, leaving delivery to the caller. `id` and `code` are null when
  // the recipient is still within the resend cooldown, which is the only thing standing between this
  // endpoint and someone else's WhatsApp bill.
  async startSend(dto: SendWhatsappOtpDto): Promise<PreparedOtp> {
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
      accountId: dto.accountId,
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

  // Records Meta's message id once the send succeeded
  async recordSent(id: string, messageId: string | null): Promise<void> {
    await this.repository.update(id, { messageId });
  }

  // Records why delivery failed; the row stays so the failure rate is visible on the Overview tab
  async recordFailure(id: string, error: string): Promise<void> {
    await this.repository.update(id, { error });
  }

  // Applies one delivery callback. Meta retries and fans out to every subscribed app, so this is
  // idempotent on messageId and refuses to move a status backwards.
  async applyDeliveryStatus(dto: WhatsappOtpStatusDto): Promise<boolean> {
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
      // A code Meta could not deliver never reached anyone, so it stops counting as sent
      error: dto.status === FAILED ? (dto.error ?? 'WhatsApp could not deliver the message.') : otp.error,
    });

    this.logger.log(`Delivery ${dto.status} for ${dto.messageId} (otp ${otp.id})`);
    return true;
  }

  // Checks a code against the one live for this credential and number
  async verify(dto: VerifyWhatsappOtpDto): Promise<VerifyWhatsappOtpResultDto> {
    const live = await this.repository.findLive(dto.appId, dto.recipient);

    // Every failure below returns this same shape: distinguishing them would tell an attacker
    // which numbers have codes in flight and how close they are to the attempt cap
    if (!live) return { verified: false };
    if (live.attempts >= live.maxAttempts) return { verified: false };

    // Counted before comparing, so a wrong guess costs an attempt even if this request dies
    const counted = await this.repository.incrementAttempts(live.id);
    if (!counted || counted.codeHash !== hashToken(dto.code)) return { verified: false };

    await this.repository.markVerified(live.id);
    this.logger.log(`Verified OTP for ${dto.recipient} on app ${dto.appId}`);
    return { verified: true };
  }

  // Returns paginated, filtered, and sorted codes for the monitoring data table
  async findForTable(state: TableViewState): Promise<{ result: WhatsappOtpDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, WhatsappOtpsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, WhatsappOtpsDomainService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, WhatsappOtpsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(whatsappOtps.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(WhatsappOtpDto.from), count };
  }

  // Aggregates the last 30 days for the Overview tab's tiles, chart, and per-app breakdown
  async stats(): Promise<WhatsappOtpStatsDto> {
    const since = new Date(Date.now() - STATS_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const [totals, byDay, byApp] = await Promise.all([
      this.repository.stats(since),
      this.repository.statsByDay(since),
      this.repository.statsByApp(since),
    ]);

    const dto = new WhatsappOtpStatsDto();
    dto.total = totals.total;
    dto.sent = totals.sent;
    dto.delivered = totals.delivered;
    dto.read = totals.read;
    dto.verified = totals.verified;
    dto.failed = totals.failed;
    // Against every code issued, not just those still awaiting delivery — `sent` is now one status
    // among five rather than the running total
    dto.verificationRate = totals.total > 0 ? Math.round((totals.verified / totals.total) * 100) : 0;
    dto.byDay = this.fillMissingDays(byDay, since);
    dto.byApp = byApp;
    return dto;
  }

  // Returns one point per day in the window so a quiet day charts as zero rather than a gap
  private fillMissingDays(counted: WhatsappOtpDailyPointDto[], since: Date): WhatsappOtpDailyPointDto[] {
    const byDate = new Map(counted.map((point) => [point.date, point]));
    const day = new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), since.getUTCDate()));
    const series: WhatsappOtpDailyPointDto[] = [];

    // UTC throughout, matching the repository's `at time zone 'UTC'` bucketing
    while (day.getTime() <= Date.now()) {
      const date = day.toISOString().slice(0, 10);
      series.push(byDate.get(date) ?? { date, sent: 0, delivered: 0, read: 0, verified: 0, failed: 0 });
      day.setUTCDate(day.getUTCDate() + 1);
    }

    return series;
  }

  // Counts codes ever issued against an account, so core can refuse to orphan a connected WABA
  countForAccount(accountId: string): Promise<number> {
    return this.repository.countForAccount(accountId);
  }

  private generateCode(length: number): string {
    // randomInt is CSPRNG-backed; Math.random would make codes predictable from a few samples
    return Array.from({ length }, () => randomInt(0, 10)).join('');
  }
}

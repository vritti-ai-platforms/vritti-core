import { Injectable, Logger } from '@nestjs/common';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { PayoutAccount } from '@/db/schema';
import { PayoutChannelDto } from '../dto/entity/payout-channel.dto';
import type { CreatePayoutChannelDto } from '../dto/request/create-payout-channel.dto';
import {
  type PayoutChannelCandidate,
  type PayoutChannelDetail,
  PayoutChannelDomainRepository,
  type PayoutChannelPaymentContext,
  type PayoutChannelScope,
} from '../repositories/payout-channel.repository';

// How much each narrowing counts when several channels fit a payment: an app beats a site, a site beats a channel
const SPECIFICITY = { app: 8, site: 4, channel: 2 } as const;

// The payout account a channel points at, as the caller loaded it
export type PayoutChannelTarget = Pick<PayoutAccount, 'id' | 'legalEntityId' | 'paymentGatewayConfigId'>;

// Payout channels: which payout account a legal entity, site, app or sales channel pays out to. One channel per
// gateway per scope, checked under a per-legal-entity lock since the gateway lives on the payout account
@Injectable()
export class PayoutChannelDomainService {
  private readonly logger = new Logger(PayoutChannelDomainService.name);

  constructor(private readonly payoutChannelRepository: PayoutChannelDomainRepository) {}

  // Every channel of a legal entity, its sites' included, oldest first
  async listForLegalEntity(orgId: string, legalEntityId: string): Promise<PayoutChannelDto[]> {
    const rows = await this.payoutChannelRepository.findDetailedByLegalEntity(legalEntityId);
    return rows.filter((row) => row.organizationId === orgId).map((row) => PayoutChannelDto.from(row));
  }

  // Loads a channel of the organization, hiding the rest behind the same 404
  async requireById(orgId: string, id: string): Promise<PayoutChannelDetail> {
    const row = await this.payoutChannelRepository.findDetailedById(id);
    if (!row || row.organizationId !== orgId) throw new NotFoundException('Payout channel not found.');
    return row;
  }

  // How many channels use a payout account, so it is not removed while in use
  async countForPayoutAccount(payoutAccountId: string): Promise<number> {
    return this.payoutChannelRepository.countByPayoutAccount(payoutAccountId);
  }

  // Points a scope of the payout account's legal entity at the account
  async create(
    orgId: string,
    dto: CreatePayoutChannelDto,
    account: PayoutChannelTarget,
  ): Promise<CreateResponseDto<PayoutChannelDto>> {
    const scope: PayoutChannelScope = {
      legalEntityId: account.legalEntityId,
      siteId: dto.siteId ?? null,
      appId: dto.appId ?? null,
      channel: dto.channel ?? null,
    };

    const created = await this.payoutChannelRepository.transaction(async () => {
      await this.payoutChannelRepository.lockLegalEntity(account.legalEntityId);
      await this.assertGatewayFree(scope, account.paymentGatewayConfigId);
      return this.payoutChannelRepository.create({
        organizationId: orgId,
        payoutAccountId: account.id,
        ...scope,
      });
    });
    const row = await this.requireById(orgId, created.id);

    this.logger.log(`Created payout channel ${row.id} for legal entity ${row.legalEntityId}`);
    return { success: true, message: 'Payout channel added successfully.', data: PayoutChannelDto.from(row) };
  }

  // Points a channel at another payout account of the same legal entity
  async update(orgId: string, id: string, account: PayoutChannelTarget): Promise<SuccessResponseDto> {
    const existing = await this.requireById(orgId, id);
    const scope: PayoutChannelScope = {
      legalEntityId: existing.legalEntityId,
      siteId: existing.siteId,
      appId: existing.appId,
      channel: existing.channel,
    };

    await this.payoutChannelRepository.transaction(async () => {
      await this.payoutChannelRepository.lockLegalEntity(existing.legalEntityId);
      await this.assertGatewayFree(scope, account.paymentGatewayConfigId, id);
      await this.payoutChannelRepository.update(id, { payoutAccountId: account.id });
    });

    this.logger.log(`Pointed payout channel ${id} at payout account ${account.id}`);
    return { success: true, message: 'Payout channel updated successfully.' };
  }

  // Removes a channel; payments it covered fall back to the next channel that fits, or stop
  async delete(orgId: string, id: string): Promise<SuccessResponseDto> {
    await this.requireById(orgId, id);
    await this.payoutChannelRepository.delete(id);

    this.logger.log(`Deleted payout channel ${id}`);
    return { success: true, message: 'Payout channel removed successfully.' };
  }

  // The payout account a payment pays out to through the gateway the shopper picked: the most specific channel
  async resolve(
    orgId: string,
    context: PayoutChannelPaymentContext,
    paymentGatewayConfigId: string,
  ): Promise<PayoutAccount | undefined> {
    const candidates = await this.payoutChannelRepository.findCandidates(context, paymentGatewayConfigId);
    return mostSpecific(candidates.filter((candidate) => candidate.channel.organizationId === orgId))?.account;
  }

  // The gateways a payment could be taken through: those with at least one channel that fits it
  async findPayableConfigIds(orgId: string, context: PayoutChannelPaymentContext): Promise<string[]> {
    const candidates = await this.payoutChannelRepository.findCandidates(context);
    return [
      ...new Set(
        candidates
          .filter((candidate) => candidate.channel.organizationId === orgId)
          .map((candidate) => candidate.account.paymentGatewayConfigId),
      ),
    ];
  }

  private async assertGatewayFree(
    scope: PayoutChannelScope,
    paymentGatewayConfigId: string,
    excludeId?: string,
  ): Promise<void> {
    const taken = await this.payoutChannelRepository.findInScopeForGateway(scope, paymentGatewayConfigId, excludeId);
    if (!taken) return;
    throw new ConflictException({
      label: 'Payout Channel Exists',
      detail: 'This scope already pays out through that gateway. Change the existing payout channel instead.',
      errors: [{ field: 'payoutAccountId', message: 'Gateway already set up here' }],
    });
  }
}

// The channel narrowed the furthest; one channel per gateway per scope, so two never score the same
function mostSpecific(candidates: PayoutChannelCandidate[]): PayoutChannelCandidate | undefined {
  let best: PayoutChannelCandidate | undefined;
  let bestScore = -1;
  for (const candidate of candidates) {
    const { appId, siteId, channel } = candidate.channel;
    const score = (appId ? SPECIFICITY.app : 0) + (siteId ? SPECIFICITY.site : 0) + (channel ? SPECIFICITY.channel : 0);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

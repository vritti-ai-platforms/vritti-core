import {
  PaymentGatewayConfigStatusValues,
  paymentGatewayConfigStatus,
} from '@domain/payment-gateway-config/payment-gateway-config-status';
import { Injectable, Logger } from '@nestjs/common';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { PayoutChannel } from '@/db/schema';
import { PayoutChannelDto } from '../dto/entity/payout-channel.dto';
import {
  type PayoutChannelDetail,
  PayoutChannelDomainRepository,
  type PayoutChannelPaymentContext,
  type PayoutChannelScope,
  type SwitchedOnPayoutAccount,
} from '../repositories/payout-channel.repository';
import { PayoutChannelAccountDomainRepository } from '../repositories/payout-channel-account.repository';

const SPECIFICITY = { app: 8, site: 4, channel: 2 } as const;

export interface PayableGateway {
  gatewayCode: string;
  paymentGatewayConfigId: string;
}

@Injectable()
export class PayoutChannelDomainService {
  private readonly logger = new Logger(PayoutChannelDomainService.name);

  constructor(
    private readonly payoutChannelRepository: PayoutChannelDomainRepository,
    private readonly channelAccountRepository: PayoutChannelAccountDomainRepository,
  ) {}

  // Lists every channel of a legal entity, its sites' included, oldest first
  async listForLegalEntity(legalEntityId: string): Promise<PayoutChannelDto[]> {
    const rows = await this.payoutChannelRepository.findByLegalEntity(legalEntityId);
    return rows.map((row) => PayoutChannelDto.from(row));
  }

  // Loads the one row a write guards on; RLS hides other organizations' rows, so a miss is a 404
  async requireById(id: string): Promise<PayoutChannelDetail> {
    const row = await this.payoutChannelRepository.findDetailById(id);
    if (!row) throw new NotFoundException('Payout not found.');
    return row;
  }

  // Gives a scope a bank account; its payout accounts start switched off until the user turns them on
  async create(
    orgId: string,
    scope: PayoutChannelScope,
    bankAccountId: string,
  ): Promise<CreateResponseDto<PayoutChannelDto>> {
    const { scopeTaken } = await this.payoutChannelRepository.findConflicts(scope);
    if (scopeTaken) {
      throw new ConflictException({
        label: 'Payout Exists',
        detail: 'This scope already has a bank account. Change that payout instead.',
        errors: [{ field: 'bankAccountId', message: 'Scope already has a bank account' }],
      });
    }

    const created = await this.payoutChannelRepository.create({ organizationId: orgId, bankAccountId, ...scope });
    const row = await this.requireById(created.id);

    this.logger.log(`Created payout channel ${row.id} on bank account ${bankAccountId}`);
    return { success: true, message: 'Bank account added successfully.', data: PayoutChannelDto.from(row) };
  }

  // Moves the guarded channel to another bank account, its new payout accounts switched off
  async changeBankAccount(existing: PayoutChannelDetail, bankAccountId: string): Promise<SuccessResponseDto> {
    await this.payoutChannelRepository.transaction(async () => {
      await this.channelAccountRepository.switchOffAll(existing.id);
      await this.payoutChannelRepository.update(existing.id, { bankAccountId });
    });

    this.logger.log(`Moved payout channel ${existing.id} to bank account ${bankAccountId}`);
    return { success: true, message: 'Bank account changed successfully.' };
  }

  // Switches one payout account of the guarded channel's bank account on or off
  async switchAccount(
    existing: PayoutChannelDetail,
    payoutAccountId: string,
    switchedOn: boolean,
  ): Promise<SuccessResponseDto> {
    if (switchedOn) {
      await this.channelAccountRepository.switchOn({
        organizationId: existing.organizationId,
        payoutChannelId: existing.id,
        payoutAccountId,
        bankAccountId: existing.bankAccountId,
      });
    } else {
      await this.channelAccountRepository.switchOff(existing.id, payoutAccountId);
    }

    this.logger.log(`Switched payout account ${payoutAccountId} ${switchedOn ? 'on' : 'off'} for ${existing.id}`);
    return { success: true, message: `Payout account switched ${switchedOn ? 'on' : 'off'}.` };
  }

  // Removes the guarded channel; payments it covered fall back to the next wider scope, or stop
  async delete(existing: PayoutChannelDetail): Promise<SuccessResponseDto> {
    await this.payoutChannelRepository.delete(existing.id);

    this.logger.log(`Deleted payout channel ${existing.id}`);
    return { success: true, message: 'Bank account removed successfully.' };
  }

  // Resolves the payout account of the most specific channel for the gateway the shopper picked; a bank account
  // holds one payout account per gateway, so the channel has at most one
  async resolve(
    context: PayoutChannelPaymentContext,
    gatewayCode: string,
  ): Promise<SwitchedOnPayoutAccount | undefined> {
    const channel = mostSpecific(await this.payoutChannelRepository.findMatching(context));
    if (!channel) return undefined;
    const [account] = await this.payoutChannelRepository.findSwitchedOnAccounts(channel.id, gatewayCode);
    return account;
  }

  // Lists the gateways a payment can be taken through: those switched on for the most specific channel, each with
  // the gateway config it charges through
  async findPayableGateways(context: PayoutChannelPaymentContext): Promise<PayableGateway[]> {
    const channel = mostSpecific(await this.payoutChannelRepository.findMatching(context));
    if (!channel) return [];
    const accounts = await this.payoutChannelRepository.findSwitchedOnAccounts(channel.id);
    // A config still waiting for its key or webhook check is never offered at checkout
    return accounts
      .filter((account) => paymentGatewayConfigStatus(account.config) === PaymentGatewayConfigStatusValues.ACTIVE)
      .map((account) => ({
        gatewayCode: account.gatewayCode,
        paymentGatewayConfigId: account.paymentGatewayConfigId,
      }));
  }
}

// Picks the channel narrowed the furthest; one channel per scope, so two never score the same
function mostSpecific(channels: PayoutChannel[]): PayoutChannel | undefined {
  let best: PayoutChannel | undefined;
  let bestScore = -1;
  for (const channel of channels) {
    const score =
      (channel.appId ? SPECIFICITY.app : 0) +
      (channel.siteId ? SPECIFICITY.site : 0) +
      (channel.channel ? SPECIFICITY.channel : 0);
    if (score > bestScore) {
      best = channel;
      bestScore = score;
    }
  }
  return best;
}

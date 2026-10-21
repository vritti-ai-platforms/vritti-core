import { AppDomainRepository } from '@domain/app/repositories/app.repository';
import { LegalEntityDomainRepository } from '@domain/legal-entity/repositories/legal-entity.repository';
import { PayoutAccountDomainService } from '@domain/payout-account/services/payout-account.service';
import type { PayoutChannelDto } from '@domain/payout-channel/dto/entity/payout-channel.dto';
import type { CreatePayoutChannelDto } from '@domain/payout-channel/dto/request/create-payout-channel.dto';
import type { UpdatePayoutChannelDto } from '@domain/payout-channel/dto/request/update-payout-channel.dto';
import { PayoutChannelDomainService } from '@domain/payout-channel/services/payout-channel.service';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable } from '@nestjs/common';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PaymentChannelTypeValues } from '@/db/schema';

const PG_UNIQUE_VIOLATION = '23505';

// Payout channels of a legal entity: which of its payout accounts each scope pays out to. Checks the account, site
// and app; the domain keeps one channel per gateway per scope
@Injectable()
export class PayoutChannelService {
  constructor(
    private readonly payoutChannelService: PayoutChannelDomainService,
    private readonly payoutAccountService: PayoutAccountDomainService,
    private readonly legalEntityRepository: LegalEntityDomainRepository,
    private readonly siteRepository: SiteDomainRepository,
    private readonly appRepository: AppDomainRepository,
  ) {}

  async list(orgId: string, legalEntityId: string): Promise<PayoutChannelDto[]> {
    const legalEntity = await this.legalEntityRepository.findById(legalEntityId);
    if (!legalEntity || legalEntity.organizationId !== orgId) throw new NotFoundException('Legal entity not found.');
    return this.payoutChannelService.listForLegalEntity(orgId, legalEntityId);
  }

  async create(orgId: string, dto: CreatePayoutChannelDto): Promise<CreateResponseDto<PayoutChannelDto>> {
    const account = await this.requirePayoutAccount(orgId, dto.payoutAccountId);
    if (dto.siteId) await this.assertSiteInLegalEntity(orgId, account.legalEntityId, dto.siteId);
    if (dto.appId) await this.assertAppScope(orgId, dto);

    try {
      return await this.payoutChannelService.create(orgId, dto, account);
    } catch (error: unknown) {
      // The same payout account twice for one scope
      if (hasPgCode(error, PG_UNIQUE_VIOLATION)) {
        throw new ConflictException({
          label: 'Payout Channel Exists',
          detail: 'This payout account already covers this scope.',
          errors: [{ field: 'payoutAccountId', message: 'Already set up here' }],
        });
      }
      throw error;
    }
  }

  // A channel can move to another payout account of the same legal entity
  async update(orgId: string, id: string, dto: UpdatePayoutChannelDto): Promise<SuccessResponseDto> {
    const existing = await this.payoutChannelService.requireById(orgId, id);
    const account = await this.requirePayoutAccount(orgId, dto.payoutAccountId);
    if (account.legalEntityId !== existing.legalEntityId) {
      throw new BadRequestException({
        label: 'Invalid Payout Account',
        detail: 'A payout channel can only use payout accounts of its own legal entity.',
        errors: [{ field: 'payoutAccountId', message: 'Belongs to another legal entity' }],
      });
    }
    return this.payoutChannelService.update(orgId, id, account);
  }

  async delete(orgId: string, id: string): Promise<SuccessResponseDto> {
    return this.payoutChannelService.delete(orgId, id);
  }

  // A payout account the organization cannot see is a bad reference here, not a missing page
  private async requirePayoutAccount(orgId: string, payoutAccountId: string) {
    try {
      return await this.payoutAccountService.requireById(orgId, payoutAccountId);
    } catch (error: unknown) {
      if (!(error instanceof NotFoundException)) throw error;
      throw new BadRequestException({
        label: 'Invalid Payout Account',
        detail: 'The payout account does not exist in this organization.',
        errors: [{ field: 'payoutAccountId', message: 'Unknown payout account' }],
      });
    }
  }

  // Rejects a site that is missing, in another organization, or operated by a different legal entity
  private async assertSiteInLegalEntity(orgId: string, legalEntityId: string, siteId: string): Promise<void> {
    const site = await this.siteRepository.findById(siteId);
    if (!site || site.organizationId !== orgId || site.legalEntityId !== legalEntityId) {
      throw new BadRequestException({
        label: 'Invalid Site',
        detail: 'The site does not exist or is not operated by this legal entity.',
        errors: [{ field: 'siteId', message: 'Unknown site' }],
      });
    }
  }

  // Rejects an app outside the organization, and an app on anything but the APP channel
  private async assertAppScope(orgId: string, dto: CreatePayoutChannelDto): Promise<void> {
    if (dto.channel !== PaymentChannelTypeValues.APP) {
      throw new BadRequestException({
        label: 'Invalid App Scope',
        detail: `An app only takes payments through the ${PaymentChannelTypeValues.APP} channel.`,
        errors: [{ field: 'channel', message: 'Must be APP when an app is set' }],
      });
    }
    const app = await this.appRepository.findByIdInOrg(dto.appId as string, orgId);
    if (!app) {
      throw new BadRequestException({
        label: 'Invalid App',
        detail: 'The app does not exist or belongs to a different organization.',
        errors: [{ field: 'appId', message: 'Unknown app' }],
      });
    }
  }
}

// True for a Postgres error with the given code, however deep the driver wrapped it
function hasPgCode(error: unknown, code: string, depth = 0): boolean {
  if (!error || typeof error !== 'object' || depth > 5) return false;
  const candidate = error as { code?: unknown; cause?: unknown };
  if (candidate.code === code) return true;
  return hasPgCode(candidate.cause, code, depth + 1);
}

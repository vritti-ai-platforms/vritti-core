import { AppDomainRepository } from '@domain/app/repositories/app.repository';
import { BankAccountDomainRepository } from '@domain/bank-account/repositories/bank-account.repository';
import { LegalEntityDomainRepository } from '@domain/legal-entity/repositories/legal-entity.repository';
import { PayoutAccountDomainService } from '@domain/payout-account/services/payout-account.service';
import type { PayoutChannelDto } from '@domain/payout-channel/dto/entity/payout-channel.dto';
import type { CreatePayoutChannelDto } from '@domain/payout-channel/dto/request/create-payout-channel.dto';
import type { SwitchPayoutChannelAccountDto } from '@domain/payout-channel/dto/request/switch-payout-channel-account.dto';
import type { UpdatePayoutChannelDto } from '@domain/payout-channel/dto/request/update-payout-channel.dto';
import { PayoutChannelDomainService } from '@domain/payout-channel/services/payout-channel.service';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type BankAccount, PaymentChannelTypeValues } from '@/db/schema';

@Injectable()
export class PayoutChannelService {
  constructor(
    private readonly payoutChannelService: PayoutChannelDomainService,
    private readonly payoutAccountService: PayoutAccountDomainService,
    private readonly bankAccountRepository: BankAccountDomainRepository,
    private readonly legalEntityRepository: LegalEntityDomainRepository,
    private readonly siteRepository: SiteDomainRepository,
    private readonly appRepository: AppDomainRepository,
  ) {}

  // Lists a legal entity's payout channels; RLS hides another organization's legal entity, so it reads as missing
  async list(legalEntityId: string): Promise<PayoutChannelDto[]> {
    const legalEntity = await this.legalEntityRepository.findById(legalEntityId);
    if (!legalEntity) throw new NotFoundException('Legal entity not found.');
    return this.payoutChannelService.listForLegalEntity(legalEntityId);
  }

  // Gives a scope a bank account after checking the bank account, site and app
  async create(orgId: string, dto: CreatePayoutChannelDto): Promise<CreateResponseDto<PayoutChannelDto>> {
    const bankAccount = await this.requireBankAccount(dto.bankAccountId);
    if (dto.siteId) await this.assertSiteInLegalEntity(bankAccount.legalEntityId, dto.siteId);
    if (dto.appId) await this.assertAppScope(orgId, dto);
    return this.payoutChannelService.create(
      orgId,
      {
        legalEntityId: bankAccount.legalEntityId,
        siteId: dto.siteId ?? null,
        appId: dto.appId ?? null,
        channel: dto.channel ?? null,
      },
      bankAccount.id,
    );
  }

  // Moves a channel to another bank account of the same legal entity
  async update(id: string, dto: UpdatePayoutChannelDto): Promise<SuccessResponseDto> {
    const existing = await this.payoutChannelService.requireById(id);
    const bankAccount = await this.requireBankAccount(dto.bankAccountId);
    if (bankAccount.legalEntityId !== existing.legalEntityId) {
      throw new BadRequestException({
        label: 'Invalid Bank Account',
        detail: 'A payout can only use bank accounts of its own legal entity.',
        errors: [{ field: 'bankAccountId', message: 'Belongs to another legal entity' }],
      });
    }
    return this.payoutChannelService.changeBankAccount(existing, bankAccount.id);
  }

  // Switches one of the channel's bank account's payout accounts on or off
  async switchAccount(
    id: string,
    payoutAccountId: string,
    dto: SwitchPayoutChannelAccountDto,
  ): Promise<SuccessResponseDto> {
    const existing = await this.payoutChannelService.requireById(id);
    if (dto.switchedOn) {
      const account = await this.payoutAccountService.requireById(payoutAccountId);
      if (account.bankAccountId !== existing.bankAccountId) {
        throw new BadRequestException({
          label: 'Invalid Payout Account',
          detail: "Only payout accounts of this payout's bank account can be switched on.",
          errors: [{ field: 'payoutAccountId', message: 'Belongs to another bank account' }],
        });
      }
    }
    return this.payoutChannelService.switchAccount(existing, payoutAccountId, dto.switchedOn);
  }

  // Removes a payout channel after the one guard read
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.payoutChannelService.requireById(id);
    return this.payoutChannelService.delete(existing);
  }

  // Loads the bank account as a field error, since an unknown one is a bad reference rather than a missing page
  private async requireBankAccount(bankAccountId: string): Promise<BankAccount> {
    const bankAccount = await this.bankAccountRepository.findById(bankAccountId);
    if (!bankAccount) {
      throw new BadRequestException({
        label: 'Invalid Bank Account',
        detail: 'The bank account does not exist in this organization.',
        errors: [{ field: 'bankAccountId', message: 'Unknown bank account' }],
      });
    }
    return bankAccount;
  }

  // Rejects a site that is missing, as RLS hides other organizations', or run by a different legal entity
  private async assertSiteInLegalEntity(legalEntityId: string, siteId: string): Promise<void> {
    const site = await this.siteRepository.findById(siteId);
    if (!site || site.legalEntityId !== legalEntityId) {
      throw new BadRequestException({
        label: 'Invalid Site',
        detail: 'The site does not exist or is not operated by this legal entity.',
        errors: [{ field: 'siteId', message: 'Unknown site' }],
      });
    }
  }

  // Rejects an app outside the organization, or one on anything but the APP channel
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

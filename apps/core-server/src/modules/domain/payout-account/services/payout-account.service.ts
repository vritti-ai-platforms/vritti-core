import { Injectable, Logger } from '@nestjs/common';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PayoutAccountDto } from '../dto/entity/payout-account.dto';
import type { CreatePayoutAccountDto } from '../dto/request/create-payout-account.dto';
import type { UpdatePayoutAccountDto } from '../dto/request/update-payout-account.dto';
import { type PayoutAccountDetail, PayoutAccountDomainRepository } from '../repositories/payout-account.repository';

// Payout accounts: a bank account reached through one gateway account. Callers check the bank account and gateway
// and work out the main-account flag before writing; where an account is used lives on payout channels
@Injectable()
export class PayoutAccountDomainService {
  private readonly logger = new Logger(PayoutAccountDomainService.name);

  constructor(private readonly payoutAccountRepository: PayoutAccountDomainRepository) {}

  async listForBankAccount(orgId: string, bankAccountId: string): Promise<PayoutAccountDto[]> {
    const rows = await this.payoutAccountRepository.findDetailedByBankAccount(bankAccountId);
    return rows.filter((row) => row.organizationId === orgId).map((row) => PayoutAccountDto.from(row));
  }

  async listForLegalEntity(orgId: string, legalEntityId: string): Promise<PayoutAccountDto[]> {
    const rows = await this.payoutAccountRepository.findDetailedByLegalEntity(legalEntityId);
    return rows.filter((row) => row.organizationId === orgId).map((row) => PayoutAccountDto.from(row));
  }

  // Loads a payout account of the organization, hiding the rest behind the same 404
  async requireById(orgId: string, id: string): Promise<PayoutAccountDetail> {
    const row = await this.payoutAccountRepository.findDetailedById(id);
    if (!row || row.organizationId !== orgId) throw new NotFoundException('Payout account not found.');
    return row;
  }

  // Stores a checked payout account of the bank account's legal entity
  async create(
    orgId: string,
    legalEntityId: string,
    dto: CreatePayoutAccountDto,
    isMainAccount: boolean,
  ): Promise<CreateResponseDto<PayoutAccountDto>> {
    await this.assertGatewayAccountFree(dto.paymentGatewayConfigId, dto.gatewayAccountId);
    const created = await this.payoutAccountRepository.create({
      organizationId: orgId,
      legalEntityId,
      bankAccountId: dto.bankAccountId,
      paymentGatewayConfigId: dto.paymentGatewayConfigId,
      gatewayAccountId: dto.gatewayAccountId,
      isMainAccount,
    });
    const row = await this.requireById(orgId, created.id);

    this.logger.log(`Created payout account ${row.id} on bank account ${row.bankAccountId}`);
    return { success: true, message: 'Payout account added successfully.', data: PayoutAccountDto.from(row) };
  }

  // Changes the gateway account id, with its main-account flag worked out again by the caller
  async update(
    orgId: string,
    id: string,
    dto: UpdatePayoutAccountDto,
    isMainAccount?: boolean,
  ): Promise<SuccessResponseDto> {
    const existing = await this.requireById(orgId, id);
    if (dto.gatewayAccountId !== undefined) {
      await this.assertGatewayAccountFree(existing.paymentGatewayConfigId, dto.gatewayAccountId, id);
    }
    await this.payoutAccountRepository.update(id, {
      ...(dto.gatewayAccountId !== undefined && { gatewayAccountId: dto.gatewayAccountId }),
      ...(isMainAccount !== undefined && { isMainAccount }),
    });

    this.logger.log(`Updated payout account ${id}`);
    return { success: true, message: 'Payout account updated successfully.' };
  }

  async delete(orgId: string, id: string): Promise<SuccessResponseDto> {
    await this.requireById(orgId, id);
    await this.payoutAccountRepository.delete(id);

    this.logger.log(`Deleted payout account ${id}`);
    return { success: true, message: 'Payout account removed successfully.' };
  }

  // A gateway account is one payout account; the unique key backs this, the check gives the form a field
  private async assertGatewayAccountFree(
    paymentGatewayConfigId: string,
    gatewayAccountId: string,
    excludeId?: string,
  ): Promise<void> {
    const taken = await this.payoutAccountRepository.findByGatewayAccount(
      paymentGatewayConfigId,
      gatewayAccountId,
      excludeId,
    );
    if (!taken) return;
    throw new ConflictException({
      label: 'Gateway Account In Use',
      detail: 'This gateway account is already a payout account. Use that one in the payout channels instead.',
      errors: [{ field: 'gatewayAccountId', message: 'Already a payout account' }],
    });
  }
}

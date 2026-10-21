import type { BankAccountDomainRepository } from '@domain/bank-account/repositories/bank-account.repository';
import type { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import type { PayoutAccountDomainService } from '@domain/payout-account/services/payout-account.service';
import type { PayoutChannelDomainService } from '@domain/payout-channel/services/payout-channel.service';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { PaymentGatewaysGatewayService } from '@/modules/payments-gateway/gateways/services/payment-gateways-gateway.service';
import { PayoutAccountService } from './payout-account-api.service';

const ORG = 'org-1';
const LE = 'le-1';

interface Problem {
  label: string;
  errors: { field: string }[];
}

const problemOf = (error: unknown): Problem => (error as BadRequestException).getResponse() as Problem;

describe('PayoutAccountService', () => {
  const domain = {
    listForBankAccount: jest.fn(),
    listForLegalEntity: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    requireById: jest.fn(),
    delete: jest.fn(),
  };
  const channels = { countForPayoutAccount: jest.fn() };
  const configs = { findById: jest.fn() };
  const gateways = { supportsSplit: jest.fn() };
  const banks = { findById: jest.fn() };
  const service = new PayoutAccountService(
    domain as unknown as PayoutAccountDomainService,
    channels as unknown as PayoutChannelDomainService,
    configs as unknown as PaymentGatewayConfigDomainService,
    gateways as unknown as PaymentGatewaysGatewayService,
    banks as unknown as BankAccountDomainRepository,
  );

  const ownConfig = { id: 'cfg-1', kind: 'ORG', gatewayCode: 'razorpay', label: 'Main', gatewayAccountId: 'acc_main' };
  const dto = { bankAccountId: 'bank-1', paymentGatewayConfigId: 'cfg-1', gatewayAccountId: 'acc_linked' };

  beforeEach(() => {
    jest.resetAllMocks();
    banks.findById.mockResolvedValue({ id: 'bank-1', organizationId: ORG, legalEntityId: LE });
    configs.findById.mockResolvedValue(ownConfig);
    gateways.supportsSplit.mockResolvedValue(true);
    channels.countForPayoutAccount.mockResolvedValue(0);
    domain.create.mockResolvedValue({ success: true });
  });

  describe('create', () => {
    it("stores a linked account on the bank account's legal entity, without calling the gateway", async () => {
      await service.create(ORG, dto);

      expect(domain.create).toHaveBeenCalledWith(ORG, LE, dto, false);
    });

    it('marks the main account id as the main account', async () => {
      await service.create(ORG, { ...dto, gatewayAccountId: 'acc_main' });

      expect(domain.create).toHaveBeenCalledWith(ORG, LE, expect.anything(), true);
    });

    it('refuses any other account on a gateway that cannot split, on gatewayAccountId', async () => {
      gateways.supportsSplit.mockResolvedValue(false);

      const error = await service.create(ORG, dto).catch((e: unknown) => e);

      expect(problemOf(error)).toMatchObject({ label: 'Split Not Supported', errors: [{ field: 'gatewayAccountId' }] });
      expect(domain.create).not.toHaveBeenCalled();
    });

    it("refuses Vritti's own main account", async () => {
      configs.findById.mockResolvedValue({ ...ownConfig, kind: 'PLATFORM' });

      const error = await service.create(ORG, { ...dto, gatewayAccountId: 'acc_main' }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(problemOf(error).errors[0].field).toBe('gatewayAccountId');
    });

    it('hides a bank account of another organization', async () => {
      banks.findById.mockResolvedValue({ id: 'bank-1', organizationId: 'other', legalEntityId: LE });

      await expect(service.create(ORG, dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('turns a gateway the organization cannot see into a 400 on paymentGatewayConfigId', async () => {
      configs.findById.mockRejectedValue(new NotFoundException('Payment gateway config not found.'));

      const error = await service.create(ORG, dto).catch((e: unknown) => e);

      expect(problemOf(error).errors[0].field).toBe('paymentGatewayConfigId');
    });

    it('maps a gateway account that is already a payout account to 409', async () => {
      domain.create.mockRejectedValue({ cause: { code: '23505' } });

      await expect(service.create(ORG, dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update and delete', () => {
    beforeEach(() => {
      domain.requireById.mockResolvedValue({
        id: 'pa-1',
        paymentGatewayConfigId: 'cfg-1',
        gatewayAccountId: 'acc_linked',
      });
    });

    it('classifies a changed gateway account id again, and leaves an unchanged one alone', async () => {
      await service.update(ORG, 'pa-1', { gatewayAccountId: 'acc_linked' });
      expect(domain.update).toHaveBeenLastCalledWith(ORG, 'pa-1', { gatewayAccountId: 'acc_linked' }, undefined);

      await service.update(ORG, 'pa-1', { gatewayAccountId: 'acc_main' });
      expect(domain.update).toHaveBeenLastCalledWith(ORG, 'pa-1', { gatewayAccountId: 'acc_main' }, true);
    });

    it('refuses removing a payout account that payout channels use', async () => {
      channels.countForPayoutAccount.mockResolvedValue(2);

      const error = await service.delete(ORG, 'pa-1').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(domain.delete).not.toHaveBeenCalled();
    });
  });

  it('lists by bank account after checking it, or by legal entity', async () => {
    await service.list(ORG, { bankAccountId: 'bank-1' });
    expect(domain.listForBankAccount).toHaveBeenCalledWith(ORG, 'bank-1');

    await service.list(ORG, { legalEntityId: LE });
    expect(domain.listForLegalEntity).toHaveBeenCalledWith(ORG, LE);

    await expect(service.list(ORG, {})).rejects.toBeInstanceOf(BadRequestException);
  });
});

import type { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import type { RegisterPaymentLinkedAccountDto } from '@domain/payment-linked-account/dto/request/register-payment-linked-account.dto';
import type { PaymentLinkedAccountDomainService } from '@domain/payment-linked-account/services/payment-linked-account.service';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { PaymentLinkedAccountsGatewayService } from '@/modules/payments-gateway/linked-accounts/services/payment-linked-accounts-gateway.service';
import { PaymentLinkedAccountService } from './payment-linked-account-api.service';

const ORG = 'org-1';
const LE = 'le-1';

const dto: RegisterPaymentLinkedAccountDto = {
  collectorConfigId: 'pgc-1',
  bankAccountId: 'ba-2',
  email: 'accounts@acme.example',
  phone: '9876543210',
  legalBusinessName: 'Acme Kitchens',
  businessType: 'proprietorship',
  contactName: 'Asha Rao',
  category: 'food',
  subcategory: 'restaurant',
  address: { street1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038', country: 'IN' },
  pan: 'ABCDE1234F',
};

const reservation = {
  id: 'pla-1',
  collectorConfigId: 'pgc-1',
  bank: { accountNumber: '000123456789', ifscCode: 'HDFC0001234', beneficiaryName: 'Acme Kitchens' },
  resume: null,
};

describe('PaymentLinkedAccountService', () => {
  const domain = {
    listByCollector: jest.fn(),
    reserve: jest.fn(),
    markRegistered: jest.fn(),
    markFailed: jest.fn(),
    markPartial: jest.fn(),
    findInScope: jest.fn(),
    applyStatus: jest.fn(),
    delete: jest.fn(),
  };
  const configs = { getDecryptedCredentials: jest.fn() };
  const gateway = { createLinkedAccount: jest.fn(), fetchLinkedAccountStatus: jest.fn() };
  const service = new PaymentLinkedAccountService(
    domain as unknown as PaymentLinkedAccountDomainService,
    configs as unknown as PaymentGatewayConfigDomainService,
    gateway as unknown as PaymentLinkedAccountsGatewayService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    configs.getDecryptedCredentials.mockResolvedValue({
      gatewayCode: 'razorpay',
      keyId: 'rzp_live_abc',
      credentials: { key_id: 'rzp_live_abc', key_secret: 'secret' },
      webhookSecret: null,
    });
  });

  describe('register', () => {
    it('reserves, creates at the gateway with the row id as reference, and records the result', async () => {
      domain.reserve.mockResolvedValue(reservation);
      const result = {
        providerAccountId: 'acc_1',
        providerData: { stakeholderId: 'sth_1', productId: 'acc_prd_1' },
        status: 'IN_REVIEW',
        transfersAllowedAt: '2026-10-09T10:00:00.000Z',
      };
      gateway.createLinkedAccount.mockResolvedValue(result);
      domain.markRegistered.mockResolvedValue({ id: 'pla-1', status: 'IN_REVIEW' });

      const response = await service.register(ORG, { legalEntityId: LE }, dto);

      expect(domain.reserve).toHaveBeenCalledWith(ORG, { legalEntityId: LE }, dto);
      expect(configs.getDecryptedCredentials).toHaveBeenCalledWith(ORG, 'pgc-1');
      expect(gateway.createLinkedAccount).toHaveBeenCalledWith({
        gatewayCode: 'razorpay',
        credentials: { key_id: 'rzp_live_abc', key_secret: 'secret' },
        account: {
          referenceId: 'pla-1',
          email: dto.email,
          phone: dto.phone,
          legalBusinessName: dto.legalBusinessName,
          businessType: dto.businessType,
          contactName: dto.contactName,
          category: dto.category,
          subcategory: dto.subcategory,
          address: dto.address,
          pan: 'ABCDE1234F',
          bank: reservation.bank,
        },
      });
      expect(domain.markRegistered).toHaveBeenCalledWith('pla-1', result);
      expect(domain.markFailed).not.toHaveBeenCalled();
      expect(response).toEqual({
        success: true,
        message: 'Linked account for "Acme Kitchens" registered successfully.',
        data: { id: 'pla-1', status: 'IN_REVIEW' },
      });
    });

    it('marks the row FAILED with the problem detail and rethrows the original error', async () => {
      domain.reserve.mockResolvedValue(reservation);
      const rejection = { status: 400, detail: 'The IFSC code is invalid.', message: 'The IFSC code is invalid.' };
      gateway.createLinkedAccount.mockRejectedValue(rejection);

      const error = await service.register(ORG, {}, dto).catch((e: unknown) => e);

      expect(error).toBe(rejection);
      expect(domain.markFailed).toHaveBeenCalledWith('pla-1', 'The IFSC code is invalid.');
      expect(domain.markRegistered).not.toHaveBeenCalled();
    });

    it('keeps a partly created account and reports the failed step instead of registering it', async () => {
      domain.reserve.mockResolvedValue(reservation);
      const result = {
        providerAccountId: 'acc_1',
        providerData: { stakeholderId: 'sth_1' },
        status: 'PENDING',
        transfersAllowedAt: null,
        setupError: { label: 'Gateway Rejected Request', detail: 'Invalid IFSC.' },
      };
      gateway.createLinkedAccount.mockResolvedValue(result);

      const error = await service.register(ORG, {}, dto).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(domain.markPartial).toHaveBeenCalledWith('pla-1', result, 'Invalid IFSC.');
      expect(domain.markRegistered).not.toHaveBeenCalled();
    });

    it('passes the earlier attempt to the gateway so the setup resumes on the same account', async () => {
      const resume = { providerAccountId: 'acc_1', providerData: { stakeholderId: 'sth_1' } };
      domain.reserve.mockResolvedValue({ ...reservation, resume });
      gateway.createLinkedAccount.mockResolvedValue({
        providerAccountId: 'acc_1',
        providerData: { stakeholderId: 'sth_1', productId: 'acc_prd_1' },
        status: 'IN_REVIEW',
        transfersAllowedAt: '2026-10-10T10:00:00.000Z',
        setupError: null,
      });
      domain.markRegistered.mockResolvedValue({ id: 'pla-1', status: 'IN_REVIEW' });

      await service.register(ORG, {}, dto);

      expect(gateway.createLinkedAccount).toHaveBeenCalledWith(expect.objectContaining({ resume }));
      expect(domain.markRegistered).toHaveBeenCalled();
    });

    it('never calls the gateway when the reservation is rejected', async () => {
      domain.reserve.mockRejectedValue(new NotFoundException('Payment gateway config not found.'));

      await expect(service.register(ORG, { legalEntityId: 'le-other' }, dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(gateway.createLinkedAccount).not.toHaveBeenCalled();
      expect(domain.markFailed).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('asks the gateway for the status and records it', async () => {
      domain.findInScope.mockResolvedValue({
        id: 'pla-1',
        collectorConfigId: 'pgc-1',
        providerAccountId: 'acc_1',
        providerData: { productId: 'acc_prd_1' },
      });
      gateway.fetchLinkedAccountStatus.mockResolvedValue({ status: 'ACTIVE', requirements: [] });
      domain.applyStatus.mockResolvedValue({ id: 'pla-1', status: 'ACTIVE' });

      const result = await service.refresh(ORG, 'pla-1', { legalEntityId: LE });

      expect(gateway.fetchLinkedAccountStatus).toHaveBeenCalledWith({
        gatewayCode: 'razorpay',
        credentials: { key_id: 'rzp_live_abc', key_secret: 'secret' },
        providerAccountId: 'acc_1',
        providerData: { productId: 'acc_prd_1' },
      });
      expect(domain.applyStatus).toHaveBeenCalledWith('pla-1', 'ACTIVE');
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('ACTIVE');
    });

    it('rejects a linked account that never reached the gateway', async () => {
      domain.findInScope.mockResolvedValue({ id: 'pla-1', collectorConfigId: 'pgc-1', providerAccountId: null });

      await expect(service.refresh(ORG, 'pla-1', {})).rejects.toBeInstanceOf(BadRequestException);
      expect(gateway.fetchLinkedAccountStatus).not.toHaveBeenCalled();
    });
  });
});

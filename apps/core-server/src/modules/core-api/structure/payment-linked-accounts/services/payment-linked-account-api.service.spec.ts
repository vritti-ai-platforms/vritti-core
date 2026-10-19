import type { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import type { RegisterPaymentLinkedAccountDto } from '@domain/payment-linked-account/dto/request/register-payment-linked-account.dto';
import type { PaymentLinkedAccountDomainService } from '@domain/payment-linked-account/services/payment-linked-account.service';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
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
    it('refuses every registration while payout accounts are not available, before reserving anything', async () => {
      const error = await service.register(ORG, { legalEntityId: LE }, dto).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({ label: 'Not Available Yet' });
      expect(domain.reserve).not.toHaveBeenCalled();
      expect(gateway.createLinkedAccount).not.toHaveBeenCalled();
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

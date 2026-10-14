import type { AppDomainRepository } from '@domain/app/repositories/app.repository';
import type { BankAccountDomainRepository } from '@domain/bank-account/repositories/bank-account.repository';
import type { CreatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-payment-gateway-config.dto';
import type { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import type { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { PaymentGatewaysGatewayService } from '@/modules/payments-gateway/gateways/services/payment-gateways-gateway.service';
import { PaymentGatewayConfigService } from './payment-gateway-config-api.service';

const ORG = 'org-1';
const LE = 'le-1';

type Problem = { label: string; errors: { field: string; message: string }[] };

const problemOf = (error: unknown): Problem => (error as BadRequestException).getResponse() as Problem;

const input: CreatePaymentGatewayConfigDto = {
  legalEntityId: LE,
  bankAccountId: 'ba-1',
  type: 'APP',
  gatewayCode: 'razorpay',
  credentials: { key_id: 'rzp_live_abc', key_secret: 's' },
};

const GATEWAYS = [
  { code: 'razorpay', credentialFields: ['key_id', 'key_secret'], supportsSplit: true },
  { code: 'cashfree', credentialFields: ['app_id', 'secret_key'], supportsSplit: false },
];

describe('PaymentGatewayConfigService split payments', () => {
  const domain = { create: jest.fn(), update: jest.fn(), findById: jest.fn() };
  const bankAccounts = { findById: jest.fn() };
  const gateways = { listGateways: jest.fn() };
  const service = new PaymentGatewayConfigService(
    domain as unknown as PaymentGatewayConfigDomainService,
    bankAccounts as unknown as BankAccountDomainRepository,
    {} as SiteDomainRepository,
    {} as AppDomainRepository,
    gateways as unknown as PaymentGatewaysGatewayService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    bankAccounts.findById.mockResolvedValue({ id: 'ba-1', organizationId: ORG, legalEntityId: LE });
    gateways.listGateways.mockResolvedValue(GATEWAYS);
  });

  describe('create', () => {
    it.each([
      ['a gateway that supports splitting', 'razorpay'],
      ['a gateway that cannot split', 'cashfree'],
    ])('refuses split payments on %s while they are not wired end to end', async (_name, gatewayCode) => {
      const error = await service.create(ORG, { ...input, gatewayCode, splitEnabled: true }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(problemOf(error).label).toBe('Split Payments Not Available');
      expect(problemOf(error).errors).toEqual([{ field: 'splitEnabled', message: 'Not available yet' }]);
      expect(gateways.listGateways).not.toHaveBeenCalled();
      expect(domain.create).not.toHaveBeenCalled();
    });

    it('does not consult payments-service when split payments stay off', async () => {
      await service.create(ORG, { ...input, gatewayCode: 'cashfree' });

      expect(gateways.listGateways).not.toHaveBeenCalled();
      expect(domain.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it.each([
      ['razorpay'],
      ['cashfree'],
    ])('refuses switching split payments on for %s while they are not wired end to end', async (gatewayCode) => {
      domain.findById.mockResolvedValue({ legalEntityId: LE, gatewayCode, splitEnabled: false });

      const error = await service
        .update(ORG, 'pgc-1', { splitEnabled: true }, { legalEntityId: LE })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(problemOf(error).label).toBe('Split Payments Not Available');
      expect(problemOf(error).errors[0].field).toBe('splitEnabled');
      expect(domain.update).not.toHaveBeenCalled();
    });

    it('rejects a gateway change that cannot split while split payments are on', async () => {
      domain.findById.mockResolvedValue({ legalEntityId: LE, gatewayCode: 'razorpay', splitEnabled: true });

      await expect(
        service.update(ORG, 'pgc-1', { gatewayCode: 'cashfree' }, { legalEntityId: LE }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(domain.update).not.toHaveBeenCalled();
    });

    it('leaves an unrelated edit of a split config unchecked', async () => {
      domain.findById.mockResolvedValue({ legalEntityId: LE, gatewayCode: 'razorpay', splitEnabled: true });

      await service.update(ORG, 'pgc-1', { label: 'Storefront' }, { legalEntityId: LE });

      expect(gateways.listGateways).not.toHaveBeenCalled();
      expect(domain.update).toHaveBeenCalled();
    });

    it('allows switching split payments off on any gateway', async () => {
      domain.findById.mockResolvedValue({ legalEntityId: LE, gatewayCode: 'cashfree', splitEnabled: true });

      await service.update(ORG, 'pgc-1', { splitEnabled: false }, { legalEntityId: LE });

      expect(gateways.listGateways).not.toHaveBeenCalled();
      expect(domain.update).toHaveBeenCalled();
    });
  });
});

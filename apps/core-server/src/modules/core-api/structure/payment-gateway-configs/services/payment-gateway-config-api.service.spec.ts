import type { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import type { PaymentLinkedAccountDomainRepository } from '@domain/payment-linked-account/repositories/payment-linked-account.repository';
import { ConflictException, ForbiddenException } from '@vritti/api-sdk/exceptions';
import type { PaymentGatewaysGatewayService } from '@/modules/payments-gateway/gateways/services/payment-gateways-gateway.service';
import { PaymentGatewayConfigService } from './payment-gateway-config-api.service';

const ORG = 'org-1';

type Problem = { label: string; detail: string };

const problemOf = (error: unknown): Problem => (error as ConflictException).getResponse() as Problem;

const own = { id: 'pgc-1', kind: 'ORG', gatewayCode: 'razorpay' };
const platform = { id: 'pgc-platform', kind: 'PLATFORM', gatewayCode: 'razorpay' };

describe('PaymentGatewayConfigService', () => {
  const domain = {
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updatePlatform: jest.fn(),
  };
  const linkedAccounts = { countByCollector: jest.fn() };
  const gateways = { verifyConfig: jest.fn(), listGateways: jest.fn() };
  const service = new PaymentGatewayConfigService(
    domain as unknown as PaymentGatewayConfigDomainService,
    linkedAccounts as unknown as PaymentLinkedAccountDomainRepository,
    gateways as unknown as PaymentGatewaysGatewayService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    domain.findById.mockResolvedValue(own);
    linkedAccounts.countByCollector.mockResolvedValue(0);
    domain.delete.mockResolvedValue({ success: true, message: 'deleted' });
  });

  describe('own gateways', () => {
    it('refuses deleting a gateway that still has linked accounts, naming how many', async () => {
      linkedAccounts.countByCollector.mockResolvedValue(2);

      const error = await service.delete(ORG, 'pgc-1').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(problemOf(error).label).toBe('Gateway In Use');
      expect(problemOf(error).detail).toContain('2 linked accounts are');
      expect(domain.delete).not.toHaveBeenCalled();
    });

    it('deletes a gateway nothing depends on, mapping a foreign-key refusal to the same 409', async () => {
      await service.delete(ORG, 'pgc-1');
      expect(domain.delete).toHaveBeenCalledWith(ORG, 'pgc-1');

      domain.delete.mockRejectedValue(Object.assign(new Error('fk'), { cause: { code: '23503' } }));
      await expect(service.delete(ORG, 'pgc-1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses changing the gateway behind registered linked accounts, but allows other edits', async () => {
      linkedAccounts.countByCollector.mockResolvedValue(1);

      await expect(service.update(ORG, 'pgc-1', { gatewayCode: 'cashfree' })).rejects.toBeInstanceOf(ConflictException);
      expect(domain.update).not.toHaveBeenCalled();

      await service.update(ORG, 'pgc-1', { label: 'Main', gatewayCode: 'razorpay' });
      expect(domain.update).toHaveBeenCalledWith(ORG, 'pgc-1', { label: 'Main', gatewayCode: 'razorpay' });
    });

    it.each([
      'update',
      'delete',
      'verify',
    ] as const)('refuses %s on a platform row from an organization', async (action) => {
      domain.findById.mockResolvedValue(platform);

      const call =
        action === 'update'
          ? service.update(ORG, 'pgc-platform', { label: 'x' })
          : action === 'delete'
            ? service.delete(ORG, 'pgc-platform')
            : service.verify(ORG, 'pgc-platform');

      await expect(call).rejects.toBeInstanceOf(ForbiddenException);
      expect(gateways.verifyConfig).not.toHaveBeenCalled();
    });

    it('verifies an own gateway through payments-service', async () => {
      gateways.verifyConfig.mockResolvedValue({ success: true });

      await service.verify(ORG, 'pgc-1');

      expect(gateways.verifyConfig).toHaveBeenCalledWith(ORG, 'pgc-1');
    });
  });

  describe('platform gateways', () => {
    beforeEach(() => {
      domain.findById.mockResolvedValue(platform);
    });

    it('updates the fee on a platform row with the platform scope', async () => {
      await service.updatePlatform('pgc-platform', { platformFeeBps: 150 });

      expect(domain.findById).toHaveBeenCalledWith(null, 'pgc-platform');
      expect(domain.updatePlatform).toHaveBeenCalledWith('pgc-platform', { platformFeeBps: 150 });
    });

    it('refuses changing the gateway of a platform row once set up', async () => {
      const error = await service.updatePlatform('pgc-platform', { gatewayCode: 'cashfree' }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(problemOf(error).label).toBe('Gateway Cannot Change');
      expect(domain.updatePlatform).not.toHaveBeenCalled();
    });

    it('verifies and deletes with the platform scope, mapping a foreign-key refusal to 409', async () => {
      gateways.verifyConfig.mockResolvedValue({ success: true });
      await service.verifyPlatform('pgc-platform');
      expect(gateways.verifyConfig).toHaveBeenCalledWith(null, 'pgc-platform');

      await service.deletePlatform('pgc-platform');
      expect(domain.delete).toHaveBeenCalledWith(null, 'pgc-platform');

      domain.delete.mockRejectedValue({ code: '23503' });
      await expect(service.deletePlatform('pgc-platform')).rejects.toBeInstanceOf(ConflictException);
    });
  });
});

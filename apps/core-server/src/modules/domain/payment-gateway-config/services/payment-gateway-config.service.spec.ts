import type { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@vritti/api-sdk/exceptions';
import type { PaymentGatewayConfig } from '@/db/schema';
import { PaymentCredentialsCryptoService } from '@/services/payment-credentials-crypto.service';
import type { CreatePaymentGatewayConfigDto } from '../dto/request/create-payment-gateway-config.dto';
import type { PaymentGatewayConfigDomainRepository } from '../repositories/payment-gateway-config.repository';
import { PaymentGatewayConfigDomainService } from './payment-gateway-config.service';

const ORG = 'org-1';

type Problem = { label: string; errors: { field: string; message: string }[] };

const crypto = new PaymentCredentialsCryptoService({
  getOrThrow: () => 'unit-test-payment-credentials-key-0000',
} as unknown as ConfigService);

const row = (overrides: Partial<PaymentGatewayConfig> = {}): PaymentGatewayConfig => ({
  id: 'pgc-1',
  organizationId: ORG,
  kind: 'ORG',
  gatewayCode: 'razorpay',
  label: 'Main',
  keyId: 'rzp_live_abc',
  credentials: crypto.encrypt(JSON.stringify({ key_id: 'rzp_live_abc', key_secret: 'stored-secret' })),
  webhookSecret: null,
  providerMerchantId: null,
  platformFeeBps: 0,
  verifiedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const platformRow = (overrides: Partial<PaymentGatewayConfig> = {}): PaymentGatewayConfig =>
  row({
    id: 'pgc-platform',
    organizationId: null,
    kind: 'PLATFORM',
    label: 'Vritti Razorpay',
    keyId: 'rzp_live_platform',
    credentials: crypto.encrypt(JSON.stringify({ key_id: 'rzp_live_platform', key_secret: 'platform-secret' })),
    webhookSecret: crypto.encrypt('whsec_platform'),
    platformFeeBps: 150,
    ...overrides,
  });

const input: CreatePaymentGatewayConfigDto = {
  gatewayCode: 'razorpay',
  label: 'Main',
  credentials: { key_id: 'rzp_live_abc', key_secret: 'new-secret' },
};

const problemOf = (error: unknown): Problem => (error as BadRequestException).getResponse() as Problem;

describe('PaymentGatewayConfigDomainService', () => {
  const findGroup = jest.fn();
  const findByLabel = jest.fn();
  const create = jest.fn();
  const findById = jest.fn();
  const update = jest.fn();
  const remove = jest.fn();
  const repository = {
    findGroup,
    findByLabel,
    create,
    findById,
    update,
    delete: remove,
  } as unknown as PaymentGatewayConfigDomainRepository;
  const service = new PaymentGatewayConfigDomainService(repository, crypto);

  beforeEach(() => {
    jest.resetAllMocks();
    findGroup.mockResolvedValue([]);
    findByLabel.mockResolvedValue(undefined);
  });

  describe('list', () => {
    it('returns the own rows with full key ids, then the platform rows with the key id withheld', async () => {
      findGroup.mockImplementation(async (group: string | null) => (group === null ? [platformRow()] : [row()]));

      const result = await service.list(ORG);

      expect(result.map((config) => [config.kind, config.keyId])).toEqual([
        ['ORG', 'rzp_live_abc'],
        ['PLATFORM', null],
      ]);
      expect(result[1]).toMatchObject({ label: 'Vritti Razorpay', platformFeeBps: 150 });
      expect(result[0]).not.toHaveProperty('credentials');
    });

    it('lists the platform rows with their key ids for cloud admin', async () => {
      findGroup.mockResolvedValue([platformRow()]);

      const result = await service.listPlatform();

      expect(findGroup).toHaveBeenCalledWith(null);
      expect(result[0].keyId).toBe('rzp_live_platform');
    });
  });

  describe('create', () => {
    it('rejects an unknown gateway, attributed to gatewayCode', async () => {
      const error = await service.create(ORG, { ...input, gatewayCode: 'stripe' }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(problemOf(error).label).toBe('Unsupported Gateway');
      expect(create).not.toHaveBeenCalled();
    });

    it('rejects a missing credential field, naming it under credentials', async () => {
      const error = await service
        .create(ORG, { ...input, credentials: { key_id: 'rzp_live_abc' } })
        .catch((e: unknown) => e);

      expect(problemOf(error).label).toBe('Invalid Credentials');
      expect(problemOf(error).errors).toEqual([{ field: 'credentials.key_secret', message: 'Required' }]);
    });

    it('refuses a label another gateway of the organization already uses', async () => {
      findByLabel.mockResolvedValue(row({ id: 'pgc-other' }));

      const error = await service.create(ORG, input).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(problemOf(error).label).toBe('Label In Use');
      expect(problemOf(error).errors[0].field).toBe('label');
      expect(findByLabel).toHaveBeenCalledWith(ORG, 'Main', undefined);
      expect(create).not.toHaveBeenCalled();
    });

    it('stores an own gateway with the derived key id and encrypted credentials', async () => {
      create.mockImplementation(async (data: Partial<PaymentGatewayConfig>) => row(data));

      const result = await service.create(ORG, { ...input, webhookSecret: 'whsec_1' });

      const stored = create.mock.calls[0][0] as PaymentGatewayConfig;
      expect(stored).toMatchObject({
        organizationId: ORG,
        kind: 'ORG',
        label: 'Main',
        keyId: 'rzp_live_abc',
      });
      expect(stored.credentials).not.toContain('new-secret');
      expect(JSON.parse(crypto.decrypt(stored.credentials))).toEqual({
        key_id: 'rzp_live_abc',
        key_secret: 'new-secret',
      });
      expect(crypto.decrypt(stored.webhookSecret as string)).toBe('whsec_1');
      expect(result.message).toBe('Payment gateway "Main" connected successfully.');
      expect(result.data).not.toHaveProperty('credentials');
    });

    it('uses the gateway key field of the chosen provider', async () => {
      create.mockImplementation(async (data: Partial<PaymentGatewayConfig>) => row(data));

      await service.create(ORG, {
        ...input,
        gatewayCode: 'phonepe',
        credentials: { merchant_id: 'M1', client_id: 'c', client_secret: 's' },
      });

      expect((create.mock.calls[0][0] as PaymentGatewayConfig).keyId).toBe('M1');
    });
  });

  describe('createPlatform', () => {
    it('stores a PLATFORM row with no organization and its fee', async () => {
      create.mockImplementation(async (data: Partial<PaymentGatewayConfig>) => platformRow(data));

      const result = await service.createPlatform({
        ...input,
        label: 'Vritti Razorpay',
        credentials: { key_id: 'rzp_live_platform', key_secret: 'platform-secret' },
        platformFeeBps: 150,
      });

      const stored = create.mock.calls[0][0] as PaymentGatewayConfig;
      expect(stored).toMatchObject({
        organizationId: null,
        kind: 'PLATFORM',
        platformFeeBps: 150,
      });
      expect(findByLabel).toHaveBeenCalledWith(null, 'Vritti Razorpay', undefined);
      expect(result.data).toMatchObject({ kind: 'PLATFORM', keyId: 'rzp_live_platform' });
    });
  });

  describe('update', () => {
    it('keeps the stored ciphertext and key id when no credentials are sent', async () => {
      findById.mockResolvedValue(row());
      update.mockResolvedValue(row({ label: 'Renamed' }));

      const result = await service.update(ORG, 'pgc-1', { label: 'Renamed' });

      expect(findByLabel).toHaveBeenCalledWith(ORG, 'Renamed', 'pgc-1');
      expect(update).toHaveBeenCalledWith('pgc-1', { label: 'Renamed' });
      expect(result).toEqual({ success: true, message: 'Payment gateway "Renamed" updated successfully.' });
    });

    it('re-validates and re-encrypts when credentials are sent', async () => {
      const existing = row();
      findById.mockResolvedValue(existing);
      update.mockResolvedValue(existing);

      await service.update(ORG, 'pgc-1', { credentials: { key_id: 'rzp_live_new', key_secret: 'rotated' } });

      const patch = update.mock.calls[0][1] as Partial<PaymentGatewayConfig>;
      expect(patch.keyId).toBe('rzp_live_new');
      expect(JSON.parse(crypto.decrypt(patch.credentials as string))).toEqual({
        key_id: 'rzp_live_new',
        key_secret: 'rotated',
      });
      expect(patch.verifiedAt).toBeNull();
    });

    it('drops the old webhook secret, merchant id and verification when the gateway changes', async () => {
      findById.mockResolvedValue(
        row({ webhookSecret: crypto.encrypt('old'), providerMerchantId: 'MID1', verifiedAt: new Date() }),
      );
      update.mockResolvedValue(row());

      await service.update(ORG, 'pgc-1', {
        gatewayCode: 'hdfc-razorpay',
        credentials: { key_id: 'rzp_live_hdfc', key_secret: 's' },
      });

      expect(update.mock.calls[0][1]).toMatchObject({
        gatewayCode: 'hdfc-razorpay',
        webhookSecret: null,
        providerMerchantId: null,
        verifiedAt: null,
      });
    });

    it('rejects a gateway change that arrives without credentials', async () => {
      findById.mockResolvedValue(row());

      const error = await service.update(ORG, 'pgc-1', { gatewayCode: 'cashfree' }).catch((e: unknown) => e);

      expect(problemOf(error).errors[0].field).toBe('credentials');
      expect(update).not.toHaveBeenCalled();
    });

    it('refuses an organization changing a platform row', async () => {
      findById.mockResolvedValue(platformRow());

      const error = await service.update(ORG, 'pgc-platform', { label: 'x' }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ForbiddenException);
      expect(problemOf(error).label).toBe('Managed By Vritti');
    });

    it('hides an ORG row from the platform caller and from another organization', async () => {
      findById.mockResolvedValue(row({ organizationId: 'org-2' }));

      await expect(service.update(ORG, 'pgc-1', { label: 'x' })).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.update(null, 'pgc-1', { label: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates the fee on a platform row alongside the shared fields', async () => {
      findById.mockResolvedValue(platformRow());
      update.mockResolvedValue(platformRow());

      await service.updatePlatform('pgc-platform', { platformFeeBps: 200 });

      expect(update).toHaveBeenCalledWith('pgc-platform', { platformFeeBps: 200 });
    });
  });

  describe('delete', () => {
    it('removes a row the organization owns', async () => {
      findById.mockResolvedValue(row());

      await service.delete(ORG, 'pgc-1');

      expect(remove).toHaveBeenCalledWith('pgc-1');
    });

    it('refuses an organization deleting a platform row, but lets the platform caller', async () => {
      findById.mockResolvedValue(platformRow());

      await expect(service.delete(ORG, 'pgc-platform')).rejects.toBeInstanceOf(ForbiddenException);
      await service.delete(null, 'pgc-platform');
      expect(remove).toHaveBeenCalledWith('pgc-platform');
    });
  });

  describe('getDecryptedCredentials', () => {
    it('round-trips an ORG row secrets back to plaintext', async () => {
      findById.mockResolvedValue(row({ webhookSecret: crypto.encrypt('whsec_1') }));

      await expect(service.getDecryptedCredentials(ORG, 'pgc-1')).resolves.toEqual({
        gatewayCode: 'razorpay',
        keyId: 'rzp_live_abc',
        credentials: { key_id: 'rzp_live_abc', key_secret: 'stored-secret' },
        webhookSecret: 'whsec_1',
      });
    });

    it('decrypts a platform row for any organization and for the platform caller', async () => {
      findById.mockResolvedValue(platformRow());
      const expected = {
        gatewayCode: 'razorpay',
        keyId: 'rzp_live_platform',
        credentials: { key_id: 'rzp_live_platform', key_secret: 'platform-secret' },
        webhookSecret: 'whsec_platform',
      };

      await expect(service.getDecryptedCredentials(ORG, 'pgc-platform')).resolves.toEqual(expected);
      await expect(service.getDecryptedCredentials(null, 'pgc-platform')).resolves.toEqual(expected);
    });

    it('hides a config of another organization behind not found', async () => {
      findById.mockResolvedValue(row({ organizationId: 'org-2' }));

      await expect(service.getDecryptedCredentials(ORG, 'pgc-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('markVerified', () => {
    it('stamps verifiedAt and records the merchant id the provider reported', async () => {
      findById.mockResolvedValue(row());
      update.mockImplementation(async (_id: string, patch: Partial<PaymentGatewayConfig>) => row(patch));

      const result = await service.markVerified(ORG, 'pgc-1', 'MID1');

      const patch = update.mock.calls[0][1] as Partial<PaymentGatewayConfig>;
      expect(patch.verifiedAt).toBeInstanceOf(Date);
      expect(patch.providerMerchantId).toBe('MID1');
      expect(result.data).toEqual({ verifiedAt: (patch.verifiedAt as Date).toISOString(), providerMerchantId: 'MID1' });
    });

    it('lets only the platform caller verify a platform row', async () => {
      findById.mockResolvedValue(platformRow());
      update.mockResolvedValue(platformRow());

      await expect(service.markVerified(ORG, 'pgc-platform', null)).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.markVerified(null, 'pgc-platform', 'MID-p')).resolves.toMatchObject({ success: true });
    });
  });

  describe('resolveForPayment', () => {
    it('resolves nothing until payout accounts can pick a gateway, even with gateways connected', async () => {
      findGroup.mockResolvedValue([row(), platformRow()]);

      await expect(service.resolveForPayment(ORG)).resolves.toBeNull();
    });
  });

  describe('findWebhookTarget', () => {
    it('returns the organization, gateway and decrypted secret of an ORG row the organization owns', async () => {
      findById.mockResolvedValue(row({ webhookSecret: crypto.encrypt('whsec_1') }));

      await expect(service.findWebhookTarget(ORG, 'pgc-1')).resolves.toEqual({
        id: 'pgc-1',
        organizationId: ORG,
        gatewayCode: 'razorpay',
        webhookSecret: 'whsec_1',
      });
    });

    it('answers a platform row for any organization with its decrypted secret', async () => {
      findById.mockResolvedValue(platformRow());

      await expect(service.findWebhookTarget(ORG, 'pgc-platform')).resolves.toMatchObject({
        organizationId: null,
        webhookSecret: 'whsec_platform',
      });
    });

    it('returns undefined for an unknown id or a config another organization owns', async () => {
      findById.mockResolvedValueOnce(undefined);
      await expect(service.findWebhookTarget(ORG, 'missing')).resolves.toBeUndefined();

      findById.mockResolvedValueOnce(row({ organizationId: 'org-other' }));
      await expect(service.findWebhookTarget(ORG, 'pgc-1')).resolves.toBeUndefined();
    });
  });

  describe('findById', () => {
    it('withholds the platform key id from an organization but not from the platform caller', async () => {
      findById.mockResolvedValue(platformRow());

      await expect(service.findById(ORG, 'pgc-platform')).resolves.toMatchObject({ keyId: null });
      await expect(service.findById(null, 'pgc-platform')).resolves.toMatchObject({ keyId: 'rzp_live_platform' });
    });

    it('never surfaces the secret columns on the dto', async () => {
      findById.mockResolvedValue(row({ webhookSecret: crypto.encrypt('whsec_1') }));

      const dto = await service.findById(ORG, 'pgc-1');

      expect(dto).toMatchObject({ hasWebhookSecret: true, keyId: 'rzp_live_abc', kind: 'ORG' });
      expect(dto).not.toHaveProperty('credentials');
      expect(dto).not.toHaveProperty('webhookSecret');
    });
  });
});

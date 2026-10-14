import type { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { PaymentGatewayConfig } from '@/db/schema';
import { PaymentCredentialsCryptoService } from '@/services/payment-credentials-crypto.service';
import type { CreatePaymentGatewayConfigDto } from '../dto/request/create-payment-gateway-config.dto';
import type { PaymentGatewayConfigDomainRepository } from '../repositories/payment-gateway-config.repository';
import { PaymentGatewayConfigDomainService } from './payment-gateway-config.service';

const ORG = 'org-1';
const LE = 'le-1';
const BANK = 'ba-1';

type Problem = { label: string; errors: { field: string; message: string }[] };

const crypto = new PaymentCredentialsCryptoService({
  getOrThrow: () => 'unit-test-payment-credentials-key-0000',
} as unknown as ConfigService);

const row = (overrides: Partial<PaymentGatewayConfig> = {}): PaymentGatewayConfig => ({
  id: 'pgc-1',
  organizationId: ORG,
  legalEntityId: LE,
  type: 'APP',
  siteId: null,
  appId: null,
  gatewayCode: 'razorpay',
  bankAccountId: BANK,
  label: null,
  keyId: 'rzp_live_abc',
  credentials: crypto.encrypt(JSON.stringify({ key_id: 'rzp_live_abc', key_secret: 'stored-secret' })),
  webhookSecret: null,
  providerMerchantId: null,
  splitEnabled: false,
  verifiedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const input: CreatePaymentGatewayConfigDto = {
  legalEntityId: LE,
  bankAccountId: BANK,
  type: 'APP',
  gatewayCode: 'razorpay',
  credentials: { key_id: 'rzp_live_abc', key_secret: 'new-secret' },
};

const problemOf = (error: unknown): Problem => (error as BadRequestException).getResponse() as Problem;

describe('PaymentGatewayConfigDomainService', () => {
  const findSlotOccupant = jest.fn();
  const create = jest.fn();
  const findById = jest.fn();
  const update = jest.fn();
  const findCandidatesForContext = jest.fn();
  const repository = {
    findSlotOccupant,
    create,
    findById,
    update,
    findCandidatesForContext,
  } as unknown as PaymentGatewayConfigDomainRepository;
  const service = new PaymentGatewayConfigDomainService(repository, crypto);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('rejects an unknown gateway, attributed to gatewayCode', async () => {
      const error = await service.create(ORG, { ...input, gatewayCode: 'stripe' }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(problemOf(error).label).toBe('Unsupported Gateway');
      expect(problemOf(error).errors).toEqual([{ field: 'gatewayCode', message: 'Unsupported gateway' }]);
      expect(findSlotOccupant).not.toHaveBeenCalled();
    });

    it('rejects a missing credential field, naming it under credentials', async () => {
      const error = await service
        .create(ORG, { ...input, credentials: { key_id: 'rzp_live_abc' } })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(problemOf(error).label).toBe('Invalid Credentials');
      expect(problemOf(error).errors).toEqual([{ field: 'credentials.key_secret', message: 'Required' }]);
      expect(create).not.toHaveBeenCalled();
    });

    it('rejects an empty credential value and a field the gateway does not use', async () => {
      const error = await service
        .create(ORG, { ...input, credentials: { key_id: '  ', key_secret: 's', extra: 'x' } })
        .catch((e: unknown) => e);

      expect(problemOf(error).errors).toEqual([
        { field: 'credentials.key_id', message: 'Required' },
        { field: 'credentials.extra', message: 'Not a field of this gateway' },
      ]);
    });

    it('rejects a slot another config occupies with a 409, whatever its gateway or bank account', async () => {
      findSlotOccupant.mockResolvedValue(row({ gatewayCode: 'cashfree', bankAccountId: 'ba-other' }));

      const error = await service.create(ORG, input).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(problemOf(error).label).toBe('Slot Already Configured');
      expect(problemOf(error).errors[0].field).toBe('gatewayCode');
      expect(findSlotOccupant).toHaveBeenCalledWith(LE, 'APP', null, null, undefined);
      expect(create).not.toHaveBeenCalled();
    });

    it('derives keyId from the gateway key field and stores encrypted credentials', async () => {
      findSlotOccupant.mockResolvedValue(undefined);
      create.mockImplementation(async (data: Partial<PaymentGatewayConfig>) => row({ ...data, label: 'Storefront' }));

      const result = await service.create(ORG, { ...input, label: 'Storefront', webhookSecret: 'whsec_1' });

      const stored = create.mock.calls[0][0] as PaymentGatewayConfig;
      expect(stored.keyId).toBe('rzp_live_abc');
      expect(stored.credentials).not.toContain('new-secret');
      expect(JSON.parse(crypto.decrypt(stored.credentials))).toEqual({
        key_id: 'rzp_live_abc',
        key_secret: 'new-secret',
      });
      expect(crypto.decrypt(stored.webhookSecret as string)).toBe('whsec_1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment gateway config "Storefront" created successfully.');
      expect(result.data).toMatchObject({ id: 'pgc-1', keyId: 'rzp_live_abc', hasWebhookSecret: true });
      expect(result.data).not.toHaveProperty('credentials');
      expect(result.data).not.toHaveProperty('webhookSecret');
    });

    it('defaults splitEnabled to false and stores it when sent', async () => {
      findSlotOccupant.mockResolvedValue(undefined);
      create.mockImplementation(async (data: Partial<PaymentGatewayConfig>) => row(data));

      const plain = await service.create(ORG, input);
      const split = await service.create(ORG, { ...input, splitEnabled: true });

      expect((create.mock.calls[0][0] as PaymentGatewayConfig).splitEnabled).toBe(false);
      expect((create.mock.calls[1][0] as PaymentGatewayConfig).splitEnabled).toBe(true);
      expect(plain.data.splitEnabled).toBe(false);
      expect(split.data.splitEnabled).toBe(true);
    });

    it('uses the gateway key field of the chosen provider', async () => {
      findSlotOccupant.mockResolvedValue(undefined);
      create.mockImplementation(async (data: Partial<PaymentGatewayConfig>) => row(data));

      await service.create(ORG, {
        ...input,
        gatewayCode: 'phonepe',
        credentials: { merchant_id: 'M1', client_id: 'c', client_secret: 's' },
      });

      expect((create.mock.calls[0][0] as PaymentGatewayConfig).keyId).toBe('M1');
    });
  });

  describe('update', () => {
    it('keeps the stored ciphertext and key id when no credentials are sent', async () => {
      findById.mockResolvedValue(row());
      update.mockResolvedValue(row({ label: 'Renamed' }));

      const result = await service.update(ORG, 'pgc-1', { label: 'Renamed' });

      expect(update).toHaveBeenCalledWith('pgc-1', { label: 'Renamed' });
      expect(findSlotOccupant).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Payment gateway config "Renamed" updated successfully.' });
    });

    it('re-validates and re-encrypts when credentials are sent', async () => {
      const existing = row();
      findById.mockResolvedValue(existing);
      update.mockResolvedValue(existing);

      await service.update(ORG, 'pgc-1', { credentials: { key_id: 'rzp_live_new', key_secret: 'rotated' } });

      const patch = update.mock.calls[0][1] as Partial<PaymentGatewayConfig>;
      expect(patch.keyId).toBe('rzp_live_new');
      expect(patch.credentials).not.toBe(existing.credentials);
      expect(JSON.parse(crypto.decrypt(patch.credentials as string))).toEqual({
        key_id: 'rzp_live_new',
        key_secret: 'rotated',
      });
      expect(patch.verifiedAt).toBeNull();
      expect(patch).not.toHaveProperty('webhookSecret');
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

      const patch = update.mock.calls[0][1] as Partial<PaymentGatewayConfig>;
      expect(patch).toMatchObject({
        gatewayCode: 'hdfc-razorpay',
        webhookSecret: null,
        providerMerchantId: null,
        verifiedAt: null,
      });
      expect(findSlotOccupant).not.toHaveBeenCalled();
    });

    it('keeps a webhook secret sent alongside a gateway change', async () => {
      findById.mockResolvedValue(row({ webhookSecret: crypto.encrypt('old') }));
      update.mockResolvedValue(row());

      await service.update(ORG, 'pgc-1', {
        gatewayCode: 'hdfc-razorpay',
        credentials: { key_id: 'rzp_live_hdfc', key_secret: 's' },
        webhookSecret: 'whsec_new',
      });

      const patch = update.mock.calls[0][1] as Partial<PaymentGatewayConfig>;
      expect(crypto.decrypt(patch.webhookSecret as string)).toBe('whsec_new');
    });

    it('rejects a config outside the caller legal entity as not found', async () => {
      findById.mockResolvedValue(row({ legalEntityId: 'le-other' }));

      await expect(service.update(ORG, 'pgc-1', { label: 'x' }, { legalEntityId: LE })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(update).not.toHaveBeenCalled();
    });

    it('rejects a gateway change that arrives without credentials', async () => {
      findById.mockResolvedValue(row());

      const error = await service.update(ORG, 'pgc-1', { gatewayCode: 'cashfree' }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(problemOf(error).errors[0].field).toBe('credentials');
      expect(update).not.toHaveBeenCalled();
    });

    it('re-runs the slot check when the slot changes', async () => {
      findById.mockResolvedValue(row());
      findSlotOccupant.mockResolvedValue(row({ id: 'pgc-2', siteId: 'site-1', type: 'POS' }));

      await expect(service.update(ORG, 'pgc-1', { type: 'POS', siteId: 'site-1' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(findSlotOccupant).toHaveBeenCalledWith(LE, 'POS', 'site-1', null, 'pgc-1');
      expect(update).not.toHaveBeenCalled();
    });

    it('patches splitEnabled only when sent', async () => {
      findById.mockResolvedValue(row());
      update.mockResolvedValue(row({ splitEnabled: true }));

      await service.update(ORG, 'pgc-1', { splitEnabled: true });

      expect(update).toHaveBeenCalledWith('pgc-1', { splitEnabled: true });
    });

    it('clears the webhook secret when null is sent', async () => {
      findById.mockResolvedValue(row({ webhookSecret: crypto.encrypt('old') }));
      update.mockResolvedValue(row());

      await service.update(ORG, 'pgc-1', { webhookSecret: null });

      expect(update).toHaveBeenCalledWith('pgc-1', { webhookSecret: null });
    });
  });

  describe('getDecryptedCredentials', () => {
    it('round-trips the stored secrets back to plaintext', async () => {
      findById.mockResolvedValue(row({ webhookSecret: crypto.encrypt('whsec_1') }));

      const result = await service.getDecryptedCredentials(ORG, 'pgc-1');

      expect(result).toEqual({
        gatewayCode: 'razorpay',
        keyId: 'rzp_live_abc',
        credentials: { key_id: 'rzp_live_abc', key_secret: 'stored-secret' },
        webhookSecret: 'whsec_1',
      });
    });
  });

  describe('markVerified', () => {
    it('stamps verifiedAt and records the merchant id the provider reported', async () => {
      findById.mockResolvedValue(row());
      update.mockImplementation(async (_id: string, patch: Partial<PaymentGatewayConfig>) =>
        row({ ...patch, label: 'Storefront' }),
      );

      const result = await service.markVerified(ORG, 'pgc-1', 'MID1');

      const patch = update.mock.calls[0][1] as Partial<PaymentGatewayConfig>;
      expect(patch.verifiedAt).toBeInstanceOf(Date);
      expect(patch.providerMerchantId).toBe('MID1');
      expect(result).toEqual({
        success: true,
        message: 'Payment gateway config "Storefront" verified successfully.',
        data: { verifiedAt: (patch.verifiedAt as Date).toISOString(), providerMerchantId: 'MID1' },
      });
    });

    it('keeps the stored merchant id when the provider reports none', async () => {
      findById.mockResolvedValue(row({ providerMerchantId: 'MID-stored' }));
      update.mockImplementation(async (_id: string, patch: Partial<PaymentGatewayConfig>) =>
        row({ ...patch, providerMerchantId: 'MID-stored' }),
      );

      const result = await service.markVerified(ORG, 'pgc-1', null);

      expect(update.mock.calls[0][1]).not.toHaveProperty('providerMerchantId');
      expect(result.data.providerMerchantId).toBe('MID-stored');
    });

    it('hides a config owned by another organization behind not found', async () => {
      findById.mockResolvedValue(row({ organizationId: 'org-2' }));

      await expect(service.markVerified(ORG, 'pgc-1', null)).rejects.toBeInstanceOf(NotFoundException);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('resolveForContext', () => {
    const leDefault = row({ id: 'le-default' });
    const leApp = row({ id: 'le-app', appId: 'app-1' });
    const outlet = row({ id: 'outlet', siteId: 'site-1' });
    const outletApp = row({ id: 'outlet-app', siteId: 'site-1', appId: 'app-1' });
    const context = { legalEntityId: LE, type: 'APP' as const, siteId: 'site-1', appId: 'app-1' };

    it('prefers the outlet + app pin over every wider config, whatever order they arrive in', async () => {
      findCandidatesForContext.mockResolvedValue([leDefault, leApp, outlet, outletApp]);

      await expect(service.resolveForContext(ORG, context)).resolves.toBe(outletApp);
      expect(findCandidatesForContext).toHaveBeenCalledWith(ORG, context);
    });

    it('falls back to the outlet pin, then the app pin, then the legal entity default', async () => {
      findCandidatesForContext.mockResolvedValue([leApp, leDefault, outlet]);
      await expect(service.resolveForContext(ORG, context)).resolves.toBe(outlet);

      findCandidatesForContext.mockResolvedValue([leDefault, leApp]);
      await expect(service.resolveForContext(ORG, context)).resolves.toBe(leApp);

      findCandidatesForContext.mockResolvedValue([leDefault]);
      await expect(service.resolveForContext(ORG, context)).resolves.toBe(leDefault);
    });

    it('keeps the first of equally specific candidates, which the repository orders newest first', async () => {
      const newer = row({ id: 'newer', gatewayCode: 'cashfree' });
      findCandidatesForContext.mockResolvedValue([newer, leDefault]);

      await expect(service.resolveForContext(ORG, context)).resolves.toBe(newer);
    });

    it('returns null when nothing serves the context', async () => {
      findCandidatesForContext.mockResolvedValue([]);

      await expect(service.resolveForContext(ORG, context)).resolves.toBeNull();
    });
  });

  describe('findWebhookTarget', () => {
    it('returns the organization, gateway and decrypted secret of a config the organization owns', async () => {
      findById.mockResolvedValue(row({ webhookSecret: crypto.encrypt('whsec_1') }));

      await expect(service.findWebhookTarget(ORG, 'pgc-1')).resolves.toEqual({
        id: 'pgc-1',
        organizationId: ORG,
        gatewayCode: 'razorpay',
        webhookSecret: 'whsec_1',
      });
      expect(findById).toHaveBeenCalledWith('pgc-1');
    });

    it('reports a config without a secret as null rather than failing', async () => {
      findById.mockResolvedValue(row());

      await expect(service.findWebhookTarget(ORG, 'pgc-1')).resolves.toMatchObject({ webhookSecret: null });
    });

    it('returns undefined for an unknown id', async () => {
      findById.mockResolvedValue(undefined);

      await expect(service.findWebhookTarget(ORG, 'missing')).resolves.toBeUndefined();
    });

    it('returns undefined for a config another organization owns, without decrypting its secret', async () => {
      findById.mockResolvedValue(row({ organizationId: 'org-other', webhookSecret: crypto.encrypt('whsec_1') }));

      await expect(service.findWebhookTarget(ORG, 'pgc-1')).resolves.toBeUndefined();
    });
  });

  describe('findById', () => {
    it('throws not found for a missing config', async () => {
      findById.mockResolvedValue(undefined);

      await expect(service.findById(ORG, 'missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('hides a config owned by another organization behind the same not found', async () => {
      findById.mockResolvedValue(row({ organizationId: 'org-2' }));

      await expect(service.findById(ORG, 'pgc-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('hides a config of another legal entity or bank account when a scope is given', async () => {
      findById.mockResolvedValue(row());

      await expect(service.findById(ORG, 'pgc-1', { legalEntityId: 'le-other' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(
        service.findById(ORG, 'pgc-1', { legalEntityId: LE, bankAccountId: 'ba-other' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.findById(ORG, 'pgc-1', { legalEntityId: LE, bankAccountId: BANK })).resolves.toMatchObject({
        id: 'pgc-1',
      });
    });

    it('never surfaces the secret columns on the dto', async () => {
      findById.mockResolvedValue(row({ webhookSecret: crypto.encrypt('whsec_1') }));

      const dto = await service.findById(ORG, 'pgc-1');

      expect(dto).toMatchObject({ hasWebhookSecret: true, keyId: 'rzp_live_abc' });
      expect(dto).not.toHaveProperty('credentials');
      expect(dto).not.toHaveProperty('webhookSecret');
    });
  });
});

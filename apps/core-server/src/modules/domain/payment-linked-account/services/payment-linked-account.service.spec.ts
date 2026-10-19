import type { PaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/entity/payment-gateway-config.dto';
import type { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { BankAccount, PaymentLinkedAccount } from '@/db/schema';
import type {
  PaymentLinkedAccountDomainRepository,
  PaymentLinkedAccountWithScope,
} from '../repositories/payment-linked-account.repository';
import { PaymentLinkedAccountDomainService } from './payment-linked-account.service';

const ORG = 'org-1';
const LE = 'le-1';
const COLLECTOR = 'pgc-1';
const BANK = 'ba-2';

type Problem = { label: string; errors: { field: string; message: string }[] };

const problemOf = (error: unknown): Problem => (error as BadRequestException).getResponse() as Problem;

const linked = (overrides: Partial<PaymentLinkedAccount> = {}): PaymentLinkedAccount => ({
  id: 'pla-1',
  organizationId: ORG,
  collectorConfigId: COLLECTOR,
  bankAccountId: BANK,
  providerAccountId: null,
  providerData: {},
  status: 'PENDING',
  transfersAllowedAt: null,
  lastError: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const withScope = (overrides: Partial<PaymentLinkedAccount> = {}): PaymentLinkedAccountWithScope => ({
  account: linked(overrides),
  recipientLegalEntityId: 'le-2',
});

const bankAccount = {
  id: BANK,
  organizationId: ORG,
  legalEntityId: 'le-2',
  accountHolderName: 'Acme Kitchens',
  accountNumber: '000123456789',
  ifscCode: 'HDFC0001234',
} as BankAccount;

describe('PaymentLinkedAccountDomainService', () => {
  const repository = {
    findByCollector: jest.fn(),
    findWithScopeById: jest.fn(),
    findByCollectorAndBankAccount: jest.fn(),
    findBankAccountInOrg: jest.fn(),
    findTransferable: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const configFindById = jest.fn();
  const gatewayConfigService = { findById: configFindById } as unknown as PaymentGatewayConfigDomainService;
  const service = new PaymentLinkedAccountDomainService(
    repository as unknown as PaymentLinkedAccountDomainRepository,
    gatewayConfigService,
  );

  const collector = () => ({ id: COLLECTOR, kind: 'ORG', gatewayCode: 'razorpay' }) as PaymentGatewayConfigDto;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('reserve', () => {
    const dto = { collectorConfigId: COLLECTOR, bankAccountId: BANK };

    it('inserts a PENDING row and returns the bank details from the bank account row', async () => {
      configFindById.mockResolvedValue(collector());
      repository.findBankAccountInOrg.mockResolvedValue(bankAccount);
      repository.findByCollectorAndBankAccount.mockResolvedValue(undefined);
      repository.create.mockResolvedValue(linked());

      const reservation = await service.reserve(ORG, { legalEntityId: LE }, dto);

      expect(configFindById).toHaveBeenCalledWith(ORG, COLLECTOR);
      expect(repository.create).toHaveBeenCalledWith({
        organizationId: ORG,
        collectorConfigId: COLLECTOR,
        bankAccountId: BANK,
        status: 'PENDING',
      });
      expect(reservation).toEqual({
        id: 'pla-1',
        collectorConfigId: COLLECTOR,
        bank: { accountNumber: '000123456789', ifscCode: 'HDFC0001234', beneficiaryName: 'Acme Kitchens' },
        resume: null,
      });
    });

    it('reuses a FAILED attempt that already reached the gateway so its setup resumes', async () => {
      configFindById.mockResolvedValue(collector());
      repository.findBankAccountInOrg.mockResolvedValue(bankAccount);
      repository.findByCollectorAndBankAccount.mockResolvedValue(
        linked({
          id: 'pla-old',
          status: 'FAILED',
          providerAccountId: 'acc_1',
          providerData: { stakeholderId: 'sth_1' },
        }),
      );

      const reservation = await service.reserve(ORG, {}, dto);

      expect(repository.delete).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith('pla-old', { status: 'PENDING', lastError: null });
      expect(reservation).toMatchObject({
        id: 'pla-old',
        resume: { providerAccountId: 'acc_1', providerData: { stakeholderId: 'sth_1' } },
      });
    });

    it('reuses the id of a FAILED attempt that never reached the gateway instead of inserting a new row', async () => {
      configFindById.mockResolvedValue(collector());
      repository.findBankAccountInOrg.mockResolvedValue(bankAccount);
      repository.findByCollectorAndBankAccount.mockResolvedValue(linked({ id: 'pla-old', status: 'FAILED' }));

      const reservation = await service.reserve(ORG, {}, dto);

      expect(repository.delete).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith('pla-old', { status: 'PENDING', lastError: null });
      expect(reservation).toMatchObject({ id: 'pla-old', resume: null });
    });

    it('answers 409 Already Registered when a concurrent registration wins the insert', async () => {
      configFindById.mockResolvedValue(collector());
      repository.findBankAccountInOrg.mockResolvedValue(bankAccount);
      repository.findByCollectorAndBankAccount.mockResolvedValue(undefined);
      repository.create.mockRejectedValue(
        Object.assign(new Error('insert failed'), { cause: { code: '23505', constraint: 'uq_x' } }),
      );

      const error = await service.reserve(ORG, {}, dto).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(problemOf(error).label).toBe('Already Registered');
    });

    it.each([
      ['an account number the gateway rejects', { accountNumber: 'AB12345' }],
      ['an account holder name over 120 characters', { accountHolderName: 'x'.repeat(121) }],
    ])('rejects %s as a 400 on bankAccountId before reserving', async (_name, overrides) => {
      configFindById.mockResolvedValue(collector());
      repository.findBankAccountInOrg.mockResolvedValue({ ...bankAccount, ...overrides });

      const error = await service.reserve(ORG, {}, dto).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(problemOf(error).label).toBe('Bank Account Not Supported');
      expect(problemOf(error).errors[0].field).toBe('bankAccountId');
      expect(repository.findByCollectorAndBankAccount).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rejects a bank account already linked to the collector with a 409', async () => {
      configFindById.mockResolvedValue(collector());
      repository.findBankAccountInOrg.mockResolvedValue(bankAccount);
      repository.findByCollectorAndBankAccount.mockResolvedValue(linked({ status: 'IN_REVIEW' }));

      const error = await service.reserve(ORG, {}, dto).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(problemOf(error).label).toBe('Already Registered');
      expect(problemOf(error).errors[0].field).toBe('bankAccountId');
      expect(repository.delete).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rejects a bank account outside the organization, attributed to bankAccountId', async () => {
      configFindById.mockResolvedValue(collector());
      repository.findBankAccountInOrg.mockResolvedValue(undefined);

      const error = await service.reserve(ORG, {}, dto).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(problemOf(error).errors[0].field).toBe('bankAccountId');
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('surfaces a collector of another organization as not found', async () => {
      configFindById.mockRejectedValue(new NotFoundException('Payment gateway config not found.'));

      await expect(service.reserve(ORG, {}, dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('markRegistered', () => {
    it('stores the provider id, opaque references and the transfer opening the gateway reported', async () => {
      repository.findWithScopeById.mockResolvedValue(
        withScope({ providerAccountId: 'acc_1', status: 'IN_REVIEW', transfersAllowedAt: new Date() }),
      );

      const dto = await service.markRegistered('pla-1', {
        providerAccountId: 'acc_1',
        providerData: { stakeholderId: 'sth_1', productId: 'acc_prd_1' },
        status: 'IN_REVIEW',
        transfersAllowedAt: '2026-10-09T10:00:00.000Z',
      });

      const patch = repository.update.mock.calls[0][1] as Partial<PaymentLinkedAccount>;
      expect(patch).toMatchObject({
        providerAccountId: 'acc_1',
        providerData: { stakeholderId: 'sth_1', productId: 'acc_prd_1' },
        status: 'IN_REVIEW',
        lastError: null,
      });
      expect((patch.transfersAllowedAt as Date).toISOString()).toBe('2026-10-09T10:00:00.000Z');
      expect(dto).toMatchObject({ id: 'pla-1', providerAccountId: 'acc_1', recipientLegalEntityId: 'le-2' });
    });
  });

  describe('markRegistered without a provider hold', () => {
    it('opens transfers immediately when the gateway reports no waiting period', async () => {
      repository.findWithScopeById.mockResolvedValue(withScope({ providerAccountId: 'v_1', status: 'ACTIVE' }));
      const before = Date.now();

      await service.markRegistered('pla-1', {
        providerAccountId: 'v_1',
        providerData: {},
        status: 'ACTIVE',
        transfersAllowedAt: null,
      });

      const patch = repository.update.mock.calls[0][1] as Partial<PaymentLinkedAccount>;
      expect((patch.transfersAllowedAt as Date).getTime()).toBeGreaterThanOrEqual(before);
      expect((patch.transfersAllowedAt as Date).getTime()).toBeLessThan(before + 5000);
    });
  });

  describe('markPartial', () => {
    it('keeps the provider account and references while marking the row FAILED', async () => {
      await service.markPartial(
        'pla-1',
        { providerAccountId: 'acc_1', providerData: { stakeholderId: 'sth_1' } },
        'Invalid IFSC.',
      );

      expect(repository.update).toHaveBeenCalledWith('pla-1', {
        providerAccountId: 'acc_1',
        providerData: { stakeholderId: 'sth_1' },
        status: 'FAILED',
        lastError: 'Invalid IFSC.',
      });
    });
  });

  describe('markFailed', () => {
    it('records FAILED with the reason', async () => {
      await service.markFailed('pla-1', 'Invalid IFSC');

      expect(repository.update).toHaveBeenCalledWith('pla-1', { status: 'FAILED', lastError: 'Invalid IFSC' });
    });
  });

  describe('scope', () => {
    it('hides a linked account of another organization behind a 404', async () => {
      repository.findWithScopeById.mockResolvedValue(withScope({ organizationId: 'org-other' }));

      await expect(service.findInScope(ORG, 'pla-1', {})).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes only the local row for a linked account in scope', async () => {
      repository.findWithScopeById.mockResolvedValue(withScope());

      const result = await service.delete(ORG, 'pla-1', { legalEntityId: LE });

      expect(repository.delete).toHaveBeenCalledWith('pla-1');
      expect(result.success).toBe(true);
    });
  });

  describe('listByCollector', () => {
    it('checks the collector is in scope before listing', async () => {
      configFindById.mockResolvedValue(collector());
      repository.findByCollector.mockResolvedValue([withScope()]);

      const result = await service.listByCollector(ORG, COLLECTOR, { legalEntityId: LE });

      expect(configFindById).toHaveBeenCalledWith(ORG, COLLECTOR);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ collectorConfigId: COLLECTOR, recipientLegalEntityId: 'le-2' });
    });
  });

  describe('applyStatus', () => {
    it('records the status and clears the last error', async () => {
      repository.findWithScopeById.mockResolvedValue(withScope({ status: 'ACTIVE' }));

      const dto = await service.applyStatus('pla-1', 'ACTIVE');

      expect(repository.update).toHaveBeenCalledWith('pla-1', { status: 'ACTIVE', lastError: null });
      expect(dto.status).toBe('ACTIVE');
    });
  });
});

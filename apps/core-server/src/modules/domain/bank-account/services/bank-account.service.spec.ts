import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { BankAccount } from '@/db/schema';
import type { CreateBankAccountDto } from '../dto/request/create-bank-account.dto';
import type { BankAccountDomainRepository } from '../repositories/bank-account.repository';
import { BankAccountDomainService } from './bank-account.service';

const ORG = 'org-1';
const LE = 'le-1';

const row = (overrides: Partial<BankAccount> = {}): BankAccount => ({
  id: 'ba-1',
  organizationId: ORG,
  legalEntityId: LE,
  label: null,
  accountHolderName: 'Acme Retail Pvt Ltd',
  accountNumber: '123456789012',
  ifscCode: 'HDFC0001234',
  bankName: 'HDFC Bank',
  branchName: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const input: CreateBankAccountDto = {
  legalEntityId: LE,
  accountHolderName: 'Acme Retail Pvt Ltd',
  accountNumber: '123456789012',
  ifscCode: 'HDFC0001234',
  bankName: 'HDFC Bank',
};

describe('BankAccountDomainService', () => {
  const findDuplicate = jest.fn();
  const create = jest.fn();
  const findById = jest.fn();
  const update = jest.fn();
  const repository = { findDuplicate, create, findById, update } as unknown as BankAccountDomainRepository;
  const service = new BankAccountDomainService(repository);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('rejects a number the legal entity already holds at the branch, attributed to accountNumber', async () => {
      findDuplicate.mockResolvedValue(row());

      const error = await service.create(ORG, input).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      const problem = (error as ConflictException).getResponse() as { label: string; errors: { field: string }[] };
      expect(problem.label).toBe('Duplicate Account');
      expect(problem.errors[0].field).toBe('accountNumber');
      expect(create).not.toHaveBeenCalled();
    });

    it('creates the account and returns its dto', async () => {
      findDuplicate.mockResolvedValue(undefined);
      create.mockResolvedValue(row({ label: 'Primary' }));

      const result = await service.create(ORG, input);

      expect(findDuplicate).toHaveBeenCalledWith(LE, '123456789012', 'HDFC0001234');
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ organizationId: ORG, legalEntityId: LE }));
      expect(result.success).toBe(true);
      expect(result.message).toBe('Bank account "Primary" created successfully.');
      expect(result.data).toMatchObject({
        id: 'ba-1',
        legalEntityId: LE,
        accountNumber: '123456789012',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('names the masked number when the account has no label', async () => {
      findDuplicate.mockResolvedValue(undefined);
      create.mockResolvedValue(row());

      const result = await service.create(ORG, input);

      expect(result.message).toBe('Bank account "****9012" created successfully.');
    });
  });

  describe('update', () => {
    it('re-runs the duplicate check when the IFSC changes', async () => {
      findById.mockResolvedValue(row());
      findDuplicate.mockResolvedValue(undefined);
      update.mockResolvedValue(row({ ifscCode: 'ICIC0004567' }));

      const result = await service.update(ORG, 'ba-1', { ifscCode: 'ICIC0004567' });

      expect(findDuplicate).toHaveBeenCalledWith(LE, '123456789012', 'ICIC0004567');
      expect(update).toHaveBeenCalledWith('ba-1', { ifscCode: 'ICIC0004567' });
      expect(result).toEqual({ success: true, message: 'Bank account "****9012" updated successfully.' });
    });

    it('skips the duplicate check when neither the number nor the IFSC changes', async () => {
      findById.mockResolvedValue(row());
      update.mockResolvedValue(row({ label: 'Payroll' }));

      await service.update(ORG, 'ba-1', { label: 'Payroll' });

      expect(findDuplicate).not.toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith('ba-1', { label: 'Payroll' });
    });

    it('rejects a changed number that collides with another account', async () => {
      findById.mockResolvedValue(row());
      findDuplicate.mockResolvedValue(row({ id: 'ba-2', accountNumber: '999999999999' }));

      await expect(service.update(ORG, 'ba-1', { accountNumber: '999999999999' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws not found for a missing account', async () => {
      findById.mockResolvedValue(undefined);

      await expect(service.findById(ORG, 'missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('hides an account owned by another organization behind the same not found', async () => {
      findById.mockResolvedValue(row({ organizationId: 'org-2' }));

      await expect(service.findById(ORG, 'ba-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

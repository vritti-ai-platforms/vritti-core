import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { PaymentTermDetail, PaymentTermsDomainRepository } from '../repositories/payment-terms.repository';
import { PaymentTermsDomainService } from './payment-terms.service';

beforeAll(() => Logger.overrideLogger(false));

const detail = (overrides: Partial<PaymentTermDetail> = {}): PaymentTermDetail =>
  ({
    id: 'pt-1',
    name: 'Net 30',
    isPublished: true,
    ruleCount: 1,
    totalPercent: '100',
    supplierCount: 0,
    enrollmentCount: 0,
    ...overrides,
  }) as PaymentTermDetail;

function serviceWith(repository: Record<string, jest.Mock>) {
  return new PaymentTermsDomainService(repository as unknown as PaymentTermsDomainRepository);
}

describe('PaymentTermsDomainService lookups', () => {
  it('returns the payment term', async () => {
    const service = serviceWith({ findById: jest.fn().mockResolvedValue({ id: 'pt-1' }) });
    await expect(service.findByIdOrThrow('pt-1')).resolves.toEqual({ id: 'pt-1' });
  });

  it('reports a payment term out of reach', async () => {
    const service = serviceWith({
      findById: jest.fn().mockResolvedValue(undefined),
      findDetail: jest.fn().mockResolvedValue(undefined),
    });
    await expect(service.findByIdOrThrow('pt-1')).rejects.toMatchObject({
      status: 404,
      response: expect.objectContaining({ detail: 'Payment term not found.' }),
    });
    await expect(service.findById('pt-1')).rejects.toMatchObject({ status: 404 });
  });

  it('changes only a draft', async () => {
    const service = serviceWith({ findDraft: jest.fn().mockResolvedValue(undefined) });
    await expect(service.findDraftOrThrow('pt-1')).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Payment term is published',
        detail: 'Unpublish the payment term before editing it.',
      }),
    });
  });
});

describe('PaymentTermsDomainService validations', () => {
  it('refuses a name another payment term uses', async () => {
    const service = serviceWith({ isNameTaken: jest.fn().mockResolvedValue(true) });
    await expect(service.create({ name: 'Net 30', baseline: 'INVOICE_DATE' })).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Name already used',
        errors: [{ field: 'name', message: 'Already used by another payment term' }],
      }),
    });
  });

  it('keeps a term suppliers use from being unpublished or deleted', async () => {
    const service = serviceWith({ findDetail: jest.fn().mockResolvedValue(detail({ enrollmentCount: 1 })) });
    await expect(service.unpublish('pt-1')).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Payment term in use',
        detail: 'Suppliers use this payment term. Move them to another payment term before you unpublish it.',
      }),
    });
    await expect(service.delete('pt-1')).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Payment term in use' }),
    });
  });
});

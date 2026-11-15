import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { CreateSupplierDto } from '../dto/request/create-supplier.dto';
import type { SuppliersDomainRepository } from '../repositories/suppliers.repository';
import { SuppliersDomainService } from './suppliers.service';

beforeAll(() => Logger.overrideLogger(false));

const createDto: CreateSupplierDto = {
  partyId: 'party-1',
  code: 'acme',
  currencyCode: 'INR',
  currencyCodes: ['INR'],
  defaultPaymentTermId: 'pt-1',
  purchasingBlocked: false,
  paymentBlocked: false,
  isActive: true,
};

const supplier = { id: 'sup-1', code: 'acme', partyName: 'Acme', currencyCodes: ['INR', 'USD'] };

function serviceWith(repository: Record<string, jest.Mock>) {
  return new SuppliersDomainService(repository as unknown as SuppliersDomainRepository);
}

describe('SuppliersDomainService validations', () => {
  it('reports a supplier out of reach', async () => {
    const service = serviceWith({
      findById: jest.fn().mockResolvedValue(undefined),
      findByIdWithParty: jest.fn().mockResolvedValue(undefined),
      findDetail: jest.fn().mockResolvedValue(undefined),
    });
    await expect(service.findByIdOrThrow('sup-1')).rejects.toMatchObject({ status: 404 });
    await expect(service.findWithPartyOrThrow('sup-1')).rejects.toMatchObject({ status: 404 });
    await expect(service.findById('sup-1')).rejects.toMatchObject({ status: 404 });
  });

  it('refuses a default payment term that is not published', async () => {
    const service = serviceWith({ isPaymentTermPublished: jest.fn().mockResolvedValue(false) });
    await expect(service.create(createDto)).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Invalid Default Payment Term',
        errors: [{ field: 'defaultPaymentTermId', message: 'Pick a published payment term' }],
      }),
    });
  });

  it('refuses a party that is already a supplier', async () => {
    const service = serviceWith({
      isPaymentTermPublished: jest.fn().mockResolvedValue(true),
      isPartySupplier: jest.fn().mockResolvedValue(true),
    });
    await expect(service.create(createDto)).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Already A Supplier',
        errors: [{ field: 'partyId', message: 'Already a supplier' }],
      }),
    });
  });

  it('refuses dropping a currency still in use, naming each use', async () => {
    const service = serviceWith({
      findById: jest.fn().mockResolvedValue(supplier),
      countCurrencyUsage: jest.fn().mockResolvedValue({ prices: 2, quotations: 0, purchaseOrders: 1 }),
    });
    await expect(
      service.changeCurrency('sup-1', { currencyCode: 'INR', currencyCodes: ['INR'] }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Currency In Use',
        detail: 'USD cannot be removed while 2 prices, 1 open purchase order of this supplier use it.',
        errors: [{ field: 'currencyCodes', message: 'USD is still in use' }],
      }),
    });
  });

  it('refuses deleting a supplier something still references', async () => {
    const service = serviceWith({
      findByIdWithParty: jest.fn().mockResolvedValue(supplier),
      countReferences: jest.fn().mockResolvedValue({ purchaseOrders: 1, quotations: 2, prices: 0 }),
    });
    await expect(service.delete('sup-1')).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Supplier In Use',
        detail:
          'Cannot delete "Acme" — it is referenced by 1 purchase order, 2 quotations. Remove those references first.',
      }),
    });
  });
});

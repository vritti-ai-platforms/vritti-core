import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { InvoiceableGoodsReceiptsRepository } from '../repositories/invoiceable-goods-receipts.repository';
import type { SupplierInvoiceHoldsDomainRepository } from '../repositories/supplier-invoice-holds.repository';
import type { SupplierInvoiceLinesDomainRepository } from '../repositories/supplier-invoice-lines.repository';
import type {
  SupplierInvoiceRow,
  SupplierInvoicesDomainRepository,
} from '../repositories/supplier-invoices.repository';
import { type SupplierInvoiceCreateContext, SupplierInvoicesDomainService } from './supplier-invoices.service';

beforeAll(() => Logger.overrideLogger(false));

const invoice = (overrides: Partial<SupplierInvoiceRow> = {}): SupplierInvoiceRow =>
  ({
    id: 'inv-1',
    invoiceNumber: 'INV-1',
    supplierId: 'sup-1',
    status: 'DRAFT',
    currencyCode: 'INR',
    exchangeRate: 1,
    taxDate: '2026-11-01',
    ...overrides,
  }) as SupplierInvoiceRow;

const context: SupplierInvoiceCreateContext = {
  siteId: 'site-1',
  leCurrencyCode: 'INR',
  supplierCurrencyCode: 'INR',
  supplierCurrencyCodes: ['INR', 'USD'],
  paymentTermId: 'pt-1',
  dueDate: '2026-12-01',
  createdBy: null,
};

const createDto = { supplierId: 'sup-1', invoiceNumber: 'INV-1', invoiceDate: '2026-11-01' };

function serviceWith(repository: Record<string, jest.Mock>) {
  return new SupplierInvoicesDomainService(
    repository as unknown as SupplierInvoicesDomainRepository,
    {} as SupplierInvoiceLinesDomainRepository,
    {} as SupplierInvoiceHoldsDomainRepository,
    {} as InvoiceableGoodsReceiptsRepository,
  );
}

const rejection = (label: string, field?: string) => ({
  response: expect.objectContaining(field ? { label, errors: [expect.objectContaining({ field })] } : { label }),
});

describe('SupplierInvoicesDomainService lookups', () => {
  it('reports an invoice out of reach', async () => {
    const service = serviceWith({ findDetail: jest.fn().mockResolvedValue(undefined) });
    await expect(service.findDetailOrThrow('inv-1')).rejects.toMatchObject({ status: 404 });
  });

  it('changes nothing on a cancelled invoice', async () => {
    const service = serviceWith({ findDetail: jest.fn().mockResolvedValue(invoice({ status: 'CANCELLED' })) });
    await expect(service.findEditableOrThrow('inv-1')).rejects.toMatchObject(rejection('Invoice cancelled'));
  });

  it('posts or deletes only a draft, saying what to do instead', async () => {
    const service = serviceWith({ findDetail: jest.fn().mockResolvedValue(invoice({ status: 'POSTED' })) });
    await expect(service.findDraftOrThrow('inv-1', 'post')).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Invoice is not a draft',
        detail: 'Invoice "INV-1" is already posted.',
      }),
    });
    await expect(service.findDraftOrThrow('inv-1', 'delete')).rejects.toMatchObject({
      response: expect.objectContaining({ detail: 'Invoice "INV-1" is posted; cancel it instead of deleting it.' }),
    });
  });
});

describe('SupplierInvoicesDomainService.create', () => {
  it('refuses a currency the supplier does not trade in', async () => {
    await expect(serviceWith({}).create({ ...createDto, currencyCode: 'EUR' }, context)).rejects.toMatchObject(
      rejection('Currency Not Accepted', 'currencyCode'),
    );
  });

  it('asks for an exchange rate on a foreign-currency invoice', async () => {
    await expect(serviceWith({}).create({ ...createDto, currencyCode: 'USD' }, context)).rejects.toMatchObject(
      rejection('Exchange Rate Required', 'exchangeRate'),
    );
  });

  it('refuses an invoice number the supplier already used', async () => {
    const service = serviceWith({ isInvoiceNumberTaken: jest.fn().mockResolvedValue(true) });
    await expect(service.create(createDto, context)).rejects.toMatchObject(
      rejection('Invoice already entered', 'invoiceNumber'),
    );
  });
});

describe('SupplierInvoicesDomainService.assertUpdatable', () => {
  it('refuses a repeated invoice number', async () => {
    const service = serviceWith({ isInvoiceNumberTaken: jest.fn().mockResolvedValue(true) });
    await expect(
      service.assertUpdatable(invoice(), { id: 'inv-1', invoiceNumber: 'INV-2' }, 'INR'),
    ).rejects.toMatchObject(rejection('Invoice already entered', 'invoiceNumber'));
  });

  it('locks the tax date once posted', async () => {
    await expect(
      serviceWith({}).assertUpdatable(invoice({ status: 'POSTED' }), { id: 'inv-1', taxDate: '2026-11-02' }, 'INR'),
    ).rejects.toMatchObject(rejection('Tax Date Locked', 'taxDate'));
  });

  it('keeps the rate at 1 for an invoice in the legal entity currency', async () => {
    await expect(
      serviceWith({}).assertUpdatable(invoice(), { id: 'inv-1', exchangeRate: 2 }, 'INR'),
    ).rejects.toMatchObject(rejection('Exchange rate is 1', 'exchangeRate'));
  });
});

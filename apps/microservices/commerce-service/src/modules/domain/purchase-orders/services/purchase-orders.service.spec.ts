import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type {
  PurchaseOrderLineCounters,
  PurchaseOrderRow,
  PurchaseOrdersDomainRepository,
} from '../repositories/purchase-orders.repository';
import { PurchaseOrdersDomainService } from './purchase-orders.service';

const line = (counters: Partial<PurchaseOrderLineCounters> = {}): PurchaseOrderLineCounters => ({
  purchaseOrderId: 'po-1',
  primaryUomQty: 100,
  freePrimaryQty: 10,
  receivedPrimaryQty: 0,
  invoicedPrimaryQty: 0,
  returnedPrimaryQty: 0,
  cancelledPrimaryQty: 0,
  ...counters,
});

function serviceWith(repository: Partial<Record<keyof PurchaseOrdersDomainRepository, jest.Mock>>) {
  return new PurchaseOrdersDomainService(repository as unknown as PurchaseOrdersDomainRepository);
}

beforeAll(() => Logger.overrideLogger(false));

describe('PurchaseOrdersDomainService.deriveStatuses', () => {
  const service = serviceWith({});

  it('is not received and has nothing to invoice before any receipt', () => {
    expect(service.deriveStatuses([line()])).toEqual({
      receiptStatus: 'NOT_RECEIVED',
      invoiceStatus: 'NOTHING_TO_INVOICE',
    });
  });

  it('is partially received and to invoice once some goods arrive', () => {
    expect(service.deriveStatuses([line({ receivedPrimaryQty: 40 })])).toEqual({
      receiptStatus: 'PARTIAL',
      invoiceStatus: 'TO_INVOICE',
    });
  });

  it('is fully received once received covers ordered plus free on every line', () => {
    const lines = [
      line({ receivedPrimaryQty: 110 }),
      line({ primaryUomQty: 5, freePrimaryQty: 0, receivedPrimaryQty: 5 }),
    ];
    expect(service.deriveStatuses(lines).receiptStatus).toBe('RECEIVED');
  });

  it('stays partial while one line is short', () => {
    const lines = [line({ receivedPrimaryQty: 110 }), line({ receivedPrimaryQty: 109.999 })];
    expect(service.deriveStatuses(lines).receiptStatus).toBe('PARTIAL');
  });

  it('counts a line cancelled short as fully received at what arrived', () => {
    expect(service.deriveStatuses([line({ receivedPrimaryQty: 60, cancelledPrimaryQty: 50 })]).receiptStatus).toBe(
      'RECEIVED',
    );
  });

  it('is partially invoiced until invoiced covers the due quantity on every line', () => {
    expect(service.deriveStatuses([line({ receivedPrimaryQty: 110, invoicedPrimaryQty: 50 })]).invoiceStatus).toBe(
      'PARTIAL',
    );
  });

  it('is invoiced once invoiced (with free) covers ordered + free − cancelled on every line', () => {
    expect(
      service.deriveStatuses([line({ receivedPrimaryQty: 60, cancelledPrimaryQty: 50, invoicedPrimaryQty: 60 })]),
    ).toEqual({ receiptStatus: 'RECEIVED', invoiceStatus: 'INVOICED' });
  });

  it('has nothing to invoice when what was received is returned', () => {
    expect(service.deriveStatuses([line({ receivedPrimaryQty: 20, returnedPrimaryQty: 20 })]).invoiceStatus).toBe(
      'NOTHING_TO_INVOICE',
    );
  });

  it('is not received for a PO without lines', () => {
    expect(service.deriveStatuses([])).toEqual({ receiptStatus: 'NOT_RECEIVED', invoiceStatus: 'NOTHING_TO_INVOICE' });
  });
});

describe('PurchaseOrdersDomainService.syncProgress', () => {
  it('writes only the orders whose derived statuses changed', async () => {
    const update = jest.fn();
    const service = serviceWith({
      findProgress: jest.fn().mockResolvedValue([
        { id: 'po-1', poNumber: 'PO-1', receiptStatus: 'NOT_RECEIVED', invoiceStatus: 'NOTHING_TO_INVOICE' },
        { id: 'po-2', poNumber: 'PO-2', receiptStatus: 'PARTIAL', invoiceStatus: 'TO_INVOICE' },
      ]),
      findLineCounters: jest
        .fn()
        .mockResolvedValue([
          line({ purchaseOrderId: 'po-1', receivedPrimaryQty: 110 }),
          line({ purchaseOrderId: 'po-2', receivedPrimaryQty: 30 }),
        ]),
      update,
    });

    await service.syncProgress(['po-1', 'po-2', 'po-1']);

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith('po-1', { receiptStatus: 'RECEIVED', invoiceStatus: 'TO_INVOICE' });
  });
});

const po = (overrides: Partial<PurchaseOrderRow> = {}): PurchaseOrderRow =>
  ({
    id: 'po-1',
    poNumber: 'PO-1',
    status: 'DRAFT',
    receiptStatus: 'NOT_RECEIVED',
    currencyCode: 'INR',
    exchangeRate: 1,
    conversionRates: {},
    itemCount: 0,
    totalAmount: 1000n,
    hasPostedGoodsReceipt: false,
    ...overrides,
  }) as PurchaseOrderRow;

const supplier = { id: 'sup-2', name: 'Acme', currencyCode: 'USD', currencyCodes: ['USD'], paymentTermId: 'pt-1' };

const rejection = (label: string, field?: string) => ({
  response: expect.objectContaining(field ? { label, errors: [expect.objectContaining({ field })] } : { label }),
});

describe('PurchaseOrdersDomainService validations', () => {
  it('reports a purchase order out of reach', async () => {
    const service = serviceWith({ findDetail: jest.fn().mockResolvedValue(undefined) });
    await expect(service.findDetailOrThrow('po-1')).rejects.toMatchObject({ status: 404 });
  });

  it('asks for an exchange rate when the order moves to another currency than the legal entity', async () => {
    const service = serviceWith({ update: jest.fn() });
    await expect(service.changeSupplier(po(), supplier, 'INR', undefined)).rejects.toMatchObject(
      rejection('Exchange Rate Required', 'exchangeRate'),
    );
  });

  it('marks delivery completed only on a confirmed order', () => {
    const service = serviceWith({});
    expect(() => service.assertDeliveryCompletable(po({ status: 'CONFIRMED' }))).not.toThrow();
    expect(() => service.assertDeliveryCompletable(po({ status: 'SENT' }))).toThrow(
      expect.objectContaining(rejection('Cannot Mark Delivery Completed')),
    );
  });

  it('refuses cancelling an order goods were received against', async () => {
    const service = serviceWith({ update: jest.fn() });
    await expect(
      service.changeStatus(po({ status: 'CONFIRMED', receiptStatus: 'PARTIAL' }), 'CANCELLED'),
    ).rejects.toMatchObject(rejection('Cannot Cancel'));
  });

  it('changes the supplier only of a draft without lines and posted receipts', async () => {
    const service = serviceWith({ update: jest.fn() });
    await expect(service.changeSupplier(po({ status: 'SENT' }), supplier, 'INR', 80)).rejects.toMatchObject(
      rejection('Cannot Change Supplier'),
    );
    await expect(service.changeSupplier(po({ itemCount: 1 }), supplier, 'INR', 80)).rejects.toMatchObject(
      rejection('Cannot Change Supplier'),
    );
    await expect(
      service.changeSupplier(po({ hasPostedGoodsReceipt: true }), supplier, 'INR', 80),
    ).rejects.toMatchObject(rejection('Cannot Change Supplier'));
  });

  it('locks rates once a receipt is posted', async () => {
    const service = serviceWith({ update: jest.fn() });
    await expect(service.changeExchangeRate(po({ hasPostedGoodsReceipt: true }), 80, 'INR')).rejects.toMatchObject(
      rejection('Cannot Change Exchange Rate'),
    );
    await expect(service.setConversionRate(po({ hasPostedGoodsReceipt: true }), 'USD', 80)).rejects.toMatchObject(
      rejection('Cannot Change Conversion Rate'),
    );
  });

  it('locks the tax date past confirmation', async () => {
    const service = serviceWith({ update: jest.fn() });
    await expect(service.updateTaxDate(po({ status: 'DELIVERY_COMPLETED' }), '2026-11-02')).rejects.toMatchObject(
      rejection('Cannot Change Tax Date', 'taxDate'),
    );
  });
});

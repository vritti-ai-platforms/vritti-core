import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { AddPurchaseOrderItemDto } from '../dto/request/add-purchase-order-item.dto';
import type {
  PurchaseOrderItemRow,
  PurchaseOrderItemsDomainRepository,
} from '../repositories/purchase-order-items.repository';
import { PurchaseOrderItemsDomainService, type PurchaseOrderLinesContext } from './purchase-order-items.service';

function setup(lines: Record<string, number | string>[] = []) {
  const addToCounters = jest.fn();
  const repository = {
    addToCounters,
    findByPurchaseOrderId: jest.fn().mockResolvedValue(lines),
  } as unknown as PurchaseOrderItemsDomainRepository;
  return { service: new PurchaseOrderItemsDomainService(repository), addToCounters };
}

beforeAll(() => Logger.overrideLogger(false));

describe('PurchaseOrderItemsDomainService counters', () => {
  it('moves received by the accepted quantity and rejected by the rejected one when a receipt posts', async () => {
    const { service, addToCounters } = setup();
    await service.applyReceipt(
      [{ purchaseOrderItemId: 'poi-1', acceptedPrimaryQty: 95.5, rejectedPrimaryQty: 4.5 }],
      'apply',
    );
    expect(addToCounters).toHaveBeenCalledWith('poi-1', { receivedPrimaryQty: 95.5, rejectedPrimaryQty: 4.5 });
  });

  it('moves the receipt counters back on reversal', async () => {
    const { service, addToCounters } = setup();
    await service.applyReceipt(
      [{ purchaseOrderItemId: 'poi-1', acceptedPrimaryQty: 10, rejectedPrimaryQty: 0 }],
      'reverse',
    );
    expect(addToCounters).toHaveBeenCalledWith('poi-1', { receivedPrimaryQty: -10, rejectedPrimaryQty: -0 });
  });

  it('moves invoiced by invoiced + free on post and back on cancel', async () => {
    const { service, addToCounters } = setup();
    await service.applyInvoicing([{ purchaseOrderItemId: 'poi-1', invoicedPrimaryQty: 110 }], 'apply');
    await service.applyInvoicing([{ purchaseOrderItemId: 'poi-1', invoicedPrimaryQty: 110 }], 'reverse');
    expect(addToCounters).toHaveBeenNthCalledWith(1, 'poi-1', { invoicedPrimaryQty: 110 });
    expect(addToCounters).toHaveBeenNthCalledWith(2, 'poi-1', { invoicedPrimaryQty: -110 });
  });

  it('cancels what each line still had to receive when the order closes short', async () => {
    const { service, addToCounters } = setup([
      { id: 'short', primaryUomQty: 100, freePrimaryQty: 10, cancelledPrimaryQty: 0, receivedPrimaryQty: 60.25 },
      { id: 'full', primaryUomQty: 50, freePrimaryQty: 0, cancelledPrimaryQty: 0, receivedPrimaryQty: 50 },
      { id: 'over', primaryUomQty: 20, freePrimaryQty: 0, cancelledPrimaryQty: 0, receivedPrimaryQty: 25 },
    ]);
    await expect(service.cancelRemaining('po-1')).resolves.toBe(1);
    expect(addToCounters).toHaveBeenCalledTimes(1);
    expect(addToCounters).toHaveBeenCalledWith('short', { cancelledPrimaryQty: 49.75 });
  });
});

const po = (overrides: Partial<PurchaseOrderLinesContext> = {}): PurchaseOrderLinesContext => ({
  id: 'po-1',
  poNumber: 'PO-1',
  status: 'DRAFT',
  hasPostedGoodsReceipt: false,
  currencyCode: 'INR',
  conversionRates: {},
  orderDate: '2026-11-01',
  taxDate: '2026-11-01',
  ...overrides,
});

const newLine = {
  inventoryItemId: 'item-1',
  uomId: 'uom-1',
  expectedDeliveryDate: '2026-11-05',
  primaryUomQty: 10,
  scheme: { buyQty: null, freeQty: null, hasScheme: false },
  supplierCurrencies: ['INR', 'USD'],
};

const addDto: AddPurchaseOrderItemDto = {
  purchaseOrderId: 'po-1',
  inventoryItemId: 'item-1',
  uomId: 'uom-1',
  uomQty: 1,
  unitPrice: { currency: 'INR', value: '10.00' },
};

const item = (overrides: Partial<PurchaseOrderItemRow> = {}): PurchaseOrderItemRow =>
  ({
    id: 'poi-1',
    inventoryItemId: 'item-1',
    uomId: 'uom-1',
    uomQty: 1,
    isTaxDateLocked: false,
    ...overrides,
  }) as PurchaseOrderItemRow;

const rejection = (label: string, field?: string) => ({
  response: expect.objectContaining(field ? { label, errors: [expect.objectContaining({ field })] } : { label }),
});

function serviceWith(repository: Record<string, jest.Mock>) {
  return new PurchaseOrderItemsDomainService(repository as unknown as PurchaseOrderItemsDomainRepository);
}

describe('PurchaseOrderItemsDomainService validations', () => {
  it('locks lines once the order is past confirmation or a receipt is posted', async () => {
    const service = serviceWith({});
    await expect(service.addItem(po({ status: 'DELIVERY_COMPLETED' }), addDto, newLine)).rejects.toMatchObject(
      rejection('Cannot Edit Line Items'),
    );
    await expect(service.removeItem(po({ hasPostedGoodsReceipt: true }), 'poi-1')).rejects.toMatchObject(
      rejection('Cannot Edit Line Items'),
    );
  });

  it('refuses a line expected before the order date', async () => {
    const service = serviceWith({});
    await expect(
      service.addItem(po(), addDto, { ...newLine, expectedDeliveryDate: '2026-10-31' }),
    ).rejects.toMatchObject(rejection('Delivery Before Order Date', 'expectedDeliveryDate'));
  });

  it('refuses an item already ordered in the same unit', async () => {
    const service = serviceWith({ isOrderedInUnit: jest.fn().mockResolvedValue(true) });
    await expect(service.addItem(po(), addDto, newLine)).rejects.toMatchObject(
      rejection('Already Ordered', 'inventoryItemId'),
    );
  });

  it('refuses a price in a currency the supplier does not trade in, or without a rate for it', async () => {
    const service = serviceWith({ isOrderedInUnit: jest.fn().mockResolvedValue(false) });
    const inEur: AddPurchaseOrderItemDto = { ...addDto, unitPrice: { currency: 'EUR', value: '1.00' } };
    await expect(service.addItem(po(), inEur, newLine)).rejects.toMatchObject(
      rejection('Currency Not Accepted', 'unitPrice'),
    );
    const inUsd: AddPurchaseOrderItemDto = { ...addDto, unitPrice: { currency: 'USD', value: '1.00' } };
    await expect(service.addItem(po(), inUsd, newLine)).rejects.toMatchObject(
      rejection('Conversion Rate Required', 'conversionRate'),
    );
  });

  it('reports a line that is not on the order', async () => {
    const service = serviceWith({ findOnPurchaseOrder: jest.fn().mockResolvedValue(undefined) });
    await expect(service.findOnPurchaseOrderOrThrow('po-1', 'poi-9')).rejects.toMatchObject({ status: 404 });
  });

  it('refuses setting a tax date and following the order at once, or on a locked line', async () => {
    const service = serviceWith({
      findDetailOnPurchaseOrder: jest.fn().mockResolvedValue(item({ isTaxDateLocked: true })),
    });
    const both = { purchaseOrderId: 'po-1', itemId: 'poi-1', taxDate: '2026-11-02', followPoTaxDate: true };
    await expect(service.updateItem(po(), both, newLine)).rejects.toMatchObject(
      rejection('Conflicting Tax Date', 'taxDate'),
    );
    const locked = { purchaseOrderId: 'po-1', itemId: 'poi-1', taxDate: '2026-11-02' };
    await expect(service.updateItem(po(), locked, newLine)).rejects.toMatchObject(
      rejection('Tax Date Locked', 'taxDate'),
    );
  });

  it('refuses changing the item of a line a goods receipt counts', async () => {
    const service = serviceWith({
      findDetailOnPurchaseOrder: jest.fn().mockResolvedValue(item()),
      isOnGoodsReceipt: jest.fn().mockResolvedValue(true),
    });
    const dto = { purchaseOrderId: 'po-1', itemId: 'poi-1', inventoryItemId: 'item-2' };
    await expect(service.updateItem(po(), dto, newLine)).rejects.toMatchObject(rejection('Cannot Change Item'));
  });

  it('refuses moving the order tax date while a following line is locked', async () => {
    const service = serviceWith({ hasLockedFollower: jest.fn().mockResolvedValue(true) });
    await expect(service.followPoTaxDate('po-1', '2026-11-02')).rejects.toMatchObject(
      rejection('Cannot Change Tax Date', 'taxDate'),
    );
  });
});

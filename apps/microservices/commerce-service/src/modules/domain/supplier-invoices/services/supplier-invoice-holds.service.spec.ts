import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { SupplierInvoiceHold } from '@/db/schema';
import type {
  HoldInvoiceFacts,
  HoldLineFacts,
  SupplierInvoiceHoldsDomainRepository,
} from '../repositories/supplier-invoice-holds.repository';
import type { SupplierInvoicesDomainRepository } from '../repositories/supplier-invoices.repository';
import { type ComputedHold, SupplierInvoiceHoldsDomainService } from './supplier-invoice-holds.service';

beforeAll(() => Logger.overrideLogger(false));

const invoice = (overrides: Partial<HoldInvoiceFacts> = {}): HoldInvoiceFacts => ({
  id: 'inv-1',
  currencyCode: 'INR',
  exchangeRate: 1,
  priceTolerancePct: 0,
  qtyTolerancePct: 0,
  amountTolerance: 0n,
  ...overrides,
});

const line = (overrides: Partial<HoldLineFacts> = {}): HoldLineFacts => ({
  supplierInvoiceLineId: 'line-1',
  purchaseOrderItemId: 'poi-1',
  inventoryItemName: 'Paracetamol 500',
  uomSymbol: 'strip',
  invoicedQty: 10,
  freeQty: 1,
  invoicedPrimaryQty: 100,
  freePrimaryQty: 10,
  unitPrice: 5000n,
  poNumber: 'PO-1',
  poExchangeRate: 1,
  poUnitPrice: 5000n,
  poPrimaryUomQty: 100,
  poFreePrimaryQty: 10,
  poCancelledPrimaryQty: 0,
  schemeBuyQty: 10,
  schemeFreeQty: 1,
  hasScheme: true,
  otherPostedInvoicedPrimaryQty: 0,
  lotNumber: 'B1',
  lotExpiryDate: '2028-01-01 00:00:00+00',
  receivedDate: '2026-11-01 00:00:00+00',
  ...overrides,
});

const hold = (overrides: Partial<SupplierInvoiceHold> = {}): SupplierInvoiceHold => ({
  id: 'hold-1',
  organizationId: 'org-1',
  supplierInvoiceId: 'inv-1',
  supplierInvoiceLineId: 'line-1',
  code: 'PRICE_DIFFERS',
  detail: 'PO-1 prices it at INR 50.00, the invoice at INR 55.00.',
  blocksPayment: true,
  status: 'OPEN',
  releasedBy: null,
  releasedAt: null,
  releaseReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const service = new SupplierInvoiceHoldsDomainService(
  {} as SupplierInvoiceHoldsDomainRepository,
  {} as SupplierInvoicesDomainRepository,
);
const codes = (holds: ComputedHold[]) => holds.map((computed) => computed.code);

describe('SupplierInvoiceHoldsDomainService.evaluate', () => {
  it('raises nothing when a line matches its PO line', () => {
    expect(service.evaluate(invoice(), [line()], 'INR')).toEqual([]);
  });

  it('holds a price beyond both the percentage and the amount tolerance', () => {
    expect(codes(service.evaluate(invoice(), [line({ unitPrice: 5500n })], 'INR'))).toEqual(['PRICE_DIFFERS']);
    expect(service.evaluate(invoice({ priceTolerancePct: 10 }), [line({ unitPrice: 5500n })], 'INR')).toEqual([]);
    expect(service.evaluate(invoice({ amountTolerance: 5000n }), [line({ unitPrice: 5500n })], 'INR')).toEqual([]);
    expect(codes(service.evaluate(invoice({ priceTolerancePct: 5 }), [line({ unitPrice: 5600n })], 'INR'))).toEqual([
      'PRICE_DIFFERS',
    ]);
  });

  it('holds invoicing more than the due quantity across posted invoices and this one, beyond the quantity tolerance', () => {
    expect(codes(service.evaluate(invoice(), [line({ otherPostedInvoicedPrimaryQty: 1 })], 'INR'))).toEqual([
      'INVOICED_MORE_THAN_ORDERED',
    ]);
    expect(
      service.evaluate(invoice({ qtyTolerancePct: 1 }), [line({ otherPostedInvoicedPrimaryQty: 1 })], 'INR'),
    ).toEqual([]);
  });

  it('holds every line of a PO line invoiced beyond its due quantity, summing the invoice lines of it', () => {
    const lines = [
      line({ supplierInvoiceLineId: 'a', invoicedQty: 6, freeQty: 0, invoicedPrimaryQty: 60, freePrimaryQty: 0 }),
      line({ supplierInvoiceLineId: 'b', invoicedQty: 6, freeQty: 1, invoicedPrimaryQty: 60, freePrimaryQty: 10 }),
    ];
    const holds = service
      .evaluate(invoice(), lines, 'INR')
      .filter((computed) => computed.code === 'INVOICED_MORE_THAN_ORDERED');
    expect(holds.map((computed) => computed.supplierInvoiceLineId)).toEqual(['a', 'b']);
  });

  it('holds free goods invoiced below what the scheme gives on the invoiced quantity', () => {
    expect(codes(service.evaluate(invoice(), [line({ freeQty: 0, freePrimaryQty: 0 })], 'INR'))).toEqual([
      'FREE_SHORT',
    ]);
    expect(service.evaluate(invoice(), [line({ hasScheme: false, freeQty: 0, freePrimaryQty: 0 })], 'INR')).toEqual([]);
  });

  it('holds a line whose order converts at another rate than the invoice', () => {
    expect(codes(service.evaluate(invoice({ exchangeRate: 83.5 }), [line({ poExchangeRate: 83 })], 'INR'))).toEqual([
      'RATE_DIFFERS',
    ]);
  });

  it('notes a short shelf life without blocking payment', () => {
    const [computed] = service.evaluate(invoice(), [line({ lotExpiryDate: '2027-03-01 00:00:00+00' })], 'INR');
    expect(computed).toMatchObject({ code: 'SHORT_EXPIRY', blocksPayment: false });
  });

  it('never raises the later-phase receipt holds', () => {
    const all = codes(
      service.evaluate(
        invoice({ exchangeRate: 2 }),
        [
          line({
            unitPrice: 9000n,
            freeQty: 0,
            freePrimaryQty: 0,
            otherPostedInvoicedPrimaryQty: 500,
            lotExpiryDate: '2026-12-01',
          }),
        ],
        'INR',
      ),
    );
    expect(all).not.toContain('QTY_NOT_RECEIVED');
    expect(all).not.toContain('QTY_NOT_RELEASED');
  });
});

describe('SupplierInvoiceHoldsDomainService.plan', () => {
  const computed: ComputedHold = {
    supplierInvoiceLineId: 'line-1',
    code: 'PRICE_DIFFERS',
    detail: 'PO-1 prices it at INR 50.00, the invoice at INR 55.00.',
    blocksPayment: true,
  };

  it('opens a hold for a new cause', () => {
    expect(service.plan('inv-1', [], [computed])).toEqual({
      inserts: [{ ...computed, supplierInvoiceId: 'inv-1', status: 'OPEN' }],
      updates: [],
    });
  });

  it('leaves an open hold with the same cause alone and updates its detail when it changes', () => {
    expect(service.plan('inv-1', [hold()], [computed])).toEqual({ inserts: [], updates: [] });
    expect(service.plan('inv-1', [hold()], [{ ...computed, detail: 'new' }]).updates).toEqual([
      { id: 'hold-1', changes: { detail: 'new', blocksPayment: true } },
    ]);
  });

  it('resolves a hold whose cause is gone, released or not', () => {
    expect(
      service.plan('inv-1', [hold(), hold({ id: 'hold-2', code: 'RATE_DIFFERS', status: 'RELEASED' })], []).updates,
    ).toEqual([
      { id: 'hold-1', changes: { status: 'RESOLVED' } },
      { id: 'hold-2', changes: { status: 'RESOLVED' } },
    ]);
    expect(service.plan('inv-1', [hold({ status: 'RESOLVED' })], [])).toEqual({ inserts: [], updates: [] });
  });

  it('reopens a resolved hold when its cause comes back', () => {
    expect(service.plan('inv-1', [hold({ status: 'RESOLVED' })], [computed]).updates).toEqual([
      {
        id: 'hold-1',
        changes: {
          status: 'OPEN',
          releasedBy: null,
          releasedAt: null,
          releaseReason: null,
          detail: computed.detail,
          blocksPayment: true,
        },
      },
    ]);
  });

  it('keeps a released hold released unless its detail changes', () => {
    const released = hold({
      status: 'RELEASED',
      releasedBy: 'user-1',
      releasedAt: new Date(),
      releaseReason: 'Agreed',
    });
    expect(service.plan('inv-1', [released], [computed]).updates).toEqual([]);
    expect(
      service.plan('inv-1', [released], [{ ...computed, detail: 'PO-1 at INR 50.00, invoice at INR 60.00.' }]).updates,
    ).toEqual([
      {
        id: 'hold-1',
        changes: {
          status: 'OPEN',
          releasedBy: null,
          releasedAt: null,
          releaseReason: null,
          detail: 'PO-1 at INR 50.00, invoice at INR 60.00.',
          blocksPayment: true,
        },
      },
    ]);
  });
});

describe('SupplierInvoiceHoldsDomainService.sync and release', () => {
  it('writes the planned holds and caches the open blocking count on the invoice', async () => {
    const repository = {
      findInvoiceFacts: jest.fn().mockResolvedValue(invoice()),
      findLineFacts: jest.fn().mockResolvedValue([line({ unitPrice: 5500n, lotExpiryDate: '2027-01-01 00:00:00+00' })]),
      findByInvoice: jest.fn().mockResolvedValue([hold({ id: 'stale', code: 'RATE_DIFFERS' })]),
      insertMany: jest.fn(),
      update: jest.fn(),
      countOpenBlocking: jest.fn().mockResolvedValue(1),
    };
    const invoices = { setOpenHoldCount: jest.fn() };
    const syncing = new SupplierInvoiceHoldsDomainService(
      repository as unknown as SupplierInvoiceHoldsDomainRepository,
      invoices as unknown as SupplierInvoicesDomainRepository,
    );

    await expect(syncing.sync('inv-1', 'INR')).resolves.toBe(1);
    expect(codes(repository.insertMany.mock.calls[0][0])).toEqual(['PRICE_DIFFERS', 'SHORT_EXPIRY']);
    expect(repository.update).toHaveBeenCalledWith('stale', { status: 'RESOLVED' });
    expect(invoices.setOpenHoldCount).toHaveBeenCalledWith('inv-1', 1);
  });

  it('releases only an open hold, recording who, when and why', async () => {
    const repository = {
      findOnInvoice: jest.fn().mockResolvedValue(hold()),
      update: jest.fn(),
      countOpenBlocking: jest.fn().mockResolvedValue(0),
    };
    const invoices = {
      transaction: jest.fn((callback: () => Promise<void>) => callback()),
      setOpenHoldCount: jest.fn(),
    };
    const releasing = new SupplierInvoiceHoldsDomainService(
      repository as unknown as SupplierInvoiceHoldsDomainRepository,
      invoices as unknown as SupplierInvoicesDomainRepository,
    );

    await releasing.release(
      { id: 'inv-1', invoiceNumber: 'INV-1' },
      { supplierInvoiceId: 'inv-1', id: 'hold-1', reason: 'Agreed' },
      'user-1',
    );
    expect(repository.update).toHaveBeenCalledWith(
      'hold-1',
      expect.objectContaining({
        status: 'RELEASED',
        releasedBy: 'user-1',
        releaseReason: 'Agreed',
        releasedAt: expect.any(Date),
      }),
    );
    expect(invoices.setOpenHoldCount).toHaveBeenCalledWith('inv-1', 0);

    repository.findOnInvoice.mockResolvedValue(hold({ status: 'RESOLVED' }));
    await expect(
      releasing.release(
        { id: 'inv-1', invoiceNumber: 'INV-1' },
        { supplierInvoiceId: 'inv-1', id: 'hold-1', reason: 'x' },
        'user-1',
      ),
    ).rejects.toMatchObject({ response: expect.objectContaining({ label: 'Hold Not Open' }) });
  });

  it('reports an invoice or a hold that is out of reach', async () => {
    const repository = {
      findInvoiceFacts: jest.fn().mockResolvedValue(undefined),
      findOnInvoice: jest.fn().mockResolvedValue(undefined),
    };
    const service = new SupplierInvoiceHoldsDomainService(
      repository as unknown as SupplierInvoiceHoldsDomainRepository,
      {} as SupplierInvoicesDomainRepository,
    );
    await expect(service.sync('inv-1', 'INR')).rejects.toMatchObject({ status: 404 });
    await expect(
      service.release(
        { id: 'inv-1', invoiceNumber: 'INV-1' },
        { supplierInvoiceId: 'inv-1', id: 'hold-1', reason: 'x' },
        'user-1',
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
});

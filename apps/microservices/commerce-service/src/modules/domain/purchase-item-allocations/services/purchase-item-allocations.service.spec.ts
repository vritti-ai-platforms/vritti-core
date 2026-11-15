import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { BadRequestException, ConflictException } from '@vritti/api-sdk/exceptions';
import type { PurchaseItemAllocation } from '@/db/schema';
import type { PurchaseItemAllocationsDomainRepository } from '../repositories/purchase-item-allocations.repository';
import { type AllocationContext, PurchaseItemAllocationsDomainService } from './purchase-item-allocations.service';

beforeAll(() => Logger.overrideLogger(false));

const context = (overrides: Partial<AllocationContext> = {}): AllocationContext => ({
  purchase: {
    id: 'pur-1',
    purchaseNumber: 'PUR-202611-0001',
    status: 'OPEN',
    step: 'SOURCING',
    quotationsRequired: false,
  },
  leg: { id: 'leg-1', step: 'SOURCING', status: 'OPEN', allowsUnpriced: false },
  purchaseItemId: 'pi-1',
  supplierCurrencies: ['INR', 'USD'],
  ...overrides,
});

const allocation = (overrides: Partial<PurchaseItemAllocation> = {}): PurchaseItemAllocation =>
  ({
    id: 'alloc-1',
    purchaseItemId: 'pi-1',
    purchaseSupplierId: 'leg-1',
    supplierQuotationItemId: 'sqi-1',
    uomId: 'uom-strip',
    uomQty: 10,
    primaryUomQty: 100,
    currencyCode: 'INR',
    unitPrice: 5_000n,
    schemeBuyQty: null,
    schemeFreeQty: null,
    hasScheme: false,
    freePrimaryQty: 0,
    ...overrides,
  }) as PurchaseItemAllocation;

const entered = {
  id: 'pur-1',
  purchaseItemId: 'pi-1',
  supplierId: 'sup-1',
  uomId: 'uom-strip',
  uomQty: 18,
  unitPrice: { currency: 'INR' as const, value: '12.50' },
};

function setup(existing?: PurchaseItemAllocation) {
  const repository = {
    create: jest.fn().mockImplementation((row) => Promise.resolve({ id: 'alloc-new', ...row })),
    update: jest.fn(),
    delete: jest.fn(),
    countByLeg: jest.fn().mockResolvedValue(0),
    findForItemAndLeg: jest.fn().mockResolvedValue(existing),
  };
  const service = new PurchaseItemAllocationsDomainService(
    repository as unknown as PurchaseItemAllocationsDomainRepository,
  );
  return { service, repository };
}

describe('PurchaseItemAllocationsDomainService.quotedQuantity', () => {
  const { service } = setup();

  it('rounds the requested primary quantity up to whole quotation units', () => {
    expect(service.quotedQuantity(95, 10)).toEqual({ uomQty: 10, primaryUomQty: 100 });
    expect(service.quotedQuantity(100, 10)).toEqual({ uomQty: 10, primaryUomQty: 100 });
    expect(service.quotedQuantity(1, 12)).toEqual({ uomQty: 1, primaryUomQty: 12 });
  });

  it('keeps fractional unit sizes exact', () => {
    expect(service.quotedQuantity(0.7, 0.1)).toEqual({ uomQty: 7, primaryUomQty: 0.7 });
    expect(service.quotedQuantity(1, 0.333)).toEqual({ uomQty: 4, primaryUomQty: 1.332 });
  });
});

describe('PurchaseItemAllocationsDomainService entered allocations', () => {
  it('is refused on a purchase that requires quotations', () => {
    const { service } = setup();
    expect(() => service.assertEnteredAllowed(context().purchase)).not.toThrow();
    expect(() => service.assertEnteredAllowed({ ...context().purchase, quotationsRequired: true })).toThrow(
      BadRequestException,
    );
  });

  it('stores the price in minor units with the free quantity its scheme earns', async () => {
    const { service, repository } = setup();
    await service.create(
      context(),
      { ...entered, schemeBuyQty: 9, schemeFreeQty: 1 },
      { uomQty: 18, primaryUomQty: 180 },
      'INR',
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseSupplierId: 'leg-1',
        currencyCode: 'INR',
        unitPrice: 1250n,
        hasScheme: true,
        freePrimaryQty: 20,
      }),
    );
  });

  it('leaves the price out only for a leg its supplier invoice prices', async () => {
    const unpriced = { ...entered, unitPrice: undefined };
    const quantity = { uomQty: 18, primaryUomQty: 180 };
    await expect(setup().service.create(context(), unpriced, quantity, 'INR')).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Unit Price Required' }),
    });
    const direct = context({ leg: { id: 'leg-1', step: 'SOURCING', status: 'OPEN', allowsUnpriced: true } });
    const { service, repository } = setup();
    await service.create(direct, unpriced, quantity, 'INR');
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ unitPrice: null, currencyCode: 'INR' }));
  });

  it("refuses a price outside the supplier's currencies and a half scheme", async () => {
    const quantity = { uomQty: 18, primaryUomQty: 180 };
    const euro = { ...entered, unitPrice: { currency: 'EUR' as const, value: '1.00' } };
    await expect(setup().service.create(context(), euro, quantity, 'INR')).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      setup().service.create(context(), { ...entered, schemeBuyQty: 9 }, quantity, 'INR'),
    ).rejects.toMatchObject({ response: expect.objectContaining({ label: 'Incomplete Scheme' }) });
  });

  it('refuses a second allocation of the item to the same leg', async () => {
    const { service } = setup(allocation());
    await expect(service.create(context(), entered, { uomQty: 18, primaryUomQty: 180 }, 'INR')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('PurchaseItemAllocationsDomainService locking', () => {
  it('locks the allocations of a leg once it is submitted', async () => {
    const { service, repository } = setup();
    const approved = context({ leg: { id: 'leg-1', step: 'PURCHASE_ORDER', status: 'OPEN', allowsUnpriced: false } });
    await expect(service.remove(approved, allocation())).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.update(
        approved,
        allocation(),
        { id: 'pur-1', allocationId: 'alloc-1' },
        { uomQty: 10, primaryUomQty: 100 },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('keeps a rejected leg back in sourcing editable while the purchase is in PROCURING', async () => {
    const { service, repository } = setup();
    const rejected = context({ purchase: { ...context().purchase, step: 'PROCURING' } });
    await expect(service.remove(rejected, allocation())).resolves.toBe(0);
    expect(repository.delete).toHaveBeenCalledWith('alloc-1');
  });

  it('refuses allocation changes before the purchase is sourcing', async () => {
    const { service } = setup();
    const inQuoting = context({ purchase: { ...context().purchase, step: 'QUOTING' } });
    await expect(service.remove(inQuoting, allocation())).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('PurchaseItemAllocationsDomainService updates', () => {
  const quantity = { uomQty: 12, primaryUomQty: 120 };

  it('changes only the quantity on a purchase that requires quotations, keeping the quotation line', async () => {
    const { service, repository } = setup();
    const quoted = context({ purchase: { ...context().purchase, quotationsRequired: true } });
    await expect(
      service.update(quoted, allocation(), { id: 'pur-1', allocationId: 'alloc-1', unitPrice: null }, quantity),
    ).rejects.toMatchObject({ response: expect.objectContaining({ label: 'Quoted Terms' }) });
    await service.update(quoted, allocation(), { id: 'pur-1', allocationId: 'alloc-1', uomQty: 12 }, quantity);
    expect(repository.update).toHaveBeenCalledWith(
      'alloc-1',
      expect.objectContaining({ supplierQuotationItemId: 'sqi-1', uomQty: 12, unitPrice: 5_000n }),
    );
  });

  it('clears the price and the scheme with nulls, leaving the quotation line', async () => {
    const { service, repository } = setup();
    const direct = context({ leg: { id: 'leg-1', step: 'SOURCING', status: 'OPEN', allowsUnpriced: true } });
    await service.update(
      direct,
      allocation({ schemeBuyQty: 9, schemeFreeQty: 1, hasScheme: true }),
      { id: 'pur-1', allocationId: 'alloc-1', unitPrice: null, schemeBuyQty: null, schemeFreeQty: null },
      quantity,
    );
    expect(repository.update).toHaveBeenCalledWith(
      'alloc-1',
      expect.objectContaining({
        supplierQuotationItemId: null,
        unitPrice: null,
        schemeBuyQty: null,
        schemeFreeQty: null,
        hasScheme: false,
        freePrimaryQty: 0,
      }),
    );
  });
});

describe('PurchaseItemAllocationsDomainService sourcing totals', () => {
  const { service } = setup();
  const priced = (unitPrice: bigint | null, uomQty: number, currencyCode = 'INR') => ({
    unitPrice,
    uomQty,
    currencyCode,
  });

  it('totals unit price × quantity in the allocations’ one currency', () => {
    expect(service.summarize([priced(1250n, 3), priced(999n, 1.5)])).toEqual({
      currencyCodes: ['INR'],
      total: 5249n,
      unpricedCount: 0,
    });
    expect(service.sourcedTotal([priced(1250n, 2)])).toEqual({
      sourcedTotal: { currency: 'INR', value: '25.00' },
      hasUnpricedAllocations: false,
    });
  });

  it('has no total with an unpriced allocation or more than one currency', () => {
    expect(service.summarize([priced(1250n, 3), priced(null, 1)]).total).toBeNull();
    expect(service.summarize([priced(1250n, 3), priced(100n, 1, 'USD')]).total).toBeNull();
  });

  it('shows the priced allocations’ total and flags the unpriced ones, zero across currencies', () => {
    expect(service.sourcedTotal([priced(1250n, 2), priced(null, 1)])).toEqual({
      sourcedTotal: { currency: 'INR', value: '25.00' },
      hasUnpricedAllocations: true,
    });
    expect(service.sourcedTotal([priced(null, 1)])).toEqual({
      sourcedTotal: { currency: 'INR', value: '0.00' },
      hasUnpricedAllocations: true,
    });
    expect(service.sourcedTotal([priced(1250n, 2), priced(100n, 1, 'USD')]).sourcedTotal.value).toBe('0.00');
  });
});

describe('PurchaseItemAllocationsDomainService.requireQuotedItems', () => {
  const { service } = setup();
  const term = (id: string, purchaseItemId: string | null) => ({
    id,
    purchaseItemId,
    uomId: 'uom-strip',
    currencyCode: 'INR',
    unitPrice: 100n,
    schemeBuyQty: null,
    schemeFreeQty: null,
  });

  it('keeps the requested lines that quote a item line', () => {
    expect(service.requireQuotedItems(['sqi-1'], [term('sqi-1', 'pi-1')])).toHaveLength(1);
  });

  it('refuses a requested line that is not posted and valid, or quotes no item line', () => {
    expect(() => service.requireQuotedItems(['sqi-1', 'sqi-2'], [term('sqi-1', 'pi-1')])).toThrow(BadRequestException);
    expect(() => service.requireQuotedItems(['sqi-1'], [term('sqi-1', null)])).toThrow(BadRequestException);
  });
});

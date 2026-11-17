import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import {
  type PurchaseBlockers,
  type PurchaseRow,
  PurchasesDomainRepository,
} from '../repositories/purchases.repository';
import { type PurchaseLegFacts, PurchasesDomainService } from './purchases.service';

beforeAll(() => Logger.overrideLogger(false));

const purchase = (overrides: Partial<PurchaseRow> = {}): PurchaseRow =>
  ({
    id: 'pur-1',
    purchaseNumber: 'PUR-202611-0001',
    status: 'OPEN',
    quotationsRequired: false,
    minQuotations: 1,
    submittedAt: null,
    itemCount: 2,
    ...overrides,
  }) as PurchaseRow;

const leg = (overrides: Partial<PurchaseLegFacts> = {}): PurchaseLegFacts => ({
  supplierName: 'Akras',
  isSourcing: false,
  hasPostedDocument: false,
  receivingClosed: false,
  blockers: { cancel: null, close: 'Nothing is received from this supplier yet; cancel it instead.' },
  ...overrides,
});

const free: PurchaseBlockers = { submit: null, close: null, cancel: null, delete: null };

function setup() {
  const update = jest.fn();
  const deleteRecord = jest.fn().mockResolvedValue({});
  const service = new PurchasesDomainService({
    update,
    delete: deleteRecord,
    assertOpen: PurchasesDomainRepository.prototype.assertOpen,
  } as unknown as PurchasesDomainRepository);
  return { service, update, deleteRecord };
}

describe('PurchasesDomainService lifecycle', () => {
  it('edits the header of an open purchase at any time and answers 409 once it is cancelled', async () => {
    const { service, update } = setup();
    await service.update(purchase({ submittedAt: new Date() }), { id: 'pur-1', notes: null });
    expect(update).toHaveBeenCalledWith('pur-1', expect.objectContaining({ notes: null }));
    await expect(service.update(purchase({ status: 'CANCELLED' }), { id: 'pur-1' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('stamps the first submit only', async () => {
    const { service, update } = setup();
    await service.submit(purchase(), free);
    expect(update).toHaveBeenCalledWith('pur-1', expect.objectContaining({ submittedAt: expect.any(Date) }));
    await service.submit(purchase({ submittedAt: new Date() }), free);
    expect(update).toHaveBeenCalledTimes(1);
    await expect(service.submit(purchase(), { ...free, submit: 'No supplier' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('cancels only when nothing blocks it', async () => {
    const { service, update } = setup();
    await expect(service.cancel(purchase(), 'x', { ...free, cancel: 'Goods are received' })).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Cannot Cancel Purchase', detail: 'Goods are received' }),
    });
    await service.cancel(purchase(), 'No longer needed', free);
    expect(update).toHaveBeenCalledWith(
      'pur-1',
      expect.objectContaining({ status: 'CANCELLED', cancelReason: 'No longer needed' }),
    );
  });

  it('deletes only when no supplier is added', async () => {
    const { service, deleteRecord } = setup();
    await expect(service.delete(purchase(), { ...free, delete: 'Suppliers are added' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    await service.delete(purchase(), free);
    expect(deleteRecord).toHaveBeenCalledWith('pur-1', expect.anything());
  });

  it('completes once every supplier is done and nothing is left to allocate', async () => {
    const { service, update } = setup();
    await expect(service.completeIfDone(purchase(), { allLegsDone: true, hasUnallocated: true })).resolves.toBe(false);
    await expect(service.completeIfDone(purchase(), { allLegsDone: false, hasUnallocated: false })).resolves.toBe(
      false,
    );
    await expect(service.completeIfDone(purchase(), { allLegsDone: true, hasUnallocated: false })).resolves.toBe(true);
    expect(update).toHaveBeenCalledWith('pur-1', expect.objectContaining({ status: 'COMPLETED' }));
  });
});

describe('PurchasesDomainService.blockersOf', () => {
  const { service } = setup();

  it('lets a purchase without suppliers be deleted and cancelled but not closed or submitted', () => {
    const blockers = service.blockersOf(purchase(), { count: 0, closedCount: 0, open: [] });
    expect(blockers.delete).toBeNull();
    expect(blockers.cancel).toBeNull();
    expect(blockers.close).toMatch(/Nothing is received/);
    expect(blockers.submit).toMatch(/No supplier is waiting/);
  });

  it('offers submit while a supplier is in sourcing and blocks delete once suppliers exist', () => {
    const blockers = service.blockersOf(purchase(), { count: 1, closedCount: 0, open: [leg({ isSourcing: true })] });
    expect(blockers.submit).toBeNull();
    expect(blockers.delete).toMatch(/Suppliers are added/);
    expect(blockers.cancel).toBeNull();
  });

  it('turns cancel into close once goods are received', () => {
    const received = leg({ hasPostedDocument: true, blockers: { cancel: 'received', close: null } });
    const blockers = service.blockersOf(purchase(), { count: 2, closedCount: 0, open: [received, leg()] });
    expect(blockers.cancel).toMatch(/Goods are received from 1 supplier/);
    expect(blockers.close).toBeNull();
  });

  it('blocks close while a supplier has goods on their way, naming it', () => {
    const onTheWay = leg({
      supplierName: 'Jagdhamba',
      hasPostedDocument: true,
      blockers: { cancel: 'received', close: 'A delivery is on its way; receive or cancel it first.' },
    });
    const blockers = service.blockersOf(purchase(), { count: 1, closedCount: 0, open: [onTheWay] });
    expect(blockers.close).toBe('Jagdhamba: A delivery is on its way; receive or cancel it first.');
  });

  it('counts closed suppliers as received and skips those already closed for receiving', () => {
    const waiting = leg({
      hasPostedDocument: true,
      receivingClosed: true,
      blockers: { cancel: 'r', close: 'already' },
    });
    const blockers = service.blockersOf(purchase(), { count: 2, closedCount: 1, open: [waiting] });
    expect(blockers.cancel).toMatch(/Goods are received from 2 suppliers/);
    expect(blockers.close).toBeNull();
  });

  it('blocks everything once the purchase is cancelled, and offers no actions', () => {
    const cancelled = purchase({ status: 'CANCELLED' });
    const blockers = service.blockersOf(cancelled, { count: 0, closedCount: 0, open: [] });
    expect(Object.values(blockers).every((blocker) => blocker?.includes('cancelled'))).toBe(true);
    expect(service.availableActions(cancelled, blockers)).toEqual([]);
  });

  it('always offers editing, items and allocations while open, and the rest only unblocked', () => {
    expect(service.availableActions(purchase(), { ...free, close: 'x', delete: 'y' })).toEqual([
      'EDIT',
      'EDIT_ITEMS',
      'EDIT_ALLOCATIONS',
      'SUBMIT',
      'CANCEL',
    ]);
  });

  it('offers requesting quotations only when the purchase requires them', () => {
    expect(service.availableActions(purchase({ quotationsRequired: true }), free)).toContain('REQUEST_QUOTATION');
    expect(service.availableActions(purchase(), free)).not.toContain('REQUEST_QUOTATION');
  });
});

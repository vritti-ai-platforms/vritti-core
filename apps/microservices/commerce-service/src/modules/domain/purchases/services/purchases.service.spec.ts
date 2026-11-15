import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { BadRequestException, ConflictException } from '@vritti/api-sdk/exceptions';
import type { PurchaseRow, PurchasesDomainRepository } from '../repositories/purchases.repository';
import { PurchasesDomainService } from './purchases.service';

beforeAll(() => Logger.overrideLogger(false));

const purchase = (overrides: Partial<PurchaseRow> = {}): PurchaseRow =>
  ({
    id: 'pur-1',
    purchaseNumber: 'PUR-202611-0001',
    status: 'OPEN',
    step: 'REQUESTING',
    quotationsRequired: false,
    minQuotations: 1,
    itemCount: 2,
    ...overrides,
  }) as PurchaseRow;

function setup() {
  const update = jest.fn();
  const service = new PurchasesDomainService({ update } as unknown as PurchasesDomainRepository);
  return { service, update };
}

describe('PurchasesDomainService lifecycle', () => {
  it('moves the items to SOURCING, or to QUOTING when quotations are required', async () => {
    const { service, update } = setup();
    await expect(service.submitItems(purchase())).resolves.toBe('SOURCING');
    await expect(service.submitItems(purchase({ quotationsRequired: true }))).resolves.toBe('QUOTING');
    expect(update).toHaveBeenNthCalledWith(2, 'pur-1', { step: 'QUOTING' });
  });

  it('refuses to submit items when there are none', async () => {
    const { service, update } = setup();
    await expect(service.submitItems(purchase({ itemCount: 0 }))).rejects.toBeInstanceOf(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it('answers 409 when the header is edited past REQUESTING or the purchase is cancelled', async () => {
    const { service, update } = setup();
    await expect(service.update(purchase({ step: 'SOURCING' }), { id: 'pur-1', notes: 'x' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.update(purchase({ status: 'CANCELLED' }), { id: 'pur-1' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('clears the notes when they are sent as null', async () => {
    const { service, update } = setup();
    await service.update(purchase(), { id: 'pur-1', notes: null });
    expect(update).toHaveBeenCalledWith('pur-1', expect.objectContaining({ notes: null }));
  });

  it('completes quotations only with posted quotations from the minimum number of suppliers', async () => {
    const { service, update } = setup();
    const collecting = purchase({ step: 'QUOTING', quotationsRequired: true, minQuotations: 2 });
    await expect(service.completeQuotations(collecting, 1)).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Not Enough Quotations' }),
    });
    await service.completeQuotations(collecting, 2);
    expect(update).toHaveBeenCalledWith('pur-1', { step: 'SOURCING' });
  });

  it('refuses to complete quotations outside QUOTING', async () => {
    const { service } = setup();
    await expect(service.completeQuotations(purchase({ step: 'SOURCING' }), 5)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('submits a purchase in SOURCING with legs to start, moving it to PROCURING', async () => {
    const { service, update } = setup();
    await expect(service.submit(purchase({ step: 'SOURCING' }), 0)).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Nothing Sourced' }),
    });
    await service.submit(purchase({ step: 'SOURCING' }), 2);
    expect(update).toHaveBeenCalledWith('pur-1', expect.objectContaining({ step: 'PROCURING' }));
    await expect(service.submit(purchase({ step: 'REQUESTING' }), 2)).rejects.toBeInstanceOf(ConflictException);
  });

  it('cancels an open purchase once', async () => {
    const { service, update } = setup();
    await service.cancel(purchase({ step: 'PROCURING' }));
    expect(update).toHaveBeenCalledWith('pur-1', expect.objectContaining({ status: 'CANCELLED' }));
    await expect(service.cancel(purchase({ status: 'CANCELLED' }))).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('PurchasesDomainService.availableActions', () => {
  const { service } = setup();
  const facts = {
    postedSupplierCount: 0,
    hasSourcingLeg: false,
    hasQuotations: false,
    hasAllocations: false,
    hasLegs: false,
  };

  it('offers items editing and its submit only with items', () => {
    expect(service.availableActions(purchase(), facts)).toEqual([
      'CANCEL',
      'DELETE',
      'EDIT',
      'EDIT_ITEMS',
      'SUBMIT_ITEMS',
    ]);
    expect(service.availableActions(purchase({ itemCount: 0 }), facts)).not.toContain('SUBMIT_ITEMS');
  });

  it('offers completing quotations once enough suppliers posted', () => {
    const collecting = purchase({ step: 'QUOTING', minQuotations: 2 });
    expect(service.availableActions(collecting, { ...facts, postedSupplierCount: 1 })).toEqual([
      'CANCEL',
      'REQUEST_QUOTATION',
    ]);
    expect(service.availableActions(collecting, { ...facts, postedSupplierCount: 2 })).toContain('COMPLETE_QUOTATIONS');
  });

  it('offers submit in SOURCING only with a leg in sourcing, and nothing once cancelled', () => {
    expect(service.availableActions(purchase({ step: 'SOURCING' }), { ...facts, hasSourcingLeg: true })).toEqual([
      'CANCEL',
      'EDIT_ALLOCATIONS',
      'SUBMIT',
    ]);
    expect(service.availableActions(purchase({ step: 'PROCURING' }), { ...facts, hasSourcingLeg: true })).toEqual([
      'CANCEL',
      'EDIT_ALLOCATIONS',
    ]);
    expect(service.availableActions(purchase({ status: 'CANCELLED' }), facts)).toEqual([]);
  });
});

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { BadRequestException, ConflictException, ForbiddenException } from '@vritti/api-sdk/exceptions';
import type { PurchaseType } from '@/db/schema';
import type { PurchaseSuppliersDomainRepository } from '../repositories/purchase-suppliers.repository';
import {
  type Leg,
  type LegEnrollmentSnapshot,
  type LegFulfilmentFacts,
  type LegOrderLine,
  type LegPurchase,
  type LegSourcing,
  PurchaseSuppliersDomainService,
} from './purchase-suppliers.service';

beforeAll(() => Logger.overrideLogger(false));

const snapshot = (overrides: Partial<LegEnrollmentSnapshot> = {}): LegEnrollmentSnapshot => ({
  enrollmentId: 'enr-1',
  isActive: true,
  isSupplierActive: true,
  purchasingBlocked: false,
  purchaseType: 'STANDARD',
  approvalEnabled: true,
  approvalThreshold: 100_000n,
  qualityCheckEnabled: false,
  ...overrides,
});

const sourcing = (overrides: Partial<LegSourcing> = {}): LegSourcing => ({
  currencyCodes: ['INR'],
  total: 50_000n,
  unpricedCount: 0,
  ...overrides,
});

const leg = (overrides: Partial<Leg> = {}): Leg => ({
  id: 'leg-1',
  type: 'STANDARD',
  step: 'SOURCING',
  status: 'OPEN',
  ...overrides,
});

const purchase = (overrides: Partial<LegPurchase> = {}): LegPurchase => ({
  id: 'pur-1',
  purchaseNumber: 'PUR-202611-0001',
  status: 'OPEN',
  step: 'SOURCING',
  ...overrides,
});

const facts = (overrides: Partial<LegFulfilmentFacts> = {}): LegFulfilmentFacts => ({
  allocations: [],
  purchaseOrderStatuses: [],
  orderLines: [],
  hasReceivableAnnouncedDelivery: false,
  hasDraftReceipt: false,
  hasDraftInvoice: false,
  invoiceablePrimaryQty: 0,
  ...overrides,
});

function setup() {
  const repository = {
    create: jest.fn().mockImplementation((row) => Promise.resolve({ id: 'leg-1', ...row })),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const service = new PurchaseSuppliersDomainService(repository as unknown as PurchaseSuppliersDomainRepository);
  return { service, repository };
}

describe('PurchaseSuppliersDomainService legs open and close', () => {
  it('opens a leg with a snapshot of the active enrollment', async () => {
    const { service, repository } = setup();
    await service.open(purchase(), 'sup-1', snapshot({ purchaseType: 'DIRECT_PURCHASE', approvalThreshold: null }));
    expect(repository.create).toHaveBeenCalledWith({
      purchaseId: 'pur-1',
      supplierId: 'sup-1',
      supplierEnrollmentId: 'enr-1',
      type: 'DIRECT_PURCHASE',
      approvalEnabled: true,
      approvalThreshold: null,
      qualityCheckEnabled: false,
    });
  });

  it('refuses a supplier without an enrollment or with an inactive one', async () => {
    const { service, repository } = setup();
    await expect(service.open(purchase(), 'sup-1', undefined)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.open(purchase(), 'sup-1', snapshot({ isActive: false }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.open(purchase(), 'sup-1', snapshot({ isSupplierActive: false }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('refuses to open a leg for a supplier blocked from purchasing', async () => {
    const { service, repository } = setup();
    await expect(service.open(purchase(), 'sup-1', snapshot({ purchasingBlocked: true }))).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Supplier Blocked',
        errors: [{ field: 'supplierId', message: 'Blocked from purchasing' }],
      }),
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('refuses to open a leg before the purchase is sourcing', async () => {
    const { service } = setup();
    await expect(service.open(purchase({ step: 'QUOTING' }), 'sup-1', snapshot())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('deletes a leg in sourcing with its last allocation, and keeps it otherwise', async () => {
    const { service, repository } = setup();
    await expect(service.removeIfUnallocated(leg(), 1)).resolves.toBe(false);
    await expect(service.removeIfUnallocated(leg({ step: 'APPROVAL' }), 0)).resolves.toBe(false);
    await expect(service.removeIfUnallocated(leg(), 0)).resolves.toBe(true);
    expect(repository.delete).toHaveBeenCalledTimes(1);
    expect(repository.delete).toHaveBeenCalledWith('leg-1');
  });
});

describe('PurchaseSuppliersDomainService.start', () => {
  const start = (enrollment: LegEnrollmentSnapshot, legSourcing: LegSourcing = sourcing()) => {
    const { service, repository } = setup();
    return {
      reached: service.start(leg(), {
        snapshot: enrollment,
        sourcing: legSourcing,
        leCurrencyCode: 'INR',
        submittedBy: 'user-1',
      }),
      repository,
    };
  };

  it('copies the enrollment again when the leg starts', async () => {
    const { reached, repository } = start(
      snapshot({ enrollmentId: 'enr-2', purchaseType: 'ANNOUNCED', approvalEnabled: false }),
    );
    await expect(reached).resolves.toBe('PURCHASE_ORDER');
    expect(repository.update).toHaveBeenCalledWith(
      'leg-1',
      expect.objectContaining({
        supplierEnrollmentId: 'enr-2',
        type: 'ANNOUNCED',
        approvalEnabled: false,
        step: 'PURCHASE_ORDER',
      }),
    );
  });

  it('stamps who submitted the leg and clears its last rejection', async () => {
    const { reached, repository } = start(snapshot());
    await reached;
    expect(repository.update).toHaveBeenCalledWith(
      'leg-1',
      expect.objectContaining({
        submittedAt: expect.any(Date),
        submittedBy: 'user-1',
        rejectionReason: null,
        rejectedAt: null,
        rejectedBy: null,
      }),
    );
  });

  it('goes to the first fulfilment step of its type when approval is off', async () => {
    const routed = async (purchaseType: LegEnrollmentSnapshot['purchaseType']) =>
      start(snapshot({ purchaseType, approvalEnabled: false }), sourcing({ unpricedCount: 0 })).reached;
    await expect(routed('DIRECT_PURCHASE')).resolves.toBe('RECEIVE_WITH_INVOICE');
    await expect(routed('DIRECT_RECEIPT')).resolves.toBe('GOODS_RECEIPT');
    await expect(routed('PREPAID')).resolves.toBe('PURCHASE_ORDER');
  });

  it('skips approval below the threshold and needs it at or above', async () => {
    await expect(start(snapshot(), sourcing({ total: 99_999n })).reached).resolves.toBe('PURCHASE_ORDER');
    await expect(start(snapshot(), sourcing({ total: 100_000n })).reached).resolves.toBe('APPROVAL');
  });

  it('always needs approval without a threshold', async () => {
    await expect(start(snapshot({ approvalThreshold: null }), sourcing({ total: 1n })).reached).resolves.toBe(
      'APPROVAL',
    );
  });

  it("always needs approval in another currency than the legal entity's", async () => {
    await expect(start(snapshot(), sourcing({ currencyCodes: ['USD'], total: 1n })).reached).resolves.toBe('APPROVAL');
  });

  it('needs approval when an unpriced direct purchase has no total yet', async () => {
    await expect(
      start(snapshot({ purchaseType: 'DIRECT_PURCHASE' }), sourcing({ total: null, unpricedCount: 1 })).reached,
    ).resolves.toBe('APPROVAL');
  });

  it('refuses to start a leg with unpriced allocations unless its supplier invoice prices it', async () => {
    await expect(
      start(snapshot({ purchaseType: 'STANDARD' }), sourcing({ total: null, unpricedCount: 1 })).reached,
    ).rejects.toMatchObject({ response: expect.objectContaining({ label: 'Prices Missing' }) });
  });

  it('refuses to start a leg no longer in sourcing or whose enrollment is inactive', async () => {
    const { service } = setup();
    const ready = { snapshot: snapshot(), sourcing: sourcing(), leCurrencyCode: 'INR', submittedBy: 'user-1' };
    await expect(service.start(leg({ step: 'APPROVAL' }), ready)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.start(leg(), { ...ready, snapshot: snapshot({ isActive: false }) })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuses to start a leg whose supplier became blocked from purchasing', async () => {
    const { reached, repository } = start(snapshot({ purchasingBlocked: true }));
    await expect(reached).rejects.toMatchObject({ response: expect.objectContaining({ label: 'Supplier Blocked' }) });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('starts a single leg on its own only once the purchase is in PROCURING', () => {
    const { service } = setup();
    expect(() => service.assertStartableAlone(purchase({ step: 'SOURCING' }))).toThrow(ConflictException);
    expect(() => service.assertStartableAlone(purchase({ step: 'PROCURING' }))).not.toThrow();
  });
});

describe('PurchaseSuppliersDomainService approval', () => {
  const waiting = leg({ step: 'APPROVAL' });
  const approvers = { userId: 'user-2', approverUserIds: ['user-1', 'user-2'], submitterId: 'user-1' };

  it('approves as a current approver who did not submit the leg, moving it to its first fulfilment step', async () => {
    const { service, repository } = setup();
    await expect(service.approve(waiting, approvers)).resolves.toBe('PURCHASE_ORDER');
    expect(repository.update).toHaveBeenCalledWith(
      'leg-1',
      expect.objectContaining({ step: 'PURCHASE_ORDER', approvedBy: 'user-2' }),
    );
  });

  it('refuses the user who submitted the leg', async () => {
    const { service, repository } = setup();
    await expect(service.approve(waiting, { ...approvers, userId: 'user-1' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('refuses a user who is not one of the current approvers', async () => {
    const { service } = setup();
    await expect(service.approve(waiting, { ...approvers, userId: 'user-9' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.reject(waiting, { ...approvers, userId: 'user-9' }, 'Too expensive')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('answers 409 for a leg that is not waiting for approval', async () => {
    const { service } = setup();
    await expect(service.approve(leg(), approvers)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.reject(leg({ step: 'PURCHASE_ORDER' }), approvers, 'Too expensive')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('returns only the rejected leg to SOURCING with its reason and rejector', async () => {
    const { service, repository } = setup();
    await service.reject(waiting, approvers, 'Too expensive');
    expect(repository.update).toHaveBeenCalledTimes(1);
    expect(repository.update).toHaveBeenCalledWith('leg-1', {
      step: 'SOURCING',
      rejectionReason: 'Too expensive',
      rejectedAt: expect.any(Date),
      rejectedBy: 'user-2',
    });
  });

  it('offers APPROVE only to an eligible approver, REJECT to any approver', () => {
    const { service } = setup();
    const inProcuring = purchase({ step: 'PROCURING' });
    expect(service.availableActions(waiting, inProcuring, approvers, facts())).toEqual(['APPROVE', 'REJECT']);
    expect(service.availableActions(waiting, inProcuring, { ...approvers, userId: 'user-1' }, facts())).toEqual([
      'REJECT',
    ]);
    expect(service.availableActions(waiting, inProcuring, { ...approvers, userId: 'user-9' }, facts())).toEqual([]);
    expect(service.availableActions(leg(), inProcuring, approvers, facts())).toEqual(['EDIT_ALLOCATIONS', 'SUBMIT']);
    expect(service.availableActions(leg(), purchase(), approvers, facts())).toEqual(['EDIT_ALLOCATIONS']);
  });
});

const line = (overrides: Partial<LegOrderLine> = {}): LegOrderLine => ({
  purchaseOrderStatus: 'CONFIRMED',
  primaryUomQty: 100,
  freePrimaryQty: 0,
  cancelledPrimaryQty: 0,
  receivedPrimaryQty: 0,
  returnedPrimaryQty: 0,
  invoicedPrimaryQty: 0,
  remainingToDeliverPrimaryQty: 100,
  ...overrides,
});

const ordered = (lineOverrides: Partial<LegOrderLine> = {}, overrides: Partial<LegFulfilmentFacts> = {}) =>
  facts({
    allocations: [{ primaryUomQty: 100, freePrimaryQty: 0, purchaseOrderItemId: 'poi-1' }],
    purchaseOrderStatuses: [lineOverrides.purchaseOrderStatus ?? 'CONFIRMED'],
    orderLines: [line(lineOverrides)],
    ...overrides,
  });

const unordered = facts({ allocations: [{ primaryUomQty: 100, freePrimaryQty: 0, purchaseOrderItemId: null }] });

describe('PurchaseSuppliersDomainService leg step derivation', () => {
  const { service } = setup();
  const derive = (type: PurchaseType, legFacts: LegFulfilmentFacts) =>
    service.deriveStep(leg({ type, step: 'PURCHASE_ORDER' }), legFacts);

  it.each<[PurchaseType, LegFulfilmentFacts, string]>([
    ['STANDARD', unordered, 'PURCHASE_ORDER'],
    ['STANDARD', ordered({ purchaseOrderStatus: 'SENT' }), 'PURCHASE_ORDER'],
    ['STANDARD', ordered(), 'GOODS_RECEIPT'],
    ['STANDARD', ordered({ receivedPrimaryQty: 100, remainingToDeliverPrimaryQty: 0 }), 'SUPPLIER_INVOICE'],
    [
      'STANDARD',
      ordered({ receivedPrimaryQty: 100, invoicedPrimaryQty: 100, remainingToDeliverPrimaryQty: 0 }),
      'CLOSED',
    ],
    ['ANNOUNCED', ordered(), 'INBOUND_DELIVERY'],
    ['ANNOUNCED', ordered({ remainingToDeliverPrimaryQty: 0 }), 'GOODS_RECEIPT'],
    ['ANNOUNCED', ordered({ receivedPrimaryQty: 100, remainingToDeliverPrimaryQty: 0 }), 'SUPPLIER_INVOICE'],
    ['ORDER_INVOICE_WITH_GOODS', unordered, 'PURCHASE_ORDER'],
    ['ORDER_INVOICE_WITH_GOODS', ordered(), 'RECEIVE_WITH_INVOICE'],
    ['ORDER_INVOICE_WITH_GOODS', ordered({ receivedPrimaryQty: 100, invoicedPrimaryQty: 100 }), 'CLOSED'],
    ['DIRECT_RECEIPT', unordered, 'GOODS_RECEIPT'],
    ['DIRECT_RECEIPT', ordered({ receivedPrimaryQty: 40 }), 'GOODS_RECEIPT'],
    ['DIRECT_RECEIPT', ordered({ receivedPrimaryQty: 100 }), 'SUPPLIER_INVOICE'],
    ['DIRECT_RECEIPT', ordered({ receivedPrimaryQty: 100, invoicedPrimaryQty: 100 }), 'CLOSED'],
    ['DIRECT_PURCHASE', unordered, 'RECEIVE_WITH_INVOICE'],
    ['DIRECT_PURCHASE', ordered({ receivedPrimaryQty: 60, invoicedPrimaryQty: 60 }), 'RECEIVE_WITH_INVOICE'],
    ['DIRECT_PURCHASE', ordered({ receivedPrimaryQty: 100, invoicedPrimaryQty: 100 }), 'CLOSED'],
  ])('%s leg with these documents is in %s', (type, legFacts, step) => {
    expect(derive(type, legFacts)).toBe(step);
  });

  it('counts free goods in the due quantity and what a PO marked delivery completed cancelled out of it', () => {
    expect(
      service.deriveStep(leg({ type: 'STANDARD' }), ordered({ freePrimaryQty: 10, receivedPrimaryQty: 100 })),
    ).toBe('GOODS_RECEIPT');
    expect(
      service.deriveStep(
        leg({ type: 'STANDARD' }),
        ordered({ cancelledPrimaryQty: 40, receivedPrimaryQty: 60, invoicedPrimaryQty: 60 }),
      ),
    ).toBe('CLOSED');
  });

  it('sums the leg progress in primary units', () => {
    expect(service.progressOf(ordered({ freePrimaryQty: 10, receivedPrimaryQty: 50, invoicedPrimaryQty: 20 }))).toEqual(
      {
        duePrimaryQty: 110,
        orderedPrimaryQty: 110,
        receivedPrimaryQty: 50,
        invoicedPrimaryQty: 20,
      },
    );
  });
});

describe('PurchaseSuppliersDomainService leg fulfilment actions', () => {
  const { service } = setup();
  const caller = { userId: 'user-2', approverUserIds: [], submitterId: null };
  const actionsOf = (type: PurchaseType, legFacts: LegFulfilmentFacts) =>
    service.availableActions(leg({ type, step: 'PURCHASE_ORDER' }), purchase({ step: 'PROCURING' }), caller, legFacts);

  it('offers CREATE_PURCHASE_ORDER until the leg is ordered, then CONFIRM_PURCHASE_ORDER for a sent PO', () => {
    expect(actionsOf('STANDARD', unordered)).toEqual(['CREATE_PURCHASE_ORDER', 'CLOSE_SUPPLIER']);
    expect(actionsOf('STANDARD', ordered({ purchaseOrderStatus: 'SENT' }))).toEqual([
      'CONFIRM_PURCHASE_ORDER',
      'CLOSE_SUPPLIER',
    ]);
  });

  it('offers CREATE_INBOUND_DELIVERY and CREATE_GOODS_RECEIPT on a confirmed PO with open quantity; ANNOUNCED receives only an ANNOUNCED inbound delivery', () => {
    expect(actionsOf('STANDARD', ordered())).toEqual([
      'CREATE_INBOUND_DELIVERY',
      'CREATE_GOODS_RECEIPT',
      'CLOSE_SUPPLIER',
    ]);
    expect(actionsOf('ANNOUNCED', ordered())).toEqual(['CREATE_INBOUND_DELIVERY', 'CLOSE_SUPPLIER']);
    expect(
      actionsOf('ANNOUNCED', ordered({ remainingToDeliverPrimaryQty: 0 }, { hasReceivableAnnouncedDelivery: true })),
    ).toEqual(['CREATE_GOODS_RECEIPT', 'CLOSE_SUPPLIER']);
  });

  it('offers CREATE_SUPPLIER_INVOICE for invoiceable receipts and RECEIVE_WITH_INVOICE to the types invoiced with their goods', () => {
    expect(
      actionsOf(
        'DIRECT_RECEIPT',
        ordered({ receivedPrimaryQty: 100, remainingToDeliverPrimaryQty: 0 }, { invoiceablePrimaryQty: 100 }),
      ),
    ).toEqual(['CREATE_SUPPLIER_INVOICE', 'CLOSE_SUPPLIER']);
    expect(actionsOf('DIRECT_RECEIPT', unordered)).toEqual(['CREATE_GOODS_RECEIPT', 'CLOSE_SUPPLIER']);
    expect(actionsOf('DIRECT_PURCHASE', unordered)).toEqual(['RECEIVE_WITH_INVOICE', 'CLOSE_SUPPLIER']);
    expect(actionsOf('ORDER_INVOICE_WITH_GOODS', ordered())).toEqual([
      'CREATE_INBOUND_DELIVERY',
      'RECEIVE_WITH_INVOICE',
      'CLOSE_SUPPLIER',
    ]);
  });

  it('offers PREPAID and SELF_INVOICING legs only CLOSE_SUPPLIER, and no CLOSE_SUPPLIER while a draft receipt or invoice is open', () => {
    expect(actionsOf('PREPAID', unordered)).toEqual(['CLOSE_SUPPLIER']);
    expect(actionsOf('SELF_INVOICING', ordered())).toEqual(['CLOSE_SUPPLIER']);
    expect(actionsOf('STANDARD', ordered({}, { hasDraftReceipt: true }))).toEqual([
      'CREATE_INBOUND_DELIVERY',
      'CREATE_GOODS_RECEIPT',
    ]);
  });

  it('refuses an action the leg does not offer with a 409', () => {
    expect(() =>
      service.assertActionAvailable(
        { ...leg({ type: 'STANDARD', step: 'PURCHASE_ORDER' }), supplierName: 'Acme' },
        purchase({ step: 'PROCURING' }),
        ordered(),
        'CREATE_PURCHASE_ORDER',
      ),
    ).toThrow(ConflictException);
    expect(() =>
      service.assertActionAvailable(
        { ...leg({ type: 'STANDARD', step: 'PURCHASE_ORDER' }), supplierName: 'Acme' },
        purchase({ step: 'PROCURING' }),
        ordered({}, { hasDraftInvoice: true }),
        'CLOSE_SUPPLIER',
      ),
    ).toThrow(expect.objectContaining({ response: expect.objectContaining({ label: 'Cannot Close Supplier' }) }));
  });
});

describe('PurchaseSuppliersDomainService advancing a leg', () => {
  it('moves the leg to the step its documents reach', async () => {
    const { service, repository } = setup();
    const advance = await service.advance(leg({ type: 'STANDARD', step: 'PURCHASE_ORDER' }), ordered());
    expect(advance).toEqual({ stepBefore: 'PURCHASE_ORDER', stepAfter: 'GOODS_RECEIPT', isClosed: false });
    expect(repository.update).toHaveBeenCalledWith('leg-1', { step: 'GOODS_RECEIPT' });
  });

  it('closes a leg whose due quantity is received and invoiced', async () => {
    const { service, repository } = setup();
    const advance = await service.advance(
      leg({ type: 'DIRECT_PURCHASE', step: 'RECEIVE_WITH_INVOICE' }),
      ordered({ receivedPrimaryQty: 100, invoicedPrimaryQty: 100 }),
    );
    expect(advance).toEqual({ stepBefore: 'RECEIVE_WITH_INVOICE', stepAfter: 'CLOSED', isClosed: true });
    expect(repository.update).toHaveBeenCalledWith(
      'leg-1',
      expect.objectContaining({ step: 'CLOSED', status: 'CLOSED', closedAt: expect.any(Date), closeReason: null }),
    );
  });

  it('leaves a leg in approval, a Phase 4 leg and an unchanged step alone', async () => {
    const { service, repository } = setup();
    await service.advance(leg({ type: 'STANDARD', step: 'APPROVAL' }), ordered());
    await service.advance(leg({ type: 'PREPAID', step: 'PURCHASE_ORDER' }), ordered());
    await service.advance(leg({ type: 'STANDARD', step: 'GOODS_RECEIPT' }), ordered());
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('knows a purchase is done only when every leg is closed', () => {
    const { service } = setup();
    expect(service.allClosed([{ status: 'CLOSED' }, { status: 'CLOSED' }])).toBe(true);
    expect(service.allClosed([{ status: 'CLOSED' }, { status: 'OPEN' }])).toBe(false);
    expect(service.allClosed([])).toBe(false);
  });
});

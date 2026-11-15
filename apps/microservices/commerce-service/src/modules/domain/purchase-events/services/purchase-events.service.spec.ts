import 'reflect-metadata';
import type { PurchaseEventDto } from '../dto/entity/purchase-event.dto';
import type { PurchaseEventsDomainRepository } from '../repositories/purchase-events.repository';
import { PurchaseEventsDomainService } from './purchase-events.service';

const event = (action: string, createdAt: string, overrides: Partial<PurchaseEventDto> = {}): PurchaseEventDto => ({
  id: `${action}-${createdAt}`,
  action,
  purchaseSupplierId: 'leg-1',
  supplierName: 'Acme',
  stepBefore: null,
  stepAfter: null,
  documentType: null,
  documentId: null,
  reason: null,
  actorId: 'user-1',
  createdAt,
  ...overrides,
});

describe('PurchaseEventsDomainService.legHistory', () => {
  const service = new PurchaseEventsDomainService({} as PurchaseEventsDomainRepository);
  const newestFirst = [
    event('REJECT', '2026-11-11T10:00:00Z', { reason: 'Price too high', actorId: 'user-2' }),
    event('SUBMIT', '2026-11-11T09:00:00Z'),
    event('SUBMIT', '2026-11-11T08:00:00Z', { purchaseSupplierId: 'leg-2', actorId: 'user-3' }),
  ];

  it('reads the last start and its submitter for the leg only', () => {
    expect(service.legHistory(newestFirst, { id: 'leg-1', step: 'SOURCING' })).toMatchObject({
      submittedAt: '2026-11-11T09:00:00Z',
      submittedBy: 'user-1',
    });
    expect(service.legHistory(newestFirst, { id: 'leg-2', step: 'PURCHASE_ORDER' }).submittedBy).toBe('user-3');
  });

  it('shows the last rejection only while the leg is back in sourcing', () => {
    expect(service.legHistory(newestFirst, { id: 'leg-1', step: 'SOURCING' }).rejection).toEqual({
      reason: 'Price too high',
      actorId: 'user-2',
      at: '2026-11-11T10:00:00Z',
    });
    const resubmitted = [event('SUBMIT_SUPPLIER', '2026-11-11T11:00:00Z'), ...newestFirst];
    expect(service.legHistory(resubmitted, { id: 'leg-1', step: 'APPROVAL' })).toEqual({
      submittedAt: '2026-11-11T11:00:00Z',
      submittedBy: 'user-1',
      rejection: null,
    });
  });
});

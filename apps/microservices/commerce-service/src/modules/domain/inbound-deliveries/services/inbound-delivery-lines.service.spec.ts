import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type {
  DeliverablePurchaseOrderItem,
  DeliverablePurchaseOrderItemsRepository,
} from '../repositories/deliverable-purchase-order-items.repository';
import type { InboundDeliveriesDomainRepository } from '../repositories/inbound-deliveries.repository';
import type { InboundDeliveryLinesDomainRepository } from '../repositories/inbound-delivery-lines.repository';
import { InboundDeliveriesDomainService } from './inbound-deliveries.service';
import { type DeliveryTarget, InboundDeliveryLinesDomainService } from './inbound-delivery-lines.service';

beforeAll(() => Logger.overrideLogger(false));

const target: DeliveryTarget = { id: 'del-1', deliveryNumber: 'IBD-1', supplierId: 'sup-1', siteId: 'site-1' };

const item = (overrides: Partial<DeliverablePurchaseOrderItem> = {}): DeliverablePurchaseOrderItem => ({
  id: 'poi-1',
  purchaseOrderId: 'po-1',
  poNumber: 'PO-1',
  poStatus: 'CONFIRMED',
  poReceiptStatus: 'NOT_RECEIVED',
  supplierId: 'sup-1',
  siteId: 'site-1',
  inventoryItemName: 'Paracetamol',
  uomQty: 10,
  primaryUomQty: 100,
  remainingPrimaryQty: 100,
  isOnDelivery: false,
  ...overrides,
});

function setup(items: DeliverablePurchaseOrderItem[], line?: unknown) {
  const deliverable = { findForDelivery: jest.fn().mockResolvedValue(items) };
  const lines = { findOnDelivery: jest.fn().mockResolvedValue(line) };
  return new InboundDeliveryLinesDomainService(
    lines as unknown as InboundDeliveryLinesDomainRepository,
    deliverable as unknown as DeliverablePurchaseOrderItemsRepository,
    new InboundDeliveriesDomainService({} as InboundDeliveriesDomainRepository),
  );
}

const rejectsWith = (label: string, message: string) => ({
  response: expect.objectContaining({ label, errors: [{ field: 'lines', message }] }),
});

describe('InboundDeliveryLinesDomainService.findDeliverableOrThrow', () => {
  it('returns PO lines of the delivery supplier and site on open confirmed orders', async () => {
    await expect(setup([item()]).findDeliverableOrThrow(target, ['poi-1'])).resolves.toEqual([item()]);
  });

  it('reports a PO line out of reach', async () => {
    await expect(setup([]).findDeliverableOrThrow(target, ['poi-1'])).rejects.toMatchObject(
      expect.objectContaining({
        status: 404,
        ...rejectsWith('Purchase Order Line Not Found', 'Unknown purchase order line'),
      }),
    );
  });

  it('refuses a PO line of another supplier or site', async () => {
    await expect(
      setup([item({ supplierId: 'sup-2' })]).findDeliverableOrThrow(target, ['poi-1']),
    ).rejects.toMatchObject(rejectsWith('Different Supplier', 'Another supplier'));
    await expect(setup([item({ siteId: 'site-2' })]).findDeliverableOrThrow(target, ['poi-1'])).rejects.toMatchObject(
      rejectsWith('Different Site', 'Another site'),
    );
  });

  it('refuses a PO line on an order not confirmed or already received', async () => {
    await expect(setup([item({ poStatus: 'SENT' })]).findDeliverableOrThrow(target, ['poi-1'])).rejects.toMatchObject(
      rejectsWith('Purchase Order Not Confirmed', 'Order is SENT'),
    );
    await expect(
      setup([item({ poReceiptStatus: 'RECEIVED' })]).findDeliverableOrThrow(target, ['poi-1']),
    ).rejects.toMatchObject(rejectsWith('Purchase Order Received', 'Order fully received'));
  });

  it('refuses a PO line already on the delivery', async () => {
    await expect(setup([item({ isOnDelivery: true })]).findDeliverableOrThrow(target, ['poi-1'])).rejects.toMatchObject(
      rejectsWith('Already on Delivery', 'Already on this delivery'),
    );
  });
});

describe('InboundDeliveryLinesDomainService.findOnDeliveryOrThrow', () => {
  it('reports a line that is not on the delivery', async () => {
    await expect(setup([]).findOnDeliveryOrThrow('del-1', 'line-1')).rejects.toMatchObject({ status: 404 });
  });
});

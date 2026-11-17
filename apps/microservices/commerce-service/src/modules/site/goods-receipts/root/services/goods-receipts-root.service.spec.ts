import 'reflect-metadata';
import type { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import type { DeliverablePurchaseOrderItemsRepository } from '@domain/inbound-deliveries/repositories/deliverable-purchase-order-items.repository';
import {
  InboundDeliveriesDomainRepository,
  type InboundDeliveryRow,
} from '@domain/inbound-deliveries/repositories/inbound-deliveries.repository';
import type {
  DeliveryLineReceivability,
  InboundDeliveryLinesDomainRepository,
} from '@domain/inbound-deliveries/repositories/inbound-delivery-lines.repository';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import type { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import type { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { Logger } from '@nestjs/common';
import type { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { GoodsReceiptsService } from './goods-receipts-root.service';

beforeAll(() => Logger.overrideLogger(false));

const delivery = (overrides: Partial<InboundDeliveryRow> = {}): InboundDeliveryRow =>
  ({
    id: 'del-1',
    deliveryNumber: 'IBD-1',
    legalEntityId: 'le-1',
    siteId: 'site-1',
    supplierId: 'sup-1',
    purchaseId: null,
    status: 'ARRIVED',
    source: 'ANNOUNCED',
    isEditable: true,
    draftGoodsReceiptId: null,
    canReceive: true,
    ...overrides,
  }) as InboundDeliveryRow;

const deliveryLine = (overrides: Partial<DeliveryLineReceivability> = {}): DeliveryLineReceivability => ({
  id: 'dl-1',
  purchaseOrderItemId: 'poi-1',
  primaryUomQty: 100,
  inventoryItemId: 'item-1',
  uomId: 'uom-strip',
  poUomQty: 10,
  poPrimaryUomQty: 100,
  poFreePrimaryQty: 10,
  poCancelledPrimaryQty: 0,
  poReceivedPrimaryQty: 0,
  acceptedOnDeliveryPrimaryQty: 0,
  ...overrides,
});

function setup(row: InboundDeliveryRow, lines: DeliveryLineReceivability[]) {
  const deliveriesRepository = new InboundDeliveriesDomainRepository({} as PrimaryDatabaseService);
  jest.spyOn(deliveriesRepository, 'findDetail').mockResolvedValue(row);
  const deliveriesService = new InboundDeliveriesDomainService(deliveriesRepository);
  const linesRepository = { findOnConfirmedOrders: jest.fn().mockResolvedValue(lines) };
  const deliveryLinesService = new InboundDeliveryLinesDomainService(
    linesRepository as unknown as InboundDeliveryLinesDomainRepository,
    {} as DeliverablePurchaseOrderItemsRepository,
    deliveriesService,
  );
  const createDraft = jest.fn().mockResolvedValue({ success: true });
  const service = new GoodsReceiptsService(
    { runInTransaction: (fn: () => Promise<unknown>) => fn() } as unknown as PrimaryDatabaseService,
    { createDraft } as unknown as GoodsReceiptsDomainService,
    deliveriesService,
    deliveryLinesService,
    { assertPurchasable: jest.fn() } as unknown as SupplierEnrollmentsDomainService,
    {} as PurchasesDomainRepository,
  );
  return { service, createDraft };
}

const dto = { inboundDeliveryId: 'del-1', receivedDate: '2026-11-10T10:00:00Z' };

describe('GoodsReceiptsService.createFromDelivery', () => {
  it('creates a draft of the delivery whose items are its open lines, each naming its delivery line', async () => {
    const { service, createDraft } = setup(delivery(), [
      deliveryLine(),
      deliveryLine({ id: 'dl-2', purchaseOrderItemId: 'poi-2', acceptedOnDeliveryPrimaryQty: 40 }),
      deliveryLine({ id: 'dl-3', purchaseOrderItemId: 'poi-3', acceptedOnDeliveryPrimaryQty: 100 }),
    ]);
    await service.createFromDelivery(dto);
    expect(createDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        inboundDeliveryId: 'del-1',
        siteId: 'site-1',
        supplierId: 'sup-1',
        lines: [
          expect.objectContaining({ inboundDeliveryLineId: 'dl-1', receivedQty: 10, receivedPrimaryQty: 100 }),
          expect.objectContaining({ inboundDeliveryLineId: 'dl-2', receivedQty: 6, receivedPrimaryQty: 60 }),
        ],
      }),
    );
  });

  it('receives no more than the PO line still has open', async () => {
    const { service, createDraft } = setup(delivery(), [deliveryLine({ poReceivedPrimaryQty: 85 })]);
    await service.createFromDelivery(dto);
    expect(createDraft.mock.calls[0][0].lines).toEqual([
      expect.objectContaining({ receivedQty: 2.5, receivedPrimaryQty: 25 }),
    ]);
  });

  it('refuses a received or cancelled delivery', async () => {
    for (const status of ['RECEIVED', 'CANCELLED'] as const) {
      const { service, createDraft } = setup(delivery({ status, isEditable: false }), [deliveryLine()]);
      await expect(service.createFromDelivery(dto)).rejects.toMatchObject({
        response: expect.objectContaining({ label: 'Cannot Receive' }),
      });
      expect(createDraft).not.toHaveBeenCalled();
    }
  });

  it('refuses a delivery a purchase created', async () => {
    const { service } = setup(delivery({ source: 'GOODS_RECEIPT', purchaseId: 'pur-1', isEditable: false }), [
      deliveryLine(),
    ]);
    await expect(service.createFromDelivery(dto)).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Cannot Receive' }),
    });
  });

  it('refuses a delivery that already has a draft receipt', async () => {
    const { service } = setup(delivery({ draftGoodsReceiptId: 'gr-draft' }), [deliveryLine()]);
    await expect(service.createFromDelivery(dto)).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Draft Receipt Exists' }),
    });
  });

  it('refuses a delivery with nothing left to receive on a confirmed order', async () => {
    const { service } = setup(delivery(), [deliveryLine({ acceptedOnDeliveryPrimaryQty: 100 })]);
    await expect(service.createFromDelivery(dto)).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Nothing Left to Receive' }),
    });
  });
});

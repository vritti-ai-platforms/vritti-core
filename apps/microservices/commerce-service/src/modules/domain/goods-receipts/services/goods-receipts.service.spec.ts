import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type {
  GoodsReceiptItemContext,
  GoodsReceiptItemRow,
  GoodsReceiptItemsDomainRepository,
} from '../repositories/goods-receipt-items.repository';
import type { GoodsReceiptRow, GoodsReceiptsDomainRepository } from '../repositories/goods-receipts.repository';
import { GoodsReceiptItemsDomainService } from './goods-receipt-items.service';
import { GoodsReceiptsDomainService } from './goods-receipts.service';

beforeAll(() => Logger.overrideLogger(false));

const receipt = (overrides: Partial<GoodsReceiptRow> = {}): GoodsReceiptRow =>
  ({
    id: 'gr-1',
    grNumber: 'GR-1',
    status: 'DRAFT',
    itemCount: 1,
    isPostable: true,
    ...overrides,
  }) as GoodsReceiptRow;

const context = (overrides: Partial<GoodsReceiptItemContext> = {}): GoodsReceiptItemContext => ({
  id: 'gri-1',
  goodsReceiptId: 'gr-1',
  siteId: 'site-1',
  inventoryItemId: 'item-1',
  uomId: 'uom-1',
  receivedQty: 10,
  rejectedQuantity: 0,
  receiptStatus: 'DRAFT',
  tracking: 'LOT',
  deliverySource: 'ANNOUNCED',
  purchaseNumber: null,
  ...overrides,
});

function receiptsService(found: GoodsReceiptRow | undefined) {
  const repository = { findDetail: jest.fn().mockResolvedValue(found) };
  return new GoodsReceiptsDomainService(
    repository as unknown as GoodsReceiptsDomainRepository,
    {} as GoodsReceiptItemsDomainRepository,
  );
}

function itemsService(repository: Record<string, jest.Mock>) {
  return new GoodsReceiptItemsDomainService(repository as unknown as GoodsReceiptItemsDomainRepository);
}

describe('GoodsReceiptsDomainService validations', () => {
  it('reports a receipt out of reach', async () => {
    await expect(receiptsService(undefined).findDraftOrThrow('gr-1', 'Cannot Delete')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('changes only a draft receipt, under the caller label', async () => {
    await expect(
      receiptsService(receipt({ status: 'POSTED' })).findDraftOrThrow('gr-1', 'Cannot Delete'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Cannot Delete',
        detail: '"GR-1" is posted, so it can no longer change.',
      }),
    });
  });

  it('posts only a receipt with items fully distributed to balanced lines', () => {
    const service = receiptsService(undefined);
    expect(() => service.assertPostable(receipt({ isPostable: false, itemCount: 0 }))).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({
          label: 'Not Ready to Post',
          detail: 'Add at least one item to "GR-1" before posting it.',
        }),
      }),
    );
    expect(() => service.assertPostable(receipt())).not.toThrow();
  });
});

describe('GoodsReceiptItemsDomainService validations', () => {
  it('reports an item that is not on the receipt', async () => {
    const service = itemsService({
      findOnReceipt: jest.fn().mockResolvedValue(undefined),
      findContext: jest.fn().mockResolvedValue(undefined),
    });
    await expect(service.findOnReceiptOrThrow('gr-1', 'gri-1')).rejects.toMatchObject({ status: 404 });
    await expect(service.findDraftContextOrThrow('gr-1', 'gri-1')).rejects.toMatchObject({ status: 404 });
  });

  it('writes lots, lines and serials only on a draft receipt', async () => {
    const posted = itemsService({
      findContext: jest.fn().mockResolvedValue(context({ receiptStatus: 'POSTED' })),
    });
    await expect(posted.findDraftContextOrThrow('gr-1', 'gri-1')).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Goods Receipt Posted' }),
    });
    const draft = itemsService({ findContext: jest.fn().mockResolvedValue(context()) });
    await expect(draft.findDraftContextOrThrow('gr-1', 'gri-1')).resolves.toEqual(context());
  });

  it('refuses rejecting more than was received', async () => {
    const item = {
      id: 'gri-1',
      receivedQty: 5,
      rejectedQuantity: 0,
      orderedQty: 5,
      poPrimaryUomQty: 50,
    } as GoodsReceiptItemRow;
    const service = itemsService({ update: jest.fn() });
    await expect(
      service.updateItem(receipt(), item, { goodsReceiptId: 'gr-1', itemId: 'gri-1', rejectedQuantity: 6 }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Too Many Rejected',
        errors: [{ field: 'rejectedQuantity', message: 'More than received' }],
      }),
    });
  });
});

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { GoodsReceiptLineItemsDomainRepository } from '../repositories/goods-receipt-line-items.repository';
import { GoodsReceiptLineItemsDomainService, type SerialReceiptItem } from './goods-receipt-line-items.service';

beforeAll(() => Logger.overrideLogger(false));

const item: SerialReceiptItem = { siteId: 'site-1', inventoryItemId: 'item-1', tracking: 'SERIAL' };
const line = { id: 'line-1', quantity: 2 };
const dto = { goodsReceiptId: 'gr-1', itemId: 'gri-1', lineId: 'line-1', serialNumber: 'SN-1' };

function serviceWith(repository: Record<string, jest.Mock>) {
  return new GoodsReceiptLineItemsDomainService(repository as unknown as GoodsReceiptLineItemsDomainRepository);
}

const serialConflict = (isOnLine: boolean, isInInventory: boolean) =>
  serviceWith({
    countOnLine: jest.fn().mockResolvedValue(0),
    findSerialConflict: jest.fn().mockResolvedValue({ isOnLine, isInInventory }),
  });

describe('GoodsReceiptLineItemsDomainService validations', () => {
  it('refuses serials on an item not tracked by serial', async () => {
    await expect(serviceWith({}).addLineItem({ ...item, tracking: 'LOT' }, line, dto)).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Serials Not Tracked' }),
    });
  });

  it('refuses a serial beyond the line quantity', async () => {
    const service = serviceWith({ countOnLine: jest.fn().mockResolvedValue(2) });
    await expect(service.addLineItem(item, line, dto)).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Line Full',
        errors: [{ field: 'serialNumber', message: 'Line is full' }],
      }),
    });
  });

  it('refuses a serial already on the line or already in inventory', async () => {
    await expect(serialConflict(true, true).addLineItem(item, line, dto)).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Duplicate Serial',
        errors: [{ field: 'serialNumber', message: 'Already on this line' }],
      }),
    });
    await expect(serialConflict(false, true).addLineItem(item, line, dto)).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Duplicate Serial',
        errors: [{ field: 'serialNumber', message: 'Already in inventory' }],
      }),
    });
  });

  it('reports a serial that is not on the line', async () => {
    const service = serviceWith({ findOnLine: jest.fn().mockResolvedValue(undefined) });
    await expect(service.removeLineItem(line, 'li-1')).rejects.toMatchObject({ status: 404 });
  });
});

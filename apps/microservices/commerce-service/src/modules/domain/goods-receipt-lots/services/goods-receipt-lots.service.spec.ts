import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { AddGoodsReceiptLotDto } from '../dto/request/add-goods-receipt-lot.dto';
import type { GoodsReceiptLotsDomainRepository } from '../repositories/goods-receipt-lots.repository';
import { type GoodsReceiptLotItem, GoodsReceiptLotsDomainService } from './goods-receipt-lots.service';

beforeAll(() => Logger.overrideLogger(false));

const item: GoodsReceiptLotItem = { id: 'gri-1', siteId: 'site-1', tracking: 'LOT' };

const lot: AddGoodsReceiptLotDto = {
  goodsReceiptId: 'gr-1',
  itemId: 'gri-1',
  lotNumber: 'B1',
  expiryDate: '2028-01-01',
};

function serviceWith(repository: Record<string, jest.Mock>) {
  return new GoodsReceiptLotsDomainService(repository as unknown as GoodsReceiptLotsDomainRepository);
}

describe('GoodsReceiptLotsDomainService validations', () => {
  it('refuses lots on an item not tracked by lot', async () => {
    await expect(serviceWith({}).addLot({ ...item, tracking: 'SERIAL' }, lot, 'INR')).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Lots Not Tracked',
        detail: 'This item is tracked by serial, so it has no lots.',
      }),
    });
  });

  it('refuses a lot number already on the item', async () => {
    const service = serviceWith({ isLotNumberTaken: jest.fn().mockResolvedValue(true) });
    await expect(service.addLot(item, lot, 'INR')).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Lot Already Added',
        errors: [{ field: 'lotNumber', message: 'Already on this item' }],
      }),
    });
  });

  it('refuses an MRP in another currency than the legal entity', async () => {
    const service = serviceWith({ isLotNumberTaken: jest.fn().mockResolvedValue(false) });
    await expect(
      service.addLot(item, { ...lot, mrp: { currency: 'USD', value: '1.00' } }, 'INR'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'MRP Currency',
        errors: [{ field: 'mrp', message: 'Enter it in INR' }],
      }),
    });
  });

  it('reports a lot that is not on the item', async () => {
    const service = serviceWith({ findOnItem: jest.fn().mockResolvedValue(undefined) });
    await expect(service.removeLot(item, 'lot-1')).rejects.toMatchObject({ status: 404 });
  });
});

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { AddGoodsReceiptLineDto } from '../dto/request/add-goods-receipt-line.dto';
import type { GoodsReceiptLinesDomainRepository } from '../repositories/goods-receipt-lines.repository';
import { type DistributedReceiptItem, GoodsReceiptLinesDomainService } from './goods-receipt-lines.service';

beforeAll(() => Logger.overrideLogger(false));

const item = (overrides: Partial<DistributedReceiptItem> = {}): DistributedReceiptItem => ({
  id: 'gri-1',
  siteId: 'site-1',
  tracking: 'LOT',
  receivedQty: 10,
  rejectedQuantity: 2,
  ...overrides,
});

const line = (overrides: Partial<AddGoodsReceiptLineDto> = {}): AddGoodsReceiptLineDto => ({
  goodsReceiptId: 'gr-1',
  itemId: 'gri-1',
  goodsReceiptLotId: 'lot-1',
  locationId: 'loc-1',
  quantity: 4,
  ...overrides,
});

function serviceWith(repository: Record<string, jest.Mock>) {
  return new GoodsReceiptLinesDomainService(repository as unknown as GoodsReceiptLinesDomainRepository);
}

const rejection = (label: string, field: string) => ({
  response: expect.objectContaining({ label, errors: [expect.objectContaining({ field })] }),
});

describe('GoodsReceiptLinesDomainService validations', () => {
  it('fits the lot to how the item is tracked', async () => {
    const service = serviceWith({ isLotOfItem: jest.fn().mockResolvedValue(false) });
    await expect(service.addLine(item({ tracking: 'QUANTITY' }), line(), 4)).rejects.toMatchObject(
      rejection('Lot Not Tracked', 'goodsReceiptLotId'),
    );
    await expect(service.addLine(item(), line({ goodsReceiptLotId: null }), 4)).rejects.toMatchObject(
      rejection('Lot Required', 'goodsReceiptLotId'),
    );
    await expect(service.addLine(item(), line(), 4)).rejects.toMatchObject(
      rejection('Unknown Lot', 'goodsReceiptLotId'),
    );
  });

  it('refuses an empty line unless its serials are still to be scanned', async () => {
    const service = serviceWith({ isLotOfItem: jest.fn().mockResolvedValue(true) });
    await expect(service.addLine(item(), line({ quantity: 0 }), 0)).rejects.toMatchObject(
      rejection('Quantity Required', 'quantity'),
    );
  });

  it('refuses more than the accepted quantity not yet on a line', async () => {
    const service = serviceWith({
      isLotOfItem: jest.fn().mockResolvedValue(true),
      sumQuantityOfItem: jest.fn().mockResolvedValue('5'),
    });
    await expect(service.addLine(item(), line(), 4)).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Exceeds Accepted Quantity',
        detail: 'Only 3 of the 8 accepted is not on a line yet.',
        errors: [{ field: 'quantity', message: 'At most 3' }],
      }),
    });
  });

  it('refuses a second line for the same lot and location', async () => {
    const service = serviceWith({
      isLotOfItem: jest.fn().mockResolvedValue(true),
      sumQuantityOfItem: jest.fn().mockResolvedValue('0'),
      isLocationTaken: jest.fn().mockResolvedValue(true),
    });
    await expect(service.addLine(item(), line(), 4)).rejects.toMatchObject(rejection('Duplicate Line', 'locationId'));
  });

  it('reports a line that is not on the item', async () => {
    const service = serviceWith({ findOnItem: jest.fn().mockResolvedValue(undefined) });
    await expect(service.findOnItemOrThrow('gri-1', 'line-1')).rejects.toMatchObject({ status: 404 });
  });
});

describe('GoodsReceiptLinesDomainService.refreshIsBalanced', () => {
  it('balances a line without serials and counts the serials of the others', async () => {
    const repository = { update: jest.fn(), updateIsBalancedFromSerialCount: jest.fn() };
    const service = serviceWith(repository);
    await service.refreshIsBalanced('line-1', 'LOT');
    await service.refreshIsBalanced('line-2', 'LOT_SERIAL');
    expect(repository.update).toHaveBeenCalledWith('line-1', { isBalanced: true });
    expect(repository.updateIsBalancedFromSerialCount).toHaveBeenCalledWith('line-2');
  });
});

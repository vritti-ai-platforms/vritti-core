import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type {
  InboundDeliveriesDomainRepository,
  InboundDeliveryReceiptProgress,
  InboundDeliveryRow,
} from '../repositories/inbound-deliveries.repository';
import { InboundDeliveriesDomainService } from './inbound-deliveries.service';

beforeAll(() => Logger.overrideLogger(false));

const delivery = (overrides: Partial<InboundDeliveryRow> = {}): InboundDeliveryRow =>
  ({
    id: 'del-1',
    deliveryNumber: 'IBD-1',
    supplierId: 'sup-1',
    status: 'PLANNED',
    source: 'ANNOUNCED',
    expectedDeliveryDate: '2026-11-10',
    supplierDeliveryNoteDate: null,
    lineCount: 0,
    isEditable: true,
    canCancel: true,
    canDelete: true,
    canReceive: true,
    draftGoodsReceiptId: null,
    ...overrides,
  }) as InboundDeliveryRow;

const progress = (overrides: Partial<InboundDeliveryReceiptProgress> = {}): InboundDeliveryReceiptProgress => ({
  id: 'del-1',
  deliveryNumber: 'IBD-1',
  status: 'ARRIVED',
  source: 'ANNOUNCED',
  hasPostedReceipt: true,
  hasShortLine: false,
  ...overrides,
});

const rejection = (label: string, field?: string) => ({
  response: expect.objectContaining(field ? { label, errors: [expect.objectContaining({ field })] } : { label }),
});

function serviceWith(repository: Record<string, jest.Mock>) {
  return new InboundDeliveriesDomainService(repository as unknown as InboundDeliveriesDomainRepository);
}

describe('InboundDeliveriesDomainService validations', () => {
  it('reports a delivery out of reach', async () => {
    const service = serviceWith({ findDetail: jest.fn().mockResolvedValue(undefined) });
    await expect(service.findDetailOrThrow('del-1')).rejects.toMatchObject({ status: 404 });
  });

  it('refuses a delivery note dated after the expected day or already on another delivery', async () => {
    const service = serviceWith({ findDeliveryNumberByNote: jest.fn().mockResolvedValue('IBD-7') });
    const dto = { supplierId: 'sup-1', expectedDeliveryDate: '2026-11-10', supplierDeliveryNoteNumber: 'DN-1' };
    await expect(service.create({ ...dto, supplierDeliveryNoteDate: '2026-11-11' })).rejects.toMatchObject(
      rejection('Delivery Note Date Too Late', 'supplierDeliveryNoteDate'),
    );
    await expect(service.create(dto)).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Delivery Note Already Recorded',
        detail: 'The supplier\'s delivery note "DN-1" is already recorded on inbound delivery "IBD-7".',
      }),
    });
  });

  it('refuses editing a received delivery or one a purchase created', async () => {
    const service = serviceWith({});
    await expect(
      service.update(delivery({ status: 'RECEIVED', isEditable: false }), { id: 'del-1' }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Cannot Edit Delivery',
        detail: '"IBD-1" is RECEIVED, so it can no longer change.',
      }),
    });
    await expect(
      service.update(delivery({ source: 'GOODS_RECEIPT', isEditable: false }), { id: 'del-1' }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        detail: '"IBD-1" was created by its purchase. Change it on that purchase.',
      }),
    });
  });

  it('moves a delivery only forward, and cancels it only while nothing is received', async () => {
    const service = serviceWith({ update: jest.fn() });
    await expect(service.setStatus(delivery({ status: 'ARRIVED' }), 'IN_TRANSIT')).rejects.toMatchObject(
      rejection('Cannot Change Status', 'status'),
    );
    await expect(service.setStatus(delivery({ canCancel: false }), 'CANCELLED')).rejects.toMatchObject(
      rejection('Cannot Cancel'),
    );
    await expect(service.setStatus(delivery(), 'IN_TRANSIT')).resolves.toMatchObject({ success: true });
  });

  it('deletes only a planned delivery without lines or receipts', async () => {
    const service = serviceWith({});
    await expect(service.delete(delivery({ lineCount: 2, canDelete: false }))).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Cannot Delete',
        detail: 'Remove the lines of "IBD-1" before deleting it, or cancel it instead.',
      }),
    });
  });

  it('receives only an open delivery without a draft receipt and with something left', () => {
    const service = serviceWith({});
    expect(() => service.assertReceivable(delivery({ draftGoodsReceiptId: 'gr-1' }))).toThrow(
      expect.objectContaining(rejection('Draft Receipt Exists')),
    );
    expect(() => service.assertReceivable(delivery({ canReceive: false }))).toThrow(
      expect.objectContaining(rejection('Nothing Left to Receive')),
    );
  });
});

describe('InboundDeliveriesDomainService.syncReceiptStatus', () => {
  async function sync(row: InboundDeliveryReceiptProgress | undefined) {
    const update = jest.fn();
    await serviceWith({ findReceiptProgress: jest.fn().mockResolvedValue(row), update }).syncReceiptStatus('del-1');
    return update;
  }

  it('is received once every line is accepted, partially received while one is short', async () => {
    expect(await sync(progress())).toHaveBeenCalledWith('del-1', { status: 'RECEIVED' });
    expect(await sync(progress({ hasShortLine: true }))).toHaveBeenCalledWith('del-1', {
      status: 'PARTIALLY_RECEIVED',
    });
  });

  it('is received with its receipt when a purchase created it', async () => {
    expect(await sync(progress({ source: 'GOODS_RECEIPT', hasShortLine: true }))).toHaveBeenCalledWith('del-1', {
      status: 'RECEIVED',
    });
  });

  it('leaves a cancelled delivery, one without posted receipts and one already there', async () => {
    expect(await sync(progress({ status: 'CANCELLED' }))).not.toHaveBeenCalled();
    expect(await sync(progress({ hasPostedReceipt: false }))).not.toHaveBeenCalled();
    expect(await sync(progress({ status: 'RECEIVED' }))).not.toHaveBeenCalled();
  });
});

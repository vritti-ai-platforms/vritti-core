import type { PaymentTransfer } from '@/db/schema';
import type { PaymentTransfersDomainRepository } from '../repositories/payment-transfers.repository';
import { PaymentTransfersDomainService } from './payment-transfers.service';

// The real money module pulls in ESM-only dinero; the DTO only needs a minor-unit round trip
jest.mock('@vritti/api-sdk/money', () => ({
  CurrencyAmountDto: { from: (minor: bigint, currency: string) => ({ currency, value: String(minor) }) },
}));

const row = (overrides: Partial<PaymentTransfer> = {}): PaymentTransfer => ({
  id: 'pt-1',
  organizationId: 'org-1',
  intentId: 'pi-1',
  linkedAccountId: 'la-1',
  providerAccountId: 'acc_1',
  amount: 30000n,
  currency: 'INR',
  onHold: false,
  onHoldUntil: null,
  status: 'PENDING',
  providerTransferId: 'trf_1',
  errorCode: null,
  errorDescription: null,
  createdAt: new Date('2026-10-09T10:00:00Z'),
  updatedAt: new Date('2026-10-09T10:00:00Z'),
  ...overrides,
});

const transferEvent = {
  providerTransferId: 'trf_1',
  providerAccountId: 'acc_1',
  providerPaymentId: 'pay_1',
  status: 'PROCESSED' as const,
  errorCode: null,
  errorDescription: null,
};

describe('PaymentTransfersDomainService.applyTransferEvent', () => {
  const updateByProviderTransferIdFrom = jest.fn();
  const findByProviderTransferId = jest.fn();
  const findUnstampedByPaymentAndAccount = jest.fn();
  const repository = {
    updateByProviderTransferIdFrom,
    findByProviderTransferId,
    findUnstampedByPaymentAndAccount,
  } as unknown as PaymentTransfersDomainRepository;
  const service = new PaymentTransfersDomainService(repository);

  beforeEach(() => jest.resetAllMocks());

  it.each([
    ['PENDING', ['CREATED']],
    ['PROCESSED', ['CREATED', 'PENDING']],
    ['PARTIALLY_REVERSED', ['CREATED', 'PENDING', 'PROCESSED']],
    ['REVERSED', ['CREATED', 'PENDING', 'PROCESSED', 'PARTIALLY_REVERSED']],
    ['FAILED', ['CREATED', 'PENDING']],
    ['CREATED', []],
  ] as const)('moves a transfer to %s only from %j', async (status, from) => {
    updateByProviderTransferIdFrom.mockResolvedValue(row({ status }));

    await service.applyTransferEvent({ ...transferEvent, status });

    expect(updateByProviderTransferIdFrom).toHaveBeenCalledWith('trf_1', from, {
      status,
      errorCode: null,
      errorDescription: null,
    });
  });

  it('applies a forward move', async () => {
    updateByProviderTransferIdFrom.mockResolvedValue(row({ status: 'PROCESSED' }));

    const result = await service.applyTransferEvent(transferEvent);

    expect(result).toMatchObject({ outcome: 'applied', transfer: { id: 'pt-1', status: 'PROCESSED' } });
    expect(findByProviderTransferId).not.toHaveBeenCalled();
  });

  it('skips an event that would move a transfer backwards', async () => {
    updateByProviderTransferIdFrom.mockResolvedValue(undefined);
    findByProviderTransferId.mockResolvedValue(row({ status: 'PROCESSED' }));

    const result = await service.applyTransferEvent({ ...transferEvent, status: 'PENDING' });

    expect(result).toMatchObject({ outcome: 'stale', transfer: { status: 'PROCESSED' } });
    expect(findUnstampedByPaymentAndAccount).not.toHaveBeenCalled();
  });

  it('reports in flight an event for a leg of the same payment and account not yet stamped', async () => {
    updateByProviderTransferIdFrom.mockResolvedValue(undefined);
    findByProviderTransferId.mockResolvedValue(undefined);
    findUnstampedByPaymentAndAccount.mockResolvedValue(row({ providerTransferId: null, status: 'CREATED' }));

    const result = await service.applyTransferEvent(transferEvent);

    expect(findUnstampedByPaymentAndAccount).toHaveBeenCalledWith('pay_1', 'acc_1');
    expect(result).toEqual({ outcome: 'in_flight' });
  });

  it('reports unknown a transfer no leg of this platform matches', async () => {
    updateByProviderTransferIdFrom.mockResolvedValue(undefined);
    findByProviderTransferId.mockResolvedValue(undefined);
    findUnstampedByPaymentAndAccount.mockResolvedValue(undefined);

    expect(await service.applyTransferEvent(transferEvent)).toEqual({ outcome: 'unknown' });
  });

  it('reports unknown without a lookup when the event names no payment', async () => {
    updateByProviderTransferIdFrom.mockResolvedValue(undefined);
    findByProviderTransferId.mockResolvedValue(undefined);

    const result = await service.applyTransferEvent({ ...transferEvent, providerPaymentId: null });

    expect(findUnstampedByPaymentAndAccount).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: 'unknown' });
  });
});

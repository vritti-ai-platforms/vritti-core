import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { UpdateEnrollmentPurchasingDto } from '../dto/request/update-enrollment-purchasing.dto';
import type { SiteSuppliersDomainRepository } from '../repositories/site-suppliers.repository';
import type { SupplierEnrollmentsDomainRepository } from '../repositories/supplier-enrollments.repository';
import { SupplierEnrollmentsDomainService } from './supplier-enrollments.service';

const enrollment = {
  id: 'enr-1',
  isActive: true,
  isSupplierActive: false,
  purchaseType: 'DIRECT_PURCHASE',
  approvalEnabled: true,
  approvalThreshold: 500000n,
  qualityCheckEnabled: false,
  approverUserIds: ['u-1'],
};

function purchasing(overrides: Partial<UpdateEnrollmentPurchasingDto> = {}): UpdateEnrollmentPurchasingDto {
  return {
    supplierId: 'sup-1',
    siteId: 'site-1',
    purchaseType: 'STANDARD',
    approvalEnabled: true,
    approverUserIds: ['u-1', 'u-2', 'u-1'],
    approvalThreshold: { currency: 'INR', value: '5000.00' },
    qualityCheckEnabled: true,
    quarantineLocationId: 'loc-1',
    defaultReceiptLocationId: null,
    priceTolerancePct: 2,
    qtyTolerancePct: 0,
    amountTolerance: { currency: 'INR', value: '10.50' },
    ...overrides,
  } as UpdateEnrollmentPurchasingDto;
}

function setup(enrolled = true) {
  const update = jest.fn();
  const findApprovers = jest.fn().mockResolvedValue([
    { id: 'enr-1', approverUserIds: ['u-1'] },
    { id: 'enr-2', approverUserIds: [] },
  ]);
  const repository = {
    update,
    findApprovers,
    findBySupplierAndSite: jest.fn().mockResolvedValue(enrolled ? enrollment : undefined),
    findPurchasingSnapshot: jest
      .fn()
      .mockResolvedValue(enrolled ? { ...enrollment, purchasingBlocked: false } : undefined),
  } as unknown as SupplierEnrollmentsDomainRepository;
  const service = new SupplierEnrollmentsDomainService(repository, {} as SiteSuppliersDomainRepository);
  return { service, update, findApprovers };
}

beforeAll(() => Logger.overrideLogger(false));

describe('SupplierEnrollmentsDomainService purchasing settings', () => {
  it('stores the amounts in minor units of the legal entity currency and each approver once', async () => {
    const { service, update } = setup();
    await expect(service.updatePurchasing(purchasing(), 'INR')).resolves.toMatchObject({ success: true });
    expect(update).toHaveBeenCalledWith('enr-1', {
      purchaseType: 'STANDARD',
      approvalEnabled: true,
      approverUserIds: ['u-1', 'u-2'],
      approvalThreshold: 500000n,
      qualityCheckEnabled: true,
      quarantineLocationId: 'loc-1',
      defaultReceiptLocationId: null,
      priceTolerancePct: 2,
      qtyTolerancePct: 0,
      amountTolerance: 1050n,
    });
  });

  it('accepts a zero threshold, which sends every leg to approval', async () => {
    const { service, update } = setup();
    await service.updatePurchasing(purchasing({ approvalThreshold: { currency: 'INR', value: '0' } }), 'INR');
    expect(update).toHaveBeenCalledWith('enr-1', expect.objectContaining({ approvalThreshold: 0n }));
  });

  it('keeps no threshold when every leg needs approval', async () => {
    const { service, update } = setup();
    await service.updatePurchasing(purchasing({ approvalThreshold: null }), 'INR');
    expect(update).toHaveBeenCalledWith('enr-1', expect.objectContaining({ approvalThreshold: null }));
  });

  it('rejects approval without approvers', async () => {
    const { service, update } = setup();
    await expect(service.updatePurchasing(purchasing({ approverUserIds: [] }), 'INR')).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Approvers Required',
        errors: [expect.objectContaining({ field: 'approverUserIds' })],
      }),
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('allows no approvers while approval is off', async () => {
    const { service, update } = setup();
    await service.updatePurchasing(purchasing({ approvalEnabled: false, approverUserIds: [] }), 'INR');
    expect(update).toHaveBeenCalled();
  });

  it('rejects quality check without a quarantine location', async () => {
    const { service } = setup();
    await expect(service.updatePurchasing(purchasing({ quarantineLocationId: null }), 'INR')).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Quarantine Location Required',
        errors: [expect.objectContaining({ field: 'quarantineLocationId' })],
      }),
    });
  });

  it('rejects an amount in another currency than the legal entity one', async () => {
    const { service } = setup();
    await expect(
      service.updatePurchasing(purchasing({ amountTolerance: { currency: 'USD', value: '1.00' } }), 'INR'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Wrong Currency',
        errors: [expect.objectContaining({ field: 'amountTolerance' })],
      }),
    });
  });

  it('rejects negative tolerances, one error per field', async () => {
    const { service, update } = setup();
    await expect(
      service.updatePurchasing(
        purchasing({ priceTolerancePct: -1, amountTolerance: { currency: 'INR', value: '-2.00' } }),
        'INR',
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Invalid Tolerance',
        errors: [
          expect.objectContaining({ field: 'priceTolerancePct' }),
          expect.objectContaining({ field: 'amountTolerance' }),
        ],
      }),
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('answers 404 for a supplier not enrolled at the site', async () => {
    const { service } = setup(false);
    await expect(service.updatePurchasing(purchasing(), 'INR')).rejects.toMatchObject({ status: 404 });
  });
});

describe('SupplierEnrollmentsDomainService purchasing reads', () => {
  it('snapshots what a leg copies from the enrollment', async () => {
    const { service } = setup();
    await expect(service.findPurchasingSnapshot('sup-1', 'site-1')).resolves.toEqual({
      enrollmentId: 'enr-1',
      isActive: true,
      isSupplierActive: false,
      purchaseType: 'DIRECT_PURCHASE',
      approvalEnabled: true,
      approvalThreshold: 500000n,
      qualityCheckEnabled: false,
      approverUserIds: ['u-1'],
      purchasingBlocked: false,
    });
  });

  it('has no snapshot where the supplier is not enrolled', async () => {
    const { service } = setup(false);
    await expect(service.findPurchasingSnapshot('sup-1', 'site-1')).resolves.toBeUndefined();
  });

  it('maps approvers by enrollment and skips the query for no enrollments', async () => {
    const { service, findApprovers } = setup();
    await expect(service.findApproverUserIds([])).resolves.toEqual(new Map());
    expect(findApprovers).not.toHaveBeenCalled();
    const approvers = await service.findApproverUserIds(['enr-1', 'enr-2', 'enr-1']);
    expect(findApprovers).toHaveBeenCalledWith(['enr-1', 'enr-2']);
    expect(approvers.get('enr-1')).toEqual(['u-1']);
    expect(approvers.get('enr-2')).toEqual([]);
  });
});

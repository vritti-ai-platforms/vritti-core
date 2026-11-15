import 'reflect-metadata';
import type { LocationsDomainRepository } from '@domain/locations/repositories/locations.repository';
import { LocationsDomainService } from '@domain/locations/services/locations.service';
import type { UpdateEnrollmentPurchasingDto } from '@domain/supplier-enrollments/dto/request/update-enrollment-purchasing.dto';
import type { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { Logger } from '@nestjs/common';
import type { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { LeSupplierEnrollmentsService } from './supplier-enrollments.service';

const siteLocations: Record<string, { name: string; siteId: string }> = {
  'loc-quarantine': { name: 'Quarantine', siteId: 'site-1' },
  'loc-dock': { name: 'Dock', siteId: 'site-1' },
  'loc-elsewhere': { name: 'Other store', siteId: 'site-2' },
};

function purchasing(overrides: Partial<UpdateEnrollmentPurchasingDto> = {}): UpdateEnrollmentPurchasingDto {
  return {
    supplierId: 'sup-1',
    siteId: 'site-1',
    quarantineLocationId: 'loc-quarantine',
    defaultReceiptLocationId: 'loc-dock',
    ...overrides,
  } as UpdateEnrollmentPurchasingDto;
}

function setup() {
  const updatePurchasing = jest.fn().mockResolvedValue({ success: true, message: 'Purchasing settings updated.' });
  const repository = {
    findById: jest.fn((id: string) => Promise.resolve(siteLocations[id])),
  } as unknown as LocationsDomainRepository;
  const service = new LeSupplierEnrollmentsService(
    { updatePurchasing } as unknown as SupplierEnrollmentsDomainService,
    new LocationsDomainService({} as PrimaryDatabaseService, repository),
  );
  return { service, updatePurchasing };
}

beforeAll(() => Logger.overrideLogger(false));

describe('LeSupplierEnrollmentsService purchasing settings', () => {
  it('saves settings whose locations are at the enrollment site', async () => {
    const { service, updatePurchasing } = setup();
    await expect(service.updatePurchasing(purchasing(), 'INR')).resolves.toMatchObject({ success: true });
    expect(updatePurchasing).toHaveBeenCalledWith(purchasing(), 'INR');
  });

  it('checks no location when none is picked', async () => {
    const { service, updatePurchasing } = setup();
    await service.updatePurchasing(purchasing({ quarantineLocationId: null, defaultReceiptLocationId: null }), 'INR');
    expect(updatePurchasing).toHaveBeenCalled();
  });

  it('rejects a location of another site on its own field', async () => {
    const { service, updatePurchasing } = setup();
    await expect(
      service.updatePurchasing(purchasing({ defaultReceiptLocationId: 'loc-elsewhere' }), 'INR'),
    ).rejects.toMatchObject({
      status: 400,
      response: expect.objectContaining({
        label: 'Location Not at Site',
        errors: [{ field: 'defaultReceiptLocationId', message: 'Not at this site' }],
      }),
    });
    expect(updatePurchasing).not.toHaveBeenCalled();
  });

  it('rejects a location that does not exist', async () => {
    const { service } = setup();
    await expect(
      service.updatePurchasing(purchasing({ quarantineLocationId: 'loc-gone' }), 'INR'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        errors: [{ field: 'quarantineLocationId', message: 'Location not found' }],
      }),
    });
  });
});

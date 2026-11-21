import 'reflect-metadata';
import { InventoryItemSitesDomainRepository } from '@domain/inventory-item-sites/repositories/inventory-item-sites.repository';
import { PurchaseItemAllocationsDomainRepository } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import { PurchaseItemAllocationsDomainService } from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import type { PurchaseItemsDomainRepository } from '@domain/purchase-items/repositories/purchase-items.repository';
import { PurchaseSuppliersDomainRepository } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import type { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import type { SupplierQuotationsDomainService } from '@domain/supplier-quotations/services/supplier-quotations.service';
import type { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import type { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Logger } from '@nestjs/common';
import type { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { PurchasingRulesService } from '@/modules/site/purchasing-rules/services/purchasing-rules.service';
import { PurchasesAllocationsService } from './purchases-allocations.service';

beforeAll(() => Logger.overrideLogger(false));

const purchase = {
  id: 'pur-1',
  purchaseNumber: 'PUR-202611-0001',
  siteId: 'site-1',
  status: 'OPEN',
  step: 'SOURCING',
  quotationsRequired: false,
};
const leg = {
  id: 'leg-1',
  purchaseId: 'pur-1',
  supplierId: 'sup-1',
  supplierName: 'Acme',
  type: 'STANDARD',
  step: 'SOURCING',
  status: 'OPEN',
};

function setup(
  options: {
    existingLeg?: typeof leg;
    remainingAllocations?: number;
    purchasingBlocked?: boolean;
    itemBlocked?: boolean;
  } = {},
) {
  const legsRepository = {
    findForSupplier: jest.fn().mockResolvedValue(options.existingLeg),
    findDetailOnPurchase: jest.fn().mockResolvedValue(leg),
    create: jest.fn().mockResolvedValue(leg),
    delete: jest.fn(),
  };
  const allocationsRepository = {
    findOne: jest.fn().mockResolvedValue(undefined),
    findDetailOnPurchase: jest.fn().mockResolvedValue({
      id: 'alloc-1',
      purchaseItemId: 'pi-1',
      purchaseSupplierId: 'leg-1',
      inventoryItemName: 'Paracetamol',
      currencyCode: 'INR',
      unitPrice: 100n,
      uomId: 'uom-strip',
      uomQty: 1,
      primaryUomQty: 10,
    }),
    create: jest.fn().mockResolvedValue({ id: 'alloc-1' }),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(options.remainingAllocations ?? 0),
  };
  const findPurchasingSnapshot = jest.fn().mockResolvedValue({
    enrollmentId: 'enr-1',
    isActive: true,
    isSupplierActive: true,
    purchasingBlocked: options.purchasingBlocked ?? false,
    purchaseType: 'STANDARD',
    approvalEnabled: false,
    approvalThreshold: null,
    qualityCheckEnabled: false,
    approverUserIds: [],
  });
  const legsRepositoryWithGuards = {
    ...legsRepository,
    findOnPurchaseOrThrow: PurchaseSuppliersDomainRepository.prototype.findOnPurchaseOrThrow,
    assertPurchaseOpen: PurchaseSuppliersDomainRepository.prototype.assertPurchaseOpen,
    requireActiveEnrollment: PurchaseSuppliersDomainRepository.prototype.requireActiveEnrollment,
  } as unknown as PurchaseSuppliersDomainRepository;
  const allocationsRepositoryWithGuards = {
    ...allocationsRepository,
    findForItemAndLeg: allocationsRepository.findOne,
    countByLeg: allocationsRepository.count,
    findOnPurchaseOrThrow: PurchaseItemAllocationsDomainRepository.prototype.findOnPurchaseOrThrow,
    assertEnteredAllowed: PurchaseItemAllocationsDomainRepository.prototype.assertEnteredAllowed,
  } as unknown as PurchaseItemAllocationsDomainRepository;
  const service = new PurchasesAllocationsService(
    { runInTransaction: (fn: () => Promise<unknown>) => fn() } as unknown as PrimaryDatabaseService,
    { findDetailOrThrow: jest.fn().mockResolvedValue(purchase) } as unknown as PurchasesDomainRepository,
    {
      findOnPurchaseOrThrow: jest
        .fn()
        .mockResolvedValue({ id: 'pi-1', inventoryItemId: 'item-1', inventoryItemName: 'Paracetamol', primaryQty: 95 }),
    } as unknown as PurchaseItemsDomainRepository,
    new PurchaseSuppliersDomainService(legsRepositoryWithGuards),
    legsRepositoryWithGuards,
    new PurchaseItemAllocationsDomainService(allocationsRepositoryWithGuards),
    allocationsRepositoryWithGuards,
    {
      findByIdOrThrow: jest.fn().mockResolvedValue({ id: 'sup-1', currencyCode: 'INR', currencyCodes: ['INR'] }),
    } as unknown as SuppliersDomainService,
    { findPurchasingSnapshot } as unknown as SupplierEnrollmentsDomainService,
    { assertSourced: jest.fn() } as unknown as PurchasingRulesService,
    {} as SupplierQuotationsDomainService,
    { toPrimaryUomQuantity: jest.fn().mockResolvedValue(100) } as unknown as UomConversionsDomainService,
    Object.assign(Object.create(InventoryItemSitesDomainRepository.prototype), {
      countAtSite: jest.fn().mockResolvedValue({ requested: 1, carried: 1, blocked: options.itemBlocked ? 1 : 0 }),
    }) as InventoryItemSitesDomainRepository,
  );
  return { service, legsRepository, allocationsRepository, findPurchasingSnapshot };
}

const dto = {
  id: 'pur-1',
  purchaseItemId: 'pi-1',
  supplierId: 'sup-1',
  uomId: 'uom-strip',
  uomQty: 10,
  unitPrice: { currency: 'INR' as const, value: '1.00' },
};

describe('PurchasesAllocationsService legs', () => {
  it('opens the supplier’s leg with its enrollment on the first allocation to it', async () => {
    const { service, legsRepository, findPurchasingSnapshot } = setup();
    await service.create(dto);
    expect(findPurchasingSnapshot).toHaveBeenCalledWith('sup-1', 'site-1');
    expect(legsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ supplierEnrollmentId: 'enr-1' }));
  });

  it('refuses the first allocation to a supplier blocked from purchasing', async () => {
    const { service, legsRepository, allocationsRepository } = setup({ purchasingBlocked: true });
    await expect(service.create(dto)).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Supplier Blocked' }),
    });
    expect(legsRepository.create).not.toHaveBeenCalled();
    expect(allocationsRepository.create).not.toHaveBeenCalled();
  });

  it('refuses allocating an item the site has blocked buying', async () => {
    const { service, legsRepository } = setup({ itemBlocked: true });
    await expect(service.create(dto)).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Purchasing Blocked' }),
    });
    expect(legsRepository.create).not.toHaveBeenCalled();
  });

  it('allocates to the leg already open for the supplier', async () => {
    const { service, legsRepository, findPurchasingSnapshot } = setup({ existingLeg: leg });
    await service.create(dto);
    expect(findPurchasingSnapshot).not.toHaveBeenCalled();
    expect(legsRepository.create).not.toHaveBeenCalled();
  });

  it('deletes the leg with its last allocation', async () => {
    const { service, legsRepository } = setup({ remainingAllocations: 0 });
    const result = await service.delete('pur-1', 'alloc-1');
    expect(legsRepository.delete).toHaveBeenCalledWith('leg-1');
    expect(result.message).toContain('Acme has no allocations left');
  });

  it('keeps the leg while it has other allocations', async () => {
    const { service, legsRepository, allocationsRepository } = setup({ remainingAllocations: 2 });
    await service.delete('pur-1', 'alloc-1');
    expect(allocationsRepository.delete).toHaveBeenCalledWith('alloc-1');
    expect(legsRepository.delete).not.toHaveBeenCalled();
  });
});

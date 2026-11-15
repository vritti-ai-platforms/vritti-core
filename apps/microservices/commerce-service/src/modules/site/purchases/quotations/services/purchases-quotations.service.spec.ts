import 'reflect-metadata';
import type { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
import type { PurchaseSuppliersDomainRepository } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { PurchaseRow, PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import type { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import type { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import type { SupplierQuotationsDomainService } from '@domain/supplier-quotations/services/supplier-quotations.service';
import type { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import type { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Logger } from '@nestjs/common';
import { PurchasesQuotationsService } from './purchases-quotations.service';

beforeAll(() => Logger.overrideLogger(false));

function setup(options: { purchasingBlocked?: boolean; siteUnits?: Map<string, string> } = {}) {
  const purchasesService = new PurchasesDomainService({} as PurchasesDomainRepository);
  jest.spyOn(purchasesService, 'findDetailOrThrow').mockResolvedValue({
    id: 'pur-1',
    purchaseNumber: 'PUR-202611-0001',
    siteId: 'site-1',
    status: 'OPEN',
    step: 'QUOTING',
  } as PurchaseRow);
  const createDraftForPurchase = jest.fn().mockResolvedValue({ quotationId: 'q-1' });
  const service = new PurchasesQuotationsService(
    purchasesService,
    {
      findByPurchaseId: jest.fn().mockResolvedValue([
        { id: 'pi-1', inventoryItemId: 'item-1' },
        { id: 'pi-2', inventoryItemId: 'item-2' },
      ]),
    } as unknown as PurchaseItemsDomainService,
    new PurchaseSuppliersDomainService({} as PurchaseSuppliersDomainRepository),
    {
      findByIdOrThrow: jest.fn().mockResolvedValue({ id: 'sup-1', currencyCode: 'INR', currencyCodes: ['INR'] }),
    } as unknown as SuppliersDomainService,
    {
      findPurchasingSnapshot: jest.fn().mockResolvedValue({
        enrollmentId: 'enr-1',
        isActive: true,
        isSupplierActive: true,
        purchasingBlocked: options.purchasingBlocked ?? false,
        purchaseType: 'STANDARD',
        approvalEnabled: false,
        approvalThreshold: null,
        qualityCheckEnabled: false,
        approverUserIds: [],
      }),
    } as unknown as SupplierEnrollmentsDomainService,
    {
      findSiteUnits: jest.fn().mockResolvedValue(options.siteUnits ?? new Map([['item-1', 'uom-strip']])),
    } as unknown as SupplierItemsDomainService,
    { createDraftForPurchase } as unknown as SupplierQuotationsDomainService,
    {} as UomConversionsDomainService,
  );
  return { service, createDraftForPurchase };
}

const dto = { id: 'pur-1', supplierId: 'sup-1' };

describe('PurchasesQuotationsService.request', () => {
  it("drafts a quotation the purchase's site owns with the items the supplier supplies there", async () => {
    const { service, createDraftForPurchase } = setup();
    const result = await service.request(dto);
    expect(createDraftForPurchase).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseId: 'pur-1',
        siteId: 'site-1',
        currencyCode: 'INR',
        lines: [{ purchaseItemId: 'pi-1', inventoryItemId: 'item-1', uomId: 'uom-strip' }],
      }),
    );
    expect(result.message).toContain('1 item the supplier does not supply here left out');
  });

  it('refuses a supplier blocked from purchasing', async () => {
    const { service, createDraftForPurchase } = setup({ purchasingBlocked: true });
    await expect(service.request(dto)).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Supplier Blocked',
        errors: [{ field: 'supplierId', message: 'Blocked from purchasing' }],
      }),
    });
    expect(createDraftForPurchase).not.toHaveBeenCalled();
  });

  it('refuses a supplier that supplies none of the items at the site', async () => {
    const { service, createDraftForPurchase } = setup({ siteUnits: new Map() });
    await expect(service.request(dto)).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Nothing To Quote' }),
    });
    expect(createDraftForPurchase).not.toHaveBeenCalled();
  });
});

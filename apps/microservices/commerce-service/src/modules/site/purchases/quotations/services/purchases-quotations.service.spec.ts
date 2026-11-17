import 'reflect-metadata';
import type { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
import { PurchaseSuppliersDomainRepository } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import { type PurchaseRow, PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import type { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import type { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import type { SupplierQuotationsDomainService } from '@domain/supplier-quotations/services/supplier-quotations.service';
import type { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import type { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Logger } from '@nestjs/common';
import type { PurchasingRulesService } from '@/modules/site/purchasing-rules/services/purchasing-rules.service';
import { PurchasesQuotationsService } from './purchases-quotations.service';

beforeAll(() => Logger.overrideLogger(false));

function setup(
  options: {
    purchasingBlocked?: boolean;
    siteUnits?: Map<string, string>;
    unsourced?: Set<string>;
    quotationsRequired?: boolean;
  } = {},
) {
  const purchasesRepository = {
    findDetailOrThrow: jest.fn().mockResolvedValue({
      id: 'pur-1',
      purchaseNumber: 'PUR-202611-0001',
      siteId: 'site-1',
      status: 'OPEN',
      quotationsRequired: options.quotationsRequired ?? true,
    } as PurchaseRow),
    assertOpen: PurchasesDomainRepository.prototype.assertOpen,
  } as unknown as PurchasesDomainRepository;
  const createDraftForPurchase = jest.fn().mockResolvedValue({ quotationId: 'q-1' });
  const findSiteUnits = jest.fn().mockResolvedValue(options.siteUnits ?? new Map([['item-1', 'uom-strip']]));
  const findUnsourcedItemIds = jest.fn().mockResolvedValue(options.unsourced ?? new Set());
  const service = new PurchasesQuotationsService(
    purchasesRepository,
    {
      findByPurchaseId: jest.fn().mockResolvedValue([
        { id: 'pi-1', inventoryItemId: 'item-1', primaryUomId: 'uom-tab', primaryQty: 100, allocatedPrimaryQty: '0' },
        { id: 'pi-2', inventoryItemId: 'item-2', primaryUomId: 'uom-ml', primaryQty: 50, allocatedPrimaryQty: '10' },
        { id: 'pi-3', inventoryItemId: 'item-3', primaryUomId: 'uom-tab', primaryQty: 20, allocatedPrimaryQty: '20' },
      ]),
    } as unknown as PurchaseItemsDomainService,
    {
      requireActiveEnrollment: PurchaseSuppliersDomainRepository.prototype.requireActiveEnrollment,
    } as unknown as PurchaseSuppliersDomainRepository,
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
    { findSiteUnits } as unknown as SupplierItemsDomainService,
    { createDraftForPurchase } as unknown as SupplierQuotationsDomainService,
    {} as UomConversionsDomainService,
    { findUnsourcedItemIds } as unknown as PurchasingRulesService,
  );
  return { service, createDraftForPurchase, findSiteUnits };
}

const dto = { id: 'pur-1', supplierId: 'sup-1' };

describe('PurchasesQuotationsService.request', () => {
  it("drafts a quotation the purchase's site owns with every item still to allocate, in the supplier's unit else the primary", async () => {
    const { service, createDraftForPurchase, findSiteUnits } = setup();
    await service.request(dto);
    expect(findSiteUnits).toHaveBeenCalledWith('sup-1', 'site-1', ['item-1', 'item-2']);
    expect(createDraftForPurchase).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseId: 'pur-1',
        siteId: 'site-1',
        currencyCode: 'INR',
        lines: [
          { purchaseItemId: 'pi-1', inventoryItemId: 'item-1', uomId: 'uom-strip' },
          { purchaseItemId: 'pi-2', inventoryItemId: 'item-2', uomId: 'uom-ml' },
        ],
      }),
    );
  });

  it("leaves out items the site's rules buy only from suppliers set up for them", async () => {
    const { service, createDraftForPurchase } = setup({ unsourced: new Set(['item-2']) });
    const result = await service.request(dto);
    expect(createDraftForPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ lines: [{ purchaseItemId: 'pi-1', inventoryItemId: 'item-1', uomId: 'uom-strip' }] }),
    );
    expect(result.message).toContain('1 item the supplier does not have set up here left out');
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

  it('refuses a supplier the rules leave none of the items to', async () => {
    const { service, createDraftForPurchase } = setup({ unsourced: new Set(['item-1', 'item-2']) });
    await expect(service.request(dto)).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Nothing To Quote' }),
    });
    expect(createDraftForPurchase).not.toHaveBeenCalled();
  });

  it('refuses a purchase that does not require quotations', async () => {
    const { service, createDraftForPurchase } = setup({ quotationsRequired: false });
    await expect(service.request(dto)).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Quotations Not Required' }),
    });
    expect(createDraftForPurchase).not.toHaveBeenCalled();
  });
});

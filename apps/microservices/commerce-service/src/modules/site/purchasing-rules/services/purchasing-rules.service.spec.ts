import 'reflect-metadata';
import type { InventoryItemSitesDomainRepository } from '@domain/inventory-item-sites/repositories/inventory-item-sites.repository';
import type { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
import { SitePurchasingSettingsDto } from '@domain/site-purchasing-settings/dto/entity/site-purchasing-settings.dto';
import type { SitePurchasingSettingsDomainService } from '@domain/site-purchasing-settings/services/site-purchasing-settings.service';
import type { SupplierItemPricesDomainService } from '@domain/supplier-item-prices/services/supplier-item-prices.service';
import type { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import { Logger } from '@nestjs/common';
import { type OrderedLine, PurchasingRulesService } from './purchasing-rules.service';

beforeAll(() => Logger.overrideLogger(false));

function setup(
  options: {
    supplierItemsRequired?: boolean;
    updateSupplierItemsFromOrders?: boolean;
    flaggedItemIds?: string[];
    suppliedItemIds?: string[];
    unallocatedItemIds?: string[];
  } = {},
) {
  const settings = Object.assign(SitePurchasingSettingsDto.defaults('site-1'), {
    supplierItemsRequired: options.supplierItemsRequired ?? false,
    updateSupplierItemsFromOrders: options.updateSupplierItemsFromOrders ?? false,
  });
  const findOrCreateItemAtSite = jest.fn().mockResolvedValue('si-1');
  const assertSetUp = jest.fn();
  const recordOrderPrice = jest.fn().mockResolvedValue(true);
  const service = new PurchasingRulesService(
    { findForSite: jest.fn().mockResolvedValue(settings) } as unknown as SitePurchasingSettingsDomainService,
    {
      findSupplierItemsRequiredIds: jest.fn().mockResolvedValue(options.flaggedItemIds ?? []),
    } as unknown as InventoryItemSitesDomainRepository,
    {
      findOrCreateItemAtSite,
      assertSetUp,
      findSetUpItemIds: jest.fn().mockResolvedValue(new Set(options.suppliedItemIds ?? [])),
    } as unknown as SupplierItemsDomainService,
    { recordOrderPrice } as unknown as SupplierItemPricesDomainService,
    {
      findUnallocatedItemIds: jest.fn().mockResolvedValue(options.unallocatedItemIds ?? []),
    } as unknown as PurchaseItemsDomainService,
  );
  return { service, findOrCreateItemAtSite, assertSetUp, recordOrderPrice };
}

const order = { siteId: 'site-1', supplierId: 'sup-1', poNumber: 'PO-202611-0001', orderDate: '2026-11-17' };

const line = (overrides: Partial<OrderedLine> = {}): OrderedLine => ({
  inventoryItemId: 'item-1',
  uomId: 'uom-strip',
  expectedDeliveryDate: '2026-11-21',
  unitPrice: 2850n,
  currencyCode: 'INR',
  sourceUnitPrice: null,
  sourceCurrencyCode: null,
  schemeBuyQty: 10,
  schemeFreeQty: 1,
  ...overrides,
});

describe('PurchasingRulesService.findRequiredItemIds', () => {
  it('requires none while the site rule is off and no item is flagged', async () => {
    const { service } = setup();
    expect(await service.findRequiredItemIds('site-1', ['item-1', 'item-2'])).toEqual(new Set());
  });

  it('requires every item while the site rule is on', async () => {
    const { service } = setup({ supplierItemsRequired: true });
    expect(await service.findRequiredItemIds('site-1', ['item-1', 'item-2', 'item-1'])).toEqual(
      new Set(['item-1', 'item-2']),
    );
  });

  it('requires only the flagged items while the site rule is off', async () => {
    const { service } = setup({ flaggedItemIds: ['item-2'] });
    expect(await service.findRequiredItemIds('site-1', ['item-1', 'item-2'])).toEqual(new Set(['item-2']));
  });
});

describe('PurchasingRulesService.findSupplierPicker', () => {
  it('narrows nothing without items', async () => {
    const { service } = setup({ supplierItemsRequired: true });
    expect(await service.findSupplierPicker('site-1', {})).toEqual({ itemIds: [], onlySupplying: false });
  });

  it('keeps only set-up suppliers when asked, or when every item falls under the rules', async () => {
    expect(
      await setup().service.findSupplierPicker('site-1', { suppliedItemIds: ['item-1'], onlySupplying: true }),
    ).toEqual({ itemIds: ['item-1'], onlySupplying: true });
    expect(
      await setup({ flaggedItemIds: ['item-1'] }).service.findSupplierPicker('site-1', { suppliedItemIds: ['item-1'] }),
    ).toEqual({ itemIds: ['item-1'], onlySupplying: true });
  });

  it("marks only, when a purchase's items still to allocate are not all under the rules", async () => {
    const { service } = setup({ flaggedItemIds: ['item-1'], unallocatedItemIds: ['item-1', 'item-2'] });
    expect(await service.findSupplierPicker('site-1', { forPurchaseId: 'pur-1' })).toEqual({
      itemIds: ['item-1', 'item-2'],
      onlySupplying: false,
    });
  });
});

describe('PurchasingRulesService.findUnsourcedItemIds', () => {
  it("returns the required items the legal entity has not set up as the supplier's items", async () => {
    const { service } = setup({ supplierItemsRequired: true, suppliedItemIds: ['item-1'] });
    expect(await service.findUnsourcedItemIds('sup-1', 'site-1', ['item-1', 'item-2'])).toEqual(new Set(['item-2']));
  });
});

describe('PurchasingRulesService.assertSourced', () => {
  it('checks the supplier only for the required items', async () => {
    const { service, assertSetUp } = setup({ flaggedItemIds: ['item-2'] });
    await service.assertSourced(
      'sup-1',
      'site-1',
      [
        { inventoryItemId: 'item-1', uomId: 'uom-strip' },
        { inventoryItemId: 'item-2', uomId: 'uom-box' },
      ],
      'supplierId',
    );
    expect(assertSetUp).toHaveBeenCalledWith('sup-1', [{ inventoryItemId: 'item-2', uomId: 'uom-box' }], 'supplierId');
  });
});

describe('PurchasingRulesService.recordSentOrder', () => {
  it('records nothing while the site does not update supplier items from its orders', async () => {
    const { service, findOrCreateItemAtSite, recordOrderPrice } = setup();
    await service.recordSentOrder(order, [line()]);
    expect(findOrCreateItemAtSite).not.toHaveBeenCalled();
    expect(recordOrderPrice).not.toHaveBeenCalled();
  });

  it("sets up each item and unit once with the order's lead time and records what it paid", async () => {
    const { service, findOrCreateItemAtSite, recordOrderPrice } = setup({ updateSupplierItemsFromOrders: true });
    await service.recordSentOrder(order, [line(), line({ expectedDeliveryDate: '2026-12-01' })]);
    expect(findOrCreateItemAtSite).toHaveBeenCalledTimes(1);
    expect(findOrCreateItemAtSite).toHaveBeenCalledWith(
      {
        supplierId: 'sup-1',
        inventoryItemId: 'item-1',
        uomId: 'uom-strip',
        supplierItemCode: null,
        defaultLeadTimeDays: 4,
      },
      'site-1',
    );
    expect(recordOrderPrice).toHaveBeenCalledWith('si-1', 'site-1', {
      unitPrice: 2850n,
      currencyCode: 'INR',
      schemeBuyQty: 10,
      schemeFreeQty: 1,
      orderDate: '2026-11-17',
      poNumber: 'PO-202611-0001',
    });
  });

  it('records the price in the currency the supplier quoted when the order converted it', async () => {
    const { service, recordOrderPrice } = setup({ updateSupplierItemsFromOrders: true });
    await service.recordSentOrder(order, [line({ sourceUnitPrice: 3400n, sourceCurrencyCode: 'USD' })]);
    expect(recordOrderPrice).toHaveBeenCalledWith(
      'si-1',
      'site-1',
      expect.objectContaining({ unitPrice: 3400n, currencyCode: 'USD' }),
    );
  });
});

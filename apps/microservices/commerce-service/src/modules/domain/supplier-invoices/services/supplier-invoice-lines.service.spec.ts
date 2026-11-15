import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import type { SupplierInvoiceLineFieldsDto } from '../dto/request/supplier-invoice-line-fields.dto';
import type {
  InvoiceableGoodsReceiptRow,
  InvoiceableGoodsReceiptsRepository,
} from '../repositories/invoiceable-goods-receipts.repository';
import { SupplierInvoiceLinesDomainRepository } from '../repositories/supplier-invoice-lines.repository';
import type { SupplierInvoicesDomainRepository } from '../repositories/supplier-invoices.repository';
import { type InvoiceForLines, SupplierInvoiceLinesDomainService } from './supplier-invoice-lines.service';

beforeAll(() => Logger.overrideLogger(false));

const invoice: InvoiceForLines = {
  id: 'inv-1',
  invoiceNumber: 'INV-1',
  status: 'DRAFT',
  supplierId: 'sup-1',
  siteId: 'site-1',
  currencyCode: 'INR',
};

const receipt = (overrides: Partial<InvoiceableGoodsReceiptRow> = {}): InvoiceableGoodsReceiptRow => ({
  goodsReceiptId: 'gr-1',
  grNumber: 'GR-1',
  goodsReceiptStatus: 'POSTED',
  receivedDate: '2026-11-01 00:00:00+00',
  goodsReceiptItemId: 'gri-1',
  goodsReceiptLotId: 'lot-1',
  lotNumber: 'B1',
  expiryDate: '2028-01-01 00:00:00+00',
  mrp: 12000n,
  lotCount: 1,
  purchaseOrderId: 'po-1',
  poNumber: 'PO-1',
  poStatus: 'CONFIRMED',
  poSupplierId: 'sup-1',
  poSiteId: 'site-1',
  poCurrencyCode: 'INR',
  poExchangeRate: 1,
  purchaseOrderItemId: 'poi-1',
  poUomQty: 10,
  poPrimaryUomQty: 100,
  poUnitPrice: 5000n,
  inventoryItemId: 'item-1',
  inventoryItemName: 'Paracetamol 500',
  uomId: 'uom-strip',
  uomSymbol: 'strip',
  primaryUomSymbol: 'tab',
  acceptedPrimaryQty: 100,
  invoicedPrimaryQty: 0,
  ...overrides,
});

const itemLine = (overrides: Partial<SupplierInvoiceLineFieldsDto> = {}): SupplierInvoiceLineFieldsDto => ({
  lineType: 'ITEM',
  purchaseOrderItemId: 'poi-1',
  goodsReceiptItemId: 'gri-1',
  goodsReceiptLotId: 'lot-1',
  invoicedQty: 8,
  freeQty: 1,
  unitPrice: { currency: 'INR', value: '50.00' },
  ...overrides,
});

function setup(row: InvoiceableGoodsReceiptRow | undefined, category?: Record<string, unknown>) {
  const repository = new SupplierInvoiceLinesDomainRepository({} as PrimaryDatabaseService);
  jest.spyOn(repository, 'findCostCategory').mockImplementation(async () => category as never);
  const invoiceable = {
    findForLine: jest.fn().mockResolvedValue(row),
  } as unknown as InvoiceableGoodsReceiptsRepository;
  const service = new SupplierInvoiceLinesDomainService(
    repository,
    {} as SupplierInvoicesDomainRepository,
    invoiceable,
  );
  return { service, invoiceable };
}

describe('SupplierInvoiceLinesDomainService.prepare — item lines', () => {
  it('invoices a posted lot of its PO line in primary units by the line ratio', async () => {
    const { service, invoiceable } = setup(receipt());
    const { values } = await service.prepare(invoice, itemLine(), { excludeLineId: 'line-9' });
    expect(invoiceable.findForLine).toHaveBeenCalledWith('gri-1', 'lot-1', 'line-9');
    expect(values).toMatchObject({
      lineType: 'ITEM',
      purchaseOrderItemId: 'poi-1',
      goodsReceiptItemId: 'gri-1',
      goodsReceiptLotId: 'lot-1',
      invoicedPrimaryQty: 80,
      freePrimaryQty: 10,
      unitPrice: 5000n,
      lineTotal: 40000n,
      costCategoryId: null,
    });
  });

  it('caps invoiced + free at what the lot accepted less what live lines already invoice', async () => {
    const { service } = setup(receipt({ invoicedPrimaryQty: 20 }));
    await expect(service.prepare(invoice, itemLine())).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'More Than Received' }),
    });
    await expect(service.prepare(invoice, itemLine({ invoicedQty: 7, freeQty: 1 }))).resolves.toBeDefined();
  });

  it('invoices only posted receipts', async () => {
    const { service } = setup(receipt({ goodsReceiptStatus: 'DRAFT' }));
    await expect(service.prepare(invoice, itemLine())).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Receipt Not Posted' }),
    });
  });

  it('invoices only orders of the invoice supplier and site', async () => {
    for (const row of [receipt({ poSupplierId: 'sup-2' }), receipt({ poSiteId: 'site-2' })]) {
      const { service } = setup(row);
      await expect(service.prepare(invoice, itemLine())).rejects.toMatchObject({
        response: expect.objectContaining({ label: 'Different Supplier or Site' }),
      });
    }
  });

  it('invoices only orders in the invoice currency', async () => {
    const { service } = setup(receipt({ poCurrencyCode: 'USD' }));
    await expect(service.prepare(invoice, itemLine())).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Different Currency' }),
    });
  });

  it('rejects a receipt item of another PO line', async () => {
    const { service } = setup(receipt({ purchaseOrderItemId: 'poi-2' }));
    await expect(service.prepare(invoice, itemLine())).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Receipt Not On Order Line' }),
    });
  });

  it('requires the lot of an item received in lots, and refuses a lot that is not the item’s', async () => {
    const lotRequired = setup(receipt({ goodsReceiptLotId: null }));
    await expect(lotRequired.service.prepare(invoice, itemLine({ goodsReceiptLotId: null }))).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Lot Required' }),
    });
    const foreignLot = setup(receipt({ goodsReceiptLotId: null, lotNumber: null }));
    await expect(foreignLot.service.prepare(invoice, itemLine({ goodsReceiptLotId: 'lot-x' }))).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Lot Not On Receipt' }),
    });
  });

  it('invoices a receipt item without lots against the item itself', async () => {
    const { service } = setup(receipt({ lotCount: 0, goodsReceiptLotId: null, lotNumber: null }));
    const { values } = await service.prepare(invoice, itemLine({ goodsReceiptLotId: undefined }));
    expect(values.goodsReceiptLotId).toBeNull();
  });

  it('rejects amounts in another currency than the invoice', async () => {
    const { service } = setup(receipt());
    await expect(
      service.prepare(invoice, itemLine({ unitPrice: { currency: 'USD', value: '1.00' } })),
    ).rejects.toMatchObject({ response: expect.objectContaining({ label: 'Wrong currency' }) });
  });

  it('reports a missing receipt item', async () => {
    const { service } = setup(undefined);
    await expect(service.prepare(invoice, itemLine())).rejects.toBeInstanceOf(NotFoundException);
  });
});

const freight = { id: 'cat-freight', name: 'Freight', kind: 'FREIGHT', isActive: true };

const chargeLine = (overrides: Partial<SupplierInvoiceLineFieldsDto> = {}): SupplierInvoiceLineFieldsDto => ({
  lineType: 'CHARGE',
  costCategoryId: 'cat-freight',
  unitPrice: { currency: 'INR', value: '250.00' },
  ...overrides,
});

describe('SupplierInvoiceLinesDomainService.prepare — charge lines', () => {
  it('books an amount under a charge category with no PO or receipt reference', async () => {
    const { service, invoiceable } = setup(undefined, freight);
    const { label, values } = await service.prepare(invoice, {
      lineType: 'CHARGE',
      costCategoryId: 'cat-freight',
      unitPrice: { currency: 'INR', value: '250.00' },
      taxAmount: { currency: 'INR', value: '45.00' },
    });
    expect(invoiceable.findForLine).not.toHaveBeenCalled();
    expect(label).toBe('Freight');
    expect(values).toMatchObject({
      lineType: 'CHARGE',
      purchaseOrderItemId: null,
      goodsReceiptItemId: null,
      goodsReceiptLotId: null,
      inventoryItemId: null,
      invoicedQty: null,
      costCategoryId: 'cat-freight',
      lineTotal: 29500n,
    });
  });

  it('reports a missing cost category', async () => {
    const { service } = setup(undefined, undefined);
    await expect(service.prepare(invoice, chargeLine())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses the item cost category and an inactive one', async () => {
    const item = setup(undefined, { ...freight, name: 'Items', kind: 'ITEM' });
    await expect(item.service.prepare(invoice, chargeLine())).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Not a Charge Category',
        errors: [{ field: 'costCategoryId', message: 'Item cost category' }],
      }),
    });
    const inactive = setup(undefined, { ...freight, isActive: false });
    await expect(inactive.service.prepare(invoice, chargeLine())).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Not a Charge Category',
        errors: [{ field: 'costCategoryId', message: 'Inactive' }],
      }),
    });
  });

  it('refuses an amount in another currency than the invoice', async () => {
    const { service } = setup(undefined, freight);
    await expect(
      service.prepare(invoice, chargeLine({ taxAmount: { currency: 'USD', value: '1.00' } })),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Wrong currency',
        errors: [{ field: 'taxAmount', message: 'Must be in INR' }],
      }),
    });
  });

  it('refuses a discount larger than the charge', async () => {
    const { service } = setup(undefined, freight);
    await expect(
      service.prepare(invoice, chargeLine({ discountAmount: { currency: 'INR', value: '300.00' } })),
    ).rejects.toMatchObject({ response: expect.objectContaining({ label: 'Discount too large' }) });
  });
});

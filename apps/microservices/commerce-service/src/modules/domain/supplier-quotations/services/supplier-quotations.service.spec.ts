import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { CreatePurchaseQuotationDraftDto } from '../dto/request/create-purchase-quotation-draft.dto';
import type {
  PurchaseQuotationItemRow,
  SupplierQuotationsDomainRepository,
} from '../repositories/supplier-quotations.repository';
import { SupplierQuotationsDomainService } from './supplier-quotations.service';

const draft: CreatePurchaseQuotationDraftDto = {
  purchaseId: 'pur-1',
  purchaseNumber: 'PUR-0007',
  supplierId: 'sup-1',
  currencyCode: 'INR',
  validFrom: '2026-11-11',
  lines: [
    { purchaseItemId: 'pi-1', inventoryItemId: 'item-1', uomId: 'strip' },
    { purchaseItemId: 'pi-2', inventoryItemId: 'item-2', uomId: 'tablet' },
  ],
};

function itemRow(overrides: Partial<PurchaseQuotationItemRow> = {}): PurchaseQuotationItemRow {
  return {
    id: 'qi-1',
    quotationId: 'q-1',
    purchaseItemId: 'pi-1',
    inventoryItemId: 'item-1',
    inventoryItemName: 'Paracetamol 500',
    uomId: 'strip',
    uomSymbol: 'strip',
    unitPrice: 2500n,
    schemeBuyQty: null,
    schemeFreeQty: null,
    currencyCode: 'INR',
    ...overrides,
  };
}

function setup(takenNumbers: string[] = [], items: PurchaseQuotationItemRow[] = []) {
  const create = jest.fn().mockResolvedValue({ id: 'q-new' });
  const insertItems = jest.fn();
  const repository = {
    create,
    insertItems,
    transaction: jest.fn((run: () => Promise<unknown>) => run()),
    findNumbersStartingWith: jest.fn().mockResolvedValue(takenNumbers),
    findForPurchase: jest.fn().mockResolvedValue([
      {
        id: 'q-1',
        quotationNumber: 'PUR-0007',
        supplierId: 'sup-1',
        supplierName: 'Medline',
        isPosted: true,
        validFrom: '2026-11-11',
        validTo: null,
        currencyCode: 'INR',
      },
      {
        id: 'q-2',
        quotationNumber: 'PUR-0007',
        supplierId: 'sup-2',
        supplierName: 'Pharmax',
        isPosted: false,
        validFrom: '2026-11-11',
        validTo: null,
        currencyCode: 'INR',
      },
    ]),
    findItemsForPurchase: jest.fn().mockResolvedValue(items),
    findPostedItemsForPurchase: jest.fn().mockResolvedValue([]),
  } as unknown as SupplierQuotationsDomainRepository;
  return { service: new SupplierQuotationsDomainService(repository), create, insertItems, repository };
}

beforeAll(() => Logger.overrideLogger(false));

describe('SupplierQuotationsDomainService draft for a purchase', () => {
  it('records an LE-owned draft numbered after the purchase with one unpriced line per purchase item', async () => {
    const { service, create, insertItems } = setup();
    await expect(service.createDraftForPurchase(draft)).resolves.toEqual({ quotationId: 'q-new' });
    expect(create).toHaveBeenCalledWith({
      siteId: null,
      supplierId: 'sup-1',
      purchaseId: 'pur-1',
      quotationNumber: 'PUR-0007',
      quotationDate: '2026-11-11',
      currencyCode: 'INR',
      validFrom: '2026-11-11',
    });
    expect(insertItems).toHaveBeenCalledWith([
      { quotationId: 'q-new', purchaseItemId: 'pi-1', inventoryItemId: 'item-1', uomId: 'strip', unitPrice: 0n },
      { quotationId: 'q-new', purchaseItemId: 'pi-2', inventoryItemId: 'item-2', uomId: 'tablet', unitPrice: 0n },
    ]);
  });

  it('suffixes the number when the supplier already has a quotation by it', async () => {
    const { service, create } = setup(['PUR-0007', 'PUR-0007-2', 'PUR-00071']);
    await service.createDraftForPurchase(draft);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ quotationNumber: 'PUR-0007-3' }));
  });

  it('rejects a request without purchase items', async () => {
    const { service, create } = setup();
    await expect(service.createDraftForPurchase({ ...draft, lines: [] })).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'No Items' }),
    });
    expect(create).not.toHaveBeenCalled();
  });
});

describe('SupplierQuotationsDomainService quotations of a purchase', () => {
  it('groups lines under their quotation and counts the priced ones, each priced in its own unit', async () => {
    const { service } = setup(
      [],
      [
        itemRow(),
        itemRow({ id: 'qi-2', purchaseItemId: 'pi-2', unitPrice: 0n }),
        itemRow({ id: 'qi-3', quotationId: 'q-2', uomId: 'tablet', unitPrice: 333n }),
      ],
    );
    const [posted, draftQuotation] = await service.findForPurchase('pur-1', 'site-1');
    expect(posted).toMatchObject({ id: 'q-1', isPosted: true, itemCount: 2, pricedItemCount: 1 });
    expect(posted.items[0]).toEqual({
      id: 'qi-1',
      purchaseItemId: 'pi-1',
      inventoryItemId: 'item-1',
      inventoryItemName: 'Paracetamol 500',
      uomId: 'strip',
      uomSymbol: 'strip',
      unitPrice: { currency: 'INR', value: '25.00' },
      schemeBuyQty: null,
      schemeFreeQty: null,
    });
    expect(draftQuotation).toMatchObject({ id: 'q-2', isPosted: false, itemCount: 1, pricedItemCount: 1 });
    expect(draftQuotation.items[0]).toMatchObject({ uomId: 'tablet', unitPrice: { currency: 'INR', value: '3.33' } });
  });

  it('asks for the posted lines once each and skips the query for none', async () => {
    const { service, repository } = setup();
    await expect(service.findPostedItemsForPurchase('pur-1', 'site-1', [], '2026-11-11')).resolves.toEqual([]);
    expect(repository.findPostedItemsForPurchase).not.toHaveBeenCalled();
    await service.findPostedItemsForPurchase('pur-1', 'site-1', ['qi-1', 'qi-1', 'qi-2'], '2026-11-11');
    expect(repository.findPostedItemsForPurchase).toHaveBeenCalledWith(
      'pur-1',
      'site-1',
      ['qi-1', 'qi-2'],
      '2026-11-11',
    );
  });
});

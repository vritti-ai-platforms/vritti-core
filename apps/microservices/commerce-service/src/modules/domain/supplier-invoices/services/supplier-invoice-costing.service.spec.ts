import 'reflect-metadata';
import type {
  ChargeAllocation,
  ChargeLine,
  CostingSlice,
  ReceiptQuant,
  SupplierInvoiceCostingDomainRepository,
} from '../repositories/supplier-invoice-costing.repository';
import type { SupplierInvoiceLinesDomainRepository } from '../repositories/supplier-invoice-lines.repository';
import { type CostedInvoice, SupplierInvoiceCostingDomainService } from './supplier-invoice-costing.service';

const invoice: CostedInvoice = { id: 'inv-1', status: 'POSTED', invoiceNumber: 'INV-1' };

const slice: CostingSlice = {
  supplierInvoiceLineId: 'line-1',
  invoicedQty: 10,
  invoicedPrimaryQty: 100,
  freePrimaryQty: 0,
  unitPrice: 1200n,
  discountAmount: 0n,
  currencyCode: 'INR',
  exchangeRate: 1,
  orderedPrimaryQty: 100,
  orderedFreePrimaryQty: 0,
  orderedTotalPrice: 10000n,
  orderCurrencyCode: 'INR',
  orderExchangeRate: 1,
  invoicedReceiptPrimaryQty: 100,
  receivedPrimaryQty: 100,
  quantId: 'quant-1',
  quantQuantity: 50,
  quantInflowQty: 100,
};

const charge: ChargeLine = {
  id: 'charge-1',
  costCategoryId: 'cat-freight',
  unitPrice: 500n,
  discountAmount: 0n,
  currencyCode: 'INR',
  exchangeRate: 1,
};

const quants: ReceiptQuant[] = [
  { quantId: 'quant-1', receivedPrimaryQty: 100, unitCost: 100n, quantQuantity: 100, quantInflowQty: 100 },
  { quantId: 'quant-2', receivedPrimaryQty: 100, unitCost: 300n, quantQuantity: 0, quantInflowQty: 100 },
];

const chargeAllocation: ChargeAllocation = {
  quantId: 'quant-1',
  allocatedAmount: 125n,
  quantQuantity: 100,
  quantInflowQty: 100,
};

function setup() {
  const repository = {
    findCostingSlices: jest.fn().mockResolvedValue([slice]),
    findItemCategoryId: jest.fn().mockResolvedValue('cat-item'),
    findChargeLines: jest.fn().mockResolvedValue([charge]),
    findReceiptQuants: jest.fn().mockResolvedValue(quants),
    findAllocationsBySources: jest.fn().mockResolvedValue([chargeAllocation]),
  };
  const linesRepository = { update: jest.fn(), clearVariance: jest.fn() };
  const service = new SupplierInvoiceCostingDomainService(
    repository as unknown as SupplierInvoiceCostingDomainRepository,
    linesRepository as unknown as SupplierInvoiceLinesDomainRepository,
  );
  return { service, linesRepository };
}

describe('SupplierInvoiceCostingDomainService.planItemCosting', () => {
  it('revalues the invoiced quant by the final cost change, books it and records the consumed share as variance', async () => {
    const plan = await setup().service.planItemCosting(invoice, 'INR', 'apply');
    expect(plan.removedCostSourceIds).toEqual([]);
    expect(plan.revaluations).toEqual([{ quantId: 'quant-1', costDelta: 2000n, onHandDelta: 1000n }]);
    expect(plan.lineVariances).toEqual([{ lineId: 'line-1', varianceAmount: 1000n }]);
    expect(plan.bookings).toEqual([
      {
        cost: expect.objectContaining({
          categoryId: 'cat-item',
          totalAmount: 2000n,
          sourceType: 'SUPPLIER_INVOICE',
          sourceId: 'inv-1',
          vendorRef: 'INV-1',
        }),
        allocations: [{ quantId: 'quant-1', allocatedAmount: 2000n }],
      },
    ]);
  });

  it('takes the revaluation back and removes the invoice cost on reversal', async () => {
    const plan = await setup().service.planItemCosting(invoice, 'INR', 'reverse');
    expect(plan.removedCostSourceIds).toEqual(['inv-1']);
    expect(plan.revaluations).toEqual([{ quantId: 'quant-1', costDelta: -2000n, onHandDelta: -1000n }]);
    expect(plan.bookings).toEqual([]);
    expect(plan.lineVariances).toEqual([]);
  });
});

describe('SupplierInvoiceCostingDomainService.planChargeCosting', () => {
  it('lands a charge on the receipt quants by value, the consumed share being its variance', async () => {
    const plan = await setup().service.planChargeCosting(invoice, 'INR', 'apply');
    expect(plan.revaluations).toEqual([
      { quantId: 'quant-1', costDelta: 125n, onHandDelta: 125n },
      { quantId: 'quant-2', costDelta: 375n, onHandDelta: 0n },
    ]);
    expect(plan.bookings).toEqual([
      {
        cost: expect.objectContaining({ categoryId: 'cat-freight', totalAmount: 500n, sourceId: 'charge-1' }),
        allocations: [
          { quantId: 'quant-1', allocatedAmount: 125n },
          { quantId: 'quant-2', allocatedAmount: 375n },
        ],
      },
    ]);
    expect(plan.lineVariances).toEqual([{ lineId: 'charge-1', varianceAmount: 375n }]);
  });

  it('takes back exactly what each charge allocated and removes its costs on reversal', async () => {
    const plan = await setup().service.planChargeCosting(invoice, 'INR', 'reverse');
    expect(plan.removedCostSourceIds).toEqual(['charge-1']);
    expect(plan.revaluations).toEqual([{ quantId: 'quant-1', costDelta: -125n, onHandDelta: -125n }]);
  });
});

describe('SupplierInvoiceCostingDomainService variances', () => {
  it('records and clears line variances on the invoice lines', async () => {
    const { service, linesRepository } = setup();
    await service.recordVariances([{ lineId: 'line-1', varianceAmount: 10n }]);
    await service.clearVariances('inv-1');
    expect(linesRepository.update).toHaveBeenCalledWith('line-1', { varianceAmount: 10n });
    expect(linesRepository.clearVariance).toHaveBeenCalledWith('inv-1');
  });
});

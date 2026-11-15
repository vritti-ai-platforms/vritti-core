import 'reflect-metadata';
import type { InventoryItemQuantsDomainService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import type {
  CostingPlan,
  SupplierInvoiceCostingDomainService,
} from '@domain/supplier-invoices/services/supplier-invoice-costing.service';
import { SupplierInvoiceRecostingService } from './supplier-invoice-recosting.service';

const itemPlan: CostingPlan = {
  removedCostSourceIds: ['inv-1'],
  revaluations: [{ quantId: 'quant-1', costDelta: 20n, onHandDelta: 10n }],
  bookings: [],
  lineVariances: [{ lineId: 'line-1', varianceAmount: 10n }],
};
const emptyPlan: CostingPlan = { removedCostSourceIds: [], revaluations: [], bookings: [], lineVariances: [] };

function setup() {
  const calls: string[] = [];
  const record = (name: string) => jest.fn(async () => void calls.push(name));
  const costing = {
    planItemCosting: jest.fn().mockResolvedValue(itemPlan),
    planChargeCosting: jest.fn().mockResolvedValue(emptyPlan),
    recordVariances: record('recordVariances'),
    clearVariances: record('clearVariances'),
  };
  const quants = {
    removeCostsBySources: record('removeCostsBySources'),
    revalueQuant: record('revalueQuant'),
    bookCost: record('bookCost'),
  };
  const service = new SupplierInvoiceRecostingService(
    costing as unknown as SupplierInvoiceCostingDomainService,
    quants as unknown as InventoryItemQuantsDomainService,
  );
  return { service, costing, quants, calls };
}

describe('SupplierInvoiceRecostingService', () => {
  it('has the inventory domain write the plan and the invoice record its variances', async () => {
    const { service, quants, costing } = setup();
    await service.revalue({ id: 'inv-1', status: 'POSTED', invoiceNumber: 'INV-1' }, 'INR', 'apply');
    expect(quants.removeCostsBySources).toHaveBeenCalledWith('SUPPLIER_INVOICE', ['inv-1']);
    expect(quants.revalueQuant).toHaveBeenCalledWith('quant-1', 20n, 10n);
    expect(costing.recordVariances).toHaveBeenCalledWith(itemPlan.lineVariances);
    expect(costing.planChargeCosting).toHaveBeenCalledWith(expect.anything(), 'INR', 'apply');
  });

  it('reverses a posted invoice before the change and applies it again after', async () => {
    const { service, costing, calls } = setup();
    const change = jest.fn(async () => {
      calls.push('change');
      return 'done';
    });
    await expect(
      service.withPostedCosting({ id: 'inv-1', status: 'POSTED', invoiceNumber: 'INV-1' }, 'INR', change),
    ).resolves.toBe('done');
    expect(calls[0]).toBe('clearVariances');
    expect(calls.indexOf('change')).toBeGreaterThan(0);
    expect(costing.planItemCosting.mock.calls.map((call) => call[2])).toEqual(['reverse', 'apply']);
  });

  it('runs the change alone on a draft', async () => {
    const { service, costing } = setup();
    await service.withPostedCosting({ id: 'inv-1', status: 'DRAFT', invoiceNumber: 'INV-1' }, 'INR', async () => 1);
    expect(costing.planItemCosting).not.toHaveBeenCalled();
  });
});

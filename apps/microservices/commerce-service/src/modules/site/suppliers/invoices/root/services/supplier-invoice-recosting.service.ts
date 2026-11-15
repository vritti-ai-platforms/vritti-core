import { InventoryItemQuantsDomainService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import {
  type CostedInvoice,
  type CostingDirection,
  type CostingPlan,
  SupplierInvoiceCostingDomainService,
} from '@domain/supplier-invoices/services/supplier-invoice-costing.service';
import { Injectable } from '@nestjs/common';
import { CostSourceTypeValues, SupplierInvoiceStatusValues } from '@/db/schema';

@Injectable()
export class SupplierInvoiceRecostingService {
  constructor(
    private readonly costingService: SupplierInvoiceCostingDomainService,
    private readonly quantsService: InventoryItemQuantsDomainService,
  ) {}

  // Applies or reverses an invoice's final costing and then its landed charges, in the caller's transaction
  async revalue(invoice: CostedInvoice, leCurrencyCode: string, direction: CostingDirection): Promise<void> {
    if (direction === 'reverse') await this.costingService.clearVariances(invoice.id);
    await this.apply(await this.costingService.planItemCosting(invoice, leCurrencyCode, direction));
    await this.apply(await this.costingService.planChargeCosting(invoice, leCurrencyCode, direction));
  }

  // Runs a change to an invoice inside the caller's transaction; a posted invoice's costing is reversed before the change
  // and re-applied after it, so its stock carries the edited final cost
  async withPostedCosting<T>(invoice: CostedInvoice, leCurrencyCode: string, change: () => Promise<T>): Promise<T> {
    if (invoice.status !== SupplierInvoiceStatusValues.POSTED) return change();
    await this.revalue(invoice, leCurrencyCode, 'reverse');
    const result = await change();
    await this.revalue(invoice, leCurrencyCode, 'apply');
    return result;
  }

  // Writes a costing plan: the inventory domain removes and books the costs and revalues the quants, the invoice records
  // its lines' variances
  private async apply(plan: CostingPlan): Promise<void> {
    await this.quantsService.removeCostsBySources(CostSourceTypeValues.SUPPLIER_INVOICE, plan.removedCostSourceIds);
    for (const revaluation of plan.revaluations) {
      await this.quantsService.revalueQuant(revaluation.quantId, revaluation.costDelta, revaluation.onHandDelta);
    }
    for (const booking of plan.bookings) {
      await this.quantsService.bookCost(booking.cost, booking.allocations);
    }
    await this.costingService.recordVariances(plan.lineVariances);
  }
}

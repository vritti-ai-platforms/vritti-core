import { Injectable } from '@nestjs/common';
import Decimal from '@vritti/api-sdk/decimal';
import _ from '@vritti/api-sdk/lodash';
import { allocateByWeight, convertMinor } from '@vritti/api-sdk/money';
import {
  CostDistributionMethodValues,
  CostSourceTypeValues,
  type NewInventoryItemCost,
  type SupplierInvoice,
} from '@/db/schema';
import {
  type ChargeLine,
  type CostingSlice,
  type ReceiptQuant,
  SupplierInvoiceCostingDomainRepository,
} from '../repositories/supplier-invoice-costing.repository';
import { SupplierInvoiceLinesDomainRepository } from '../repositories/supplier-invoice-lines.repository';

export type CostingDirection = 'apply' | 'reverse';

export type CostedInvoice = Pick<SupplierInvoice, 'id' | 'status' | 'invoiceNumber'>;

export type QuantCostAllocation = {
  quantId: string;
  allocatedAmount: bigint;
};

export type QuantRevaluation = {
  quantId: string;
  costDelta: bigint;
  onHandDelta: bigint;
};

export type CostBooking = {
  cost: NewInventoryItemCost;
  allocations: QuantCostAllocation[];
};

export type LineVariance = {
  lineId: string;
  varianceAmount: bigint;
};

export type CostingPlan = {
  removedCostSourceIds: string[];
  revaluations: QuantRevaluation[];
  bookings: CostBooking[];
  lineVariances: LineVariance[];
};

@Injectable()
export class SupplierInvoiceCostingDomainService {
  constructor(
    private readonly repository: SupplierInvoiceCostingDomainRepository,
    private readonly linesRepository: SupplierInvoiceLinesDomainRepository,
  ) {}

  // Records each line's variance once its costing is applied, in the caller's transaction
  async recordVariances(lineVariances: LineVariance[]): Promise<void> {
    for (const { lineId, varianceAmount } of lineVariances) {
      await this.linesRepository.update(lineId, { varianceAmount });
    }
  }

  // Clears the variance of every line of an invoice once its costing is reversed, in the caller's transaction
  async clearVariances(supplierInvoiceId: string): Promise<void> {
    await this.linesRepository.clearVariance(supplierInvoiceId);
  }

  // Plans moving the stock each item line invoices from its provisional receipt cost to the line's final cost; the consumed
  // share's difference is the line's variance
  async planItemCosting(
    invoice: CostedInvoice,
    leCurrencyCode: string,
    direction: CostingDirection,
  ): Promise<CostingPlan> {
    const slices = await this.repository.findCostingSlices(invoice.id);
    const sign = direction === 'apply' ? 1 : -1;
    const plan = this.emptyPlan();
    if (direction === 'reverse') plan.removedCostSourceIds.push(invoice.id);

    const allocations: QuantCostAllocation[] = [];
    for (const [lineId, lineSlices] of Object.entries(_.groupBy(slices, 'supplierInvoiceLineId'))) {
      const [line] = lineSlices;
      const costChangePerUnit = this.costChangePerUnit(line, leCurrencyCode).times(sign);
      if (costChangePerUnit.isZero()) continue;

      let lineVariance = 0n;
      for (const [quantId, quantSlices] of Object.entries(_.groupBy(lineSlices, 'quantId'))) {
        const revaluation = this.revalueInvoicedShare(quantId, quantSlices, costChangePerUnit);
        plan.revaluations.push(revaluation);
        lineVariance += revaluation.costDelta - revaluation.onHandDelta;
        if (revaluation.costDelta !== 0n) allocations.push({ quantId, allocatedAmount: revaluation.costDelta });
      }
      if (direction === 'apply') plan.lineVariances.push({ lineId, varianceAmount: lineVariance });
    }

    if (direction === 'reverse' || allocations.length === 0) return plan;
    const booking = await this.priceVarianceBooking(invoice, leCurrencyCode, allocations);
    if (booking) plan.bookings.push(booking);
    return plan;
  }

  // Plans landing each charge line on the quants of the invoice's receipt lots, pro rata by their value, as a cost of the
  // line's category; the consumed share is the line's variance. Reversing takes back exactly what was allocated
  async planChargeCosting(
    invoice: CostedInvoice,
    leCurrencyCode: string,
    direction: CostingDirection,
  ): Promise<CostingPlan> {
    const charges = await this.repository.findChargeLines(invoice.id);
    if (charges.length === 0) return this.emptyPlan();
    if (direction === 'reverse') return this.planChargeReversal(charges.map((charge) => charge.id));

    const plan = this.emptyPlan();
    const quants = await this.repository.findReceiptQuants(invoice.id);
    const weights = quants.map((quant) =>
      new Decimal(quant.receivedPrimaryQty).times(quant.unitCost.toString()).toNumber(),
    );
    for (const charge of charges) {
      const amount = convertMinor(
        charge.unitPrice - charge.discountAmount,
        charge.currencyCode,
        leCurrencyCode,
        charge.exchangeRate,
      );
      if (amount <= 0n || quants.length === 0) continue;
      this.planChargeLanding(plan, invoice, leCurrencyCode, charge, amount, quants, allocateByWeight(amount, weights));
    }
    return plan;
  }

  // Returns how much a line's final cost per primary unit differs from the provisional cost its receipt valued it at
  private costChangePerUnit(line: CostingSlice, leCurrencyCode: string): Decimal {
    return this.finalUnitCost(line, leCurrencyCode).minus(this.provisionalUnitCost(line, leCurrencyCode));
  }

  // Returns the provisional cost goods receipt posting valued the stock at, per primary unit in the legal entity's currency
  private provisionalUnitCost(line: CostingSlice, leCurrencyCode: string): Decimal {
    const orderedTotalInLeCurrency = convertMinor(
      line.orderedTotalPrice,
      line.orderCurrencyCode,
      leCurrencyCode,
      line.orderExchangeRate,
    );
    return new Decimal(orderedTotalInLeCurrency.toString())
      .div(new Decimal(line.orderedPrimaryQty).plus(line.orderedFreePrimaryQty))
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  }

  // Returns the final cost per primary unit: what the line invoices net of discount and before tax, over invoiced + free
  private finalUnitCost(line: CostingSlice, leCurrencyCode: string): Decimal {
    const invoicedGrossAmount = new Decimal(line.unitPrice.toString())
      .times(line.invoicedQty)
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    const invoicedNetAmount = BigInt(invoicedGrossAmount.toFixed(0)) - line.discountAmount;
    const invoicedNetInLeCurrency = convertMinor(
      invoicedNetAmount,
      line.currencyCode,
      leCurrencyCode,
      line.exchangeRate,
    );
    return new Decimal(invoicedNetInLeCurrency.toString())
      .div(this.invoicedPrimaryWithFree(line))
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  }

  // Returns the primary units a line invoices, free goods included
  private invoicedPrimaryWithFree(line: CostingSlice): Decimal {
    return new Decimal(line.invoicedPrimaryQty).plus(line.freePrimaryQty);
  }

  // Revalues one quant by the line's cost change on the share of it the line invoices, spread over the receipt lines the lot
  // was put away on
  private revalueInvoicedShare(
    quantId: string,
    quantSlices: CostingSlice[],
    costChangePerUnit: Decimal,
  ): QuantRevaluation {
    const [{ quantQuantity, quantInflowQty }] = quantSlices;
    const invoicedPrimaryInQuant = quantSlices.reduce(
      (total, slice) =>
        total.plus(
          new Decimal(slice.receivedPrimaryQty)
            .times(this.invoicedPrimaryWithFree(slice))
            .div(slice.invoicedReceiptPrimaryQty),
        ),
      new Decimal(0),
    );
    const costDelta = BigInt(
      costChangePerUnit.times(invoicedPrimaryInQuant).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0),
    );
    return { quantId, costDelta, onHandDelta: this.onHandPart(costDelta, quantQuantity, quantInflowQty) };
  }

  // Books the price variance an invoice's item lines laid on its quants under the item cost category, summed per quant
  private async priceVarianceBooking(
    invoice: CostedInvoice,
    leCurrencyCode: string,
    allocations: QuantCostAllocation[],
  ): Promise<CostBooking | null> {
    const categoryId = await this.repository.findItemCategoryId();
    if (!categoryId) return null;

    const allocatedByQuant = Object.entries(_.groupBy(allocations, 'quantId')).map(([quantId, quantAllocations]) => ({
      quantId,
      allocatedAmount: quantAllocations.reduce((total, allocation) => total + allocation.allocatedAmount, 0n),
    }));
    return {
      cost: {
        categoryId,
        totalAmount: allocatedByQuant.reduce((total, allocation) => total + allocation.allocatedAmount, 0n),
        currencyCode: leCurrencyCode,
        sourceType: CostSourceTypeValues.SUPPLIER_INVOICE,
        sourceId: invoice.id,
        distributionMethod: CostDistributionMethodValues.BY_QUANTITY,
        unallocatedAmount: 0n,
        vendorRef: invoice.invoiceNumber,
        notes: 'Supplier invoice price variance',
      },
      allocations: allocatedByQuant,
    };
  }

  // Adds one charge's landing to the plan: a revaluation per quant it reaches, its cost booking and its variance
  private planChargeLanding(
    plan: CostingPlan,
    invoice: CostedInvoice,
    leCurrencyCode: string,
    charge: ChargeLine,
    amount: bigint,
    quants: ReceiptQuant[],
    slices: bigint[],
  ): void {
    let variance = 0n;
    const allocations: QuantCostAllocation[] = [];
    for (const [index, quant] of quants.entries()) {
      const slice = slices[index];
      if (slice === 0n) continue;
      const onHandDelta = this.onHandPart(slice, quant.quantQuantity, quant.quantInflowQty);
      plan.revaluations.push({ quantId: quant.quantId, costDelta: slice, onHandDelta });
      variance += slice - onHandDelta;
      allocations.push({ quantId: quant.quantId, allocatedAmount: slice });
    }
    plan.bookings.push({
      cost: {
        categoryId: charge.costCategoryId,
        totalAmount: amount,
        currencyCode: leCurrencyCode,
        sourceType: CostSourceTypeValues.SUPPLIER_INVOICE,
        sourceId: charge.id,
        distributionMethod: CostDistributionMethodValues.BY_VALUE,
        unallocatedAmount: 0n,
        vendorRef: invoice.invoiceNumber,
        notes: 'Supplier invoice charge',
      },
      allocations,
    });
    plan.lineVariances.push({ lineId: charge.id, varianceAmount: variance });
  }

  // Plans taking back exactly what the charge lines allocated to each quant and removing their costs
  private async planChargeReversal(chargeIds: string[]): Promise<CostingPlan> {
    const plan = this.emptyPlan();
    plan.removedCostSourceIds.push(...chargeIds);
    for (const allocation of await this.repository.findAllocationsBySources(chargeIds)) {
      const onHandDelta = this.onHandPart(
        allocation.allocatedAmount,
        allocation.quantQuantity,
        allocation.quantInflowQty,
      );
      plan.revaluations.push({
        quantId: allocation.quantId,
        costDelta: -allocation.allocatedAmount,
        onHandDelta: -onHandDelta,
      });
    }
    return plan;
  }

  // Returns the part of an amount that falls on what is still on hand of a quant's inflow
  private onHandPart(amount: bigint, quantQuantity: number, quantInflowQty: number): bigint {
    const onHandShare = Decimal.min(1, new Decimal(quantQuantity).div(quantInflowQty));
    return BigInt(
      new Decimal(amount.toString()).times(onHandShare).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0),
    );
  }

  // Returns a plan that changes nothing
  private emptyPlan(): CostingPlan {
    return { removedCostSourceIds: [], revaluations: [], bookings: [], lineVariances: [] };
  }
}

import { CostCategoriesRepository } from '@domain/cost-categories/repositories/cost-categories.repository';
import { GoodsReceiptItemsRepository } from '@domain/goods-receipts/repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { InventoryItemQuantsRepository } from '@domain/inventory-item-quants/repositories/inventory-item-quants.repository';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, PrimaryDatabaseService } from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import {
  CostCategoryKindValues,
  type CostSourceType,
  CostSourceTypeValues,
  type InventoryItemCost,
  type InventoryItemQuant,
} from '@/db/schema';
import { InventoryItemCostsRepository } from '../repositories/inventory-item-costs.repository';
import { InventoryItemQuantCostsRepository } from '../repositories/inventory-item-quant-costs.repository';

export type DistributionMethod = 'by_value' | 'by_quantity' | 'equal';

interface AssociateCostInput {
  sourceType: CostSourceType;
  sourceId: string;
  categoryId: string;
  totalAmount: bigint;
  currencyCode: string;
  distributionMethod: DistributionMethod;
  vendorRef?: string | null;
  notes?: string | null;
  targetQuantIds?: string[];
  createdBy?: string | null;
}

@Injectable()
export class CostAssociationService {
  private readonly logger = new Logger(CostAssociationService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly costsRepository: InventoryItemCostsRepository,
    private readonly junctionRepository: InventoryItemQuantCostsRepository,
    private readonly quantsRepository: InventoryItemQuantsRepository,
    private readonly costCategoriesRepository: CostCategoriesRepository,
    private readonly grRepository: GoodsReceiptsRepository,
    private readonly grItemsRepository: GoodsReceiptItemsRepository,
  ) {}

  // Auto-associate the supplier price at publish (works for PO-linked AND un-linked GRs).
  // Reads `gr_item.primary_uom_unit_price × accepted_primary_uom_qty × gr.exchange_rate`; the
  // exchange rate converts the supplier-currency snapshot on the GR-item into a BU-currency total —
  // GR-items stay in supplier currency, cost rows + quants live in BU currency.
  async autoAssociateSupplierPrice(
    grId: string,
    createdBy: string | null,
    buCurrencyCode: string,
    exchangeRate: number,
  ): Promise<{ created: number; skipped: number; reason?: string }> {
    const itemCategory = await this.costCategoriesRepository.findByKind(CostCategoryKindValues.ITEM);
    if (!itemCategory) {
      this.logger.warn(`autoAssociateSupplierPrice — no ITEM-kind cost category for org; skipping for gr ${grId}`);
      return { created: 0, skipped: 0, reason: 'No ITEM-kind cost category configured' };
    }
    if (!itemCategory.isActive) {
      return { created: 0, skipped: 0, reason: `ITEM category "${itemCategory.name}" is inactive` };
    }

    const grItems = await this.grItemsRepository.findGrItemsForAutoCost(grId);
    if (grItems.length === 0) {
      return { created: 0, skipped: 0, reason: 'No GR items with a captured unit price' };
    }

    let created = 0;
    let skipped = 0;
    for (const it of grItems) {
      const quants = await this.quantsRepository.findByGrItemId(it.grItemId);
      if (quants.length === 0) {
        skipped++;
        continue;
      }
      const acceptedPrimaryUomQty = quants.reduce((s, q) => s + Number(q.quantity), 0);
      if (acceptedPrimaryUomQty <= 0) {
        skipped++;
        continue;
      }
      // Convert supplier-currency price to BU currency in one Decimal op so we round once at the end.
      const totalAmount = BigInt(
        new Decimal(it.primaryUomUnitPrice.toString())
          .times(acceptedPrimaryUomQty)
          .times(exchangeRate)
          .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
          .toFixed(0),
      );
      if (totalAmount <= 0n) {
        skipped++;
        continue;
      }

      await this.associateCostInternal({
        sourceType: CostSourceTypeValues.GOODS_RECEIPT,
        sourceId: grId,
        categoryId: itemCategory.id,
        totalAmount,
        currencyCode: buCurrencyCode,
        distributionMethod: 'by_quantity',
        vendorRef: it.vendorRef,
        notes: `Supplier price — Item: ${it.inventoryItemCode} (${it.uomSymbol})`,
        targetQuantIds: quants.map((q) => q.id),
        createdBy,
      });
      created++;
    }

    if (created > 0) {
      await this.grRepository.setCostAssociatedAt(grId, new Date());
    }

    this.logger.log(`autoAssociateSupplierPrice — gr ${grId}: created ${created}, skipped ${skipped}`);
    return { created, skipped };
  }

  // Auto-associate the operator-entered opening-stock unit cost at SA publish. The unit cost is in
  // BU currency, per primary UOM; totalAmount = unitCost × SUM(quant.quantity) across the SA's quants.
  async autoAssociateOpeningCost(
    adjustmentId: string,
    unitCostMinor: bigint,
    buCurrencyCode: string,
    createdBy: string | null,
  ): Promise<{ created: number; skipped: number; reason?: string }> {
    if (unitCostMinor <= 0n) return { created: 0, skipped: 0, reason: 'No unit cost' };

    const itemCategory = await this.costCategoriesRepository.findByKind(CostCategoryKindValues.ITEM);
    if (!itemCategory) {
      this.logger.warn(`autoAssociateOpeningCost — no ITEM-kind cost category for org; skipping for sa ${adjustmentId}`);
      return { created: 0, skipped: 0, reason: 'No ITEM-kind cost category configured' };
    }
    if (!itemCategory.isActive) {
      return { created: 0, skipped: 0, reason: `ITEM category "${itemCategory.name}" is inactive` };
    }

    const quants = await this.quantsRepository.findBySource(CostSourceTypeValues.STOCK_ADJUSTMENT, adjustmentId);
    if (quants.length === 0) return { created: 0, skipped: 0, reason: 'No quants for this adjustment' };

    const totalQty = quants.reduce((s, q) => s + Number(q.quantity), 0);
    const totalAmount = BigInt(
      new Decimal(unitCostMinor.toString()).times(totalQty).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0),
    );
    if (totalAmount <= 0n) return { created: 0, skipped: 0, reason: 'Zero total amount' };

    await this.associateCostInternal({
      sourceType: CostSourceTypeValues.STOCK_ADJUSTMENT,
      sourceId: adjustmentId,
      categoryId: itemCategory.id,
      totalAmount,
      currencyCode: buCurrencyCode,
      distributionMethod: 'by_quantity',
      notes: 'Opening stock unit cost',
      targetQuantIds: quants.map((q) => q.id),
      createdBy,
    });

    this.logger.log(`autoAssociateOpeningCost — sa ${adjustmentId}: associated ${totalAmount} across ${quants.length} quant(s)`);
    return { created: 1, skipped: 0 };
  }

  // Creates a cost row and allocates it across the target quants, then recomputes their unit cost.
  private async associateCostInternal(input: AssociateCostInput): Promise<InventoryItemCost> {
    let quants: InventoryItemQuant[];
    if (input.targetQuantIds && input.targetQuantIds.length > 0) {
      quants = await this.quantsRepository.findByIds(input.targetQuantIds);
      const stray = quants.find((q) => q.sourceType !== input.sourceType || q.sourceId !== input.sourceId);
      if (stray) {
        throw new BadRequestException(`Quant ${stray.id} does not belong to ${input.sourceType}=${input.sourceId}.`);
      }
    } else {
      quants = await this.quantsRepository.findBySource(input.sourceType, input.sourceId);
    }

    if (quants.length === 0) {
      throw new BadRequestException('No target quants found for this cost source.');
    }

    let cost!: InventoryItemCost;
    await this.database.runInTransaction(async () => {
      cost = await this.costsRepository.createCost({
        categoryId: input.categoryId,
        totalAmount: input.totalAmount,
        currencyCode: input.currencyCode,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        distributionMethod: input.distributionMethod,
        vendorRef: input.vendorRef ?? null,
        notes: input.notes ?? null,
        createdBy: input.createdBy ?? null,
      });

      const allocations = this.computeAllocations(quants, input.totalAmount, input.distributionMethod);
      await this.junctionRepository.createMany(
        allocations.map((a) => ({ quantId: a.quantId, costId: cost.id, allocatedAmount: a.allocatedAmount })),
      );
      await this.recomputeQuantUnitCost(quants.map((q) => q.id));
    });

    return cost;
  }

  // Decimal-precise allocation math; last quant absorbs rounding remainder so
  // Σ(allocatedAmount) === totalAmount exactly.
  private computeAllocations(
    quants: InventoryItemQuant[],
    totalAmount: bigint,
    method: DistributionMethod,
  ): { quantId: string; allocatedAmount: bigint }[] {
    if (quants.length === 0) return [];
    const total = new Decimal(totalAmount.toString());

    const shares: Decimal[] = (() => {
      switch (method) {
        case 'by_quantity': {
          const sumQty = quants.reduce((s, q) => s.plus(q.quantity), new Decimal(0));
          if (sumQty.isZero()) return quants.map(() => new Decimal(1).dividedBy(quants.length));
          return quants.map((q) => new Decimal(q.quantity).dividedBy(sumQty));
        }
        case 'by_value': {
          const totalValue = quants.reduce(
            (s, q) => s.plus(new Decimal(q.unitCost.toString()).times(q.quantity)),
            new Decimal(0),
          );
          if (totalValue.isZero()) {
            const sumQty = quants.reduce((s, q) => s.plus(q.quantity), new Decimal(0));
            if (sumQty.isZero()) return quants.map(() => new Decimal(1).dividedBy(quants.length));
            return quants.map((q) => new Decimal(q.quantity).dividedBy(sumQty));
          }
          return quants.map((q) => new Decimal(q.unitCost.toString()).times(q.quantity).dividedBy(totalValue));
        }
        case 'equal':
          return quants.map(() => new Decimal(1).dividedBy(quants.length));
      }
    })();

    const allocated = quants.map((q, i) => ({
      quantId: q.id,
      allocatedAmount: BigInt(total.times(shares[i]).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0)),
    }));

    const computedSum = allocated.reduce((s, a) => s + a.allocatedAmount, 0n);
    const remainder = totalAmount - computedSum;
    if (remainder !== 0n && allocated.length > 0) {
      allocated[allocated.length - 1].allocatedAmount += remainder;
    }
    return allocated;
  }

  // Updates each affected quant's denormalized unit_cost from the live junction rows.
  private async recomputeQuantUnitCost(quantIds: string[]): Promise<void> {
    if (quantIds.length === 0) return;
    const [sums, quants] = await Promise.all([
      this.junctionRepository.sumAllocatedByQuantIds(quantIds),
      this.quantsRepository.findByIds(quantIds),
    ]);
    for (const q of quants) {
      const sum = sums.get(q.id) ?? 0n;
      const qty = new Decimal(q.quantity);
      const unitCost = qty.isZero()
        ? 0n
        : BigInt(new Decimal(sum.toString()).dividedBy(qty).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0));
      await this.quantsRepository.updateUnitCost(q.id, unitCost);
    }
  }
}

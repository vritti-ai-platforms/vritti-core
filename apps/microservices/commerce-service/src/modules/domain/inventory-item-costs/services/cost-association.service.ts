import { CostCategoriesRepository } from '@domain/cost-categories/repositories/cost-categories.repository';
import { GoodsReceiptsRepository } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { GoodsReceiptItemsRepository } from '@domain/goods-receipts/repositories/goods-receipt-items.repository';
import { InventoryItemQuantsRepository } from '@domain/inventory-item-quants/repositories/inventory-item-quants.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  CurrencyAmountDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  PrimaryDatabaseService,
  type TableViewState,
} from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import { and, eq } from '@vritti/api-sdk/drizzle-orm';
import {
  CostCategoryKindValues,
  type CostSourceType,
  CostSourceTypeValues,
  costCategories,
  type InventoryItemCost,
  type InventoryItemQuant,
  inventoryItemCosts,
} from '@/db/schema';
import {
  CostAllocationDto,
  type CostKindBreakdownEntryDto,
  CostsForSourceDto,
  InventoryItemCostDto,
} from '../dto/entity/inventory-item-cost.dto';
import { InventoryItemCostsRepository } from '../repositories/inventory-item-costs.repository';
import { InventoryItemQuantCostsRepository } from '../repositories/inventory-item-quant-costs.repository';

export type DistributionMethod = 'by_value' | 'by_quantity' | 'equal';

export interface AssociateCostInput {
  sourceType: CostSourceType;
  sourceId: string;
  categoryId: string;
  totalAmount: bigint;
  currencyCode: string;
  distributionMethod: DistributionMethod;
  vendorRef?: string | null;
  notes?: string | null;
  // When omitted, all quants with matching (source_type, source_id) are targeted.
  targetQuantIds?: string[];
  createdBy?: string | null;
}

export interface UpdateCostInput {
  totalAmount?: bigint;
  distributionMethod?: DistributionMethod;
  vendorRef?: string | null;
  notes?: string | null;
}

const KIND_ENUM = ['ITEM', 'FREIGHT', 'DUTY', 'INSURANCE', 'SERVICE', 'OTHER'] as const;

@Injectable()
export class CostAssociationService {
  private readonly logger = new Logger(CostAssociationService.name);

  private static readonly COSTS_FIELD_MAP: FieldMap = {
    categoryId: { column: inventoryItemCosts.categoryId, type: 'string' },
    vendorRef: { column: inventoryItemCosts.vendorRef, type: 'string' },
    createdAt: { column: inventoryItemCosts.createdAt, type: 'string' },
    categoryKind: { column: costCategories.kind, type: 'string' },
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly costsRepository: InventoryItemCostsRepository,
    private readonly junctionRepository: InventoryItemQuantCostsRepository,
    private readonly quantsRepository: InventoryItemQuantsRepository,
    private readonly costCategoriesRepository: CostCategoriesRepository,
    private readonly grRepository: GoodsReceiptsRepository,
    private readonly grItemsRepository: GoodsReceiptItemsRepository,
  ) {}

  // -------------------------------------------------------------------------
  // Lock predicate — PR5 stub. Future PRs flip this once downstream consumers
  // (POS sale, stock transfer, period close) reference the cost row.
  // -------------------------------------------------------------------------
  private async isLocked(_cost: InventoryItemCost): Promise<boolean> {
    return false;
  }

  // -------------------------------------------------------------------------
  // 1. Auto-associate at publish (works for PO-linked AND un-linked GRs)
  //
  // PR5b shifted the supplier-price source from `po_items` onto `goods_receipt_items`. The user
  // captures (or accepts the pre-fill of) the unit price at the breakdown step; we read
  // `gr_item.primary_uom_unit_price × accepted_primary_uom_qty × gr.exchange_rate` here. The
  // multiplication by `gr.exchange_rate` converts the supplier-currency snapshot on the GR-item
  // into a BU-currency total for the cost row — GR-items stay in supplier currency, cost rows +
  // quants live in BU currency.
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 2. Add Cost — manual (freight / customs / etc.)
  // -------------------------------------------------------------------------
  async associateCost(input: AssociateCostInput): Promise<InventoryItemCostDto> {
    const category = await this.costCategoriesRepository.findById(input.categoryId);
    if (!category) throw new NotFoundException('Cost category not found.');
    if (!category.isActive) {
      throw new BadRequestException(`Cost category "${category.name}" is inactive.`);
    }
    if (input.totalAmount === 0n) {
      throw new BadRequestException('Total amount must be non-zero.');
    }

    const cost = await this.associateCostInternal(input);

    if (input.sourceType === CostSourceTypeValues.GOODS_RECEIPT) {
      await this.grRepository.setCostAssociatedAt(input.sourceId, new Date());
    }

    return this.loadCostDto(cost.id);
  }

  // -------------------------------------------------------------------------
  // 3. Edit cost row
  // -------------------------------------------------------------------------
  async updateCost(costId: string, input: UpdateCostInput): Promise<InventoryItemCostDto> {
    const existing = await this.costsRepository.findById(costId);
    if (!existing) throw new NotFoundException('Cost row not found.');
    if (await this.isLocked(existing)) {
      throw new ConflictException({
        label: 'Cost row is locked',
        detail: 'This cost row has been consumed downstream and can no longer be edited.',
      });
    }

    const nextTotalAmount = input.totalAmount ?? existing.totalAmount;
    const nextDistribution = (input.distributionMethod ??
      existing.distributionMethod) as DistributionMethod;
    if (nextTotalAmount === 0n) {
      throw new BadRequestException('Total amount must be non-zero.');
    }

    await this.database.runInTransaction(async () => {
      // Capture the original quant set BEFORE wiping junctions so we can recompute their
      // total_unit_cost after.
      const originalJunctions = await this.junctionRepository.findByCostId(costId);
      const originalQuantIds = originalJunctions.map((j) => j.quantId);

      await this.junctionRepository.deleteByCostId(costId);
      await this.costsRepository.updateCost(costId, {
        totalAmount: nextTotalAmount,
        distributionMethod: nextDistribution,
        vendorRef: input.vendorRef !== undefined ? input.vendorRef : existing.vendorRef,
        notes: input.notes !== undefined ? input.notes : existing.notes,
      });

      // Re-distribute across the original quants. (If the cost scope changed, user should delete
      // and re-add — we don't change targetQuants on edit.)
      const quants = await this.quantsRepository.findByIds(originalQuantIds);
      const allocations = this.computeAllocations(quants, nextTotalAmount, nextDistribution);
      await this.junctionRepository.createMany(
        allocations.map((a) => ({ quantId: a.quantId, costId, allocatedAmount: a.allocatedAmount })),
      );

      await this.recomputeQuantTotalUnitCost(originalQuantIds);
    });

    if (existing.sourceType === CostSourceTypeValues.GOODS_RECEIPT) {
      await this.grRepository.setCostAssociatedAt(existing.sourceId, new Date());
    }

    return this.loadCostDto(costId);
  }

  // -------------------------------------------------------------------------
  // 4. Delete cost row
  // -------------------------------------------------------------------------
  async deleteCost(costId: string): Promise<{ affectedQuantIds: string[] }> {
    const existing = await this.costsRepository.findById(costId);
    if (!existing) throw new NotFoundException('Cost row not found.');
    if (await this.isLocked(existing)) {
      throw new ConflictException({
        label: 'Cost row is locked',
        detail: 'This cost row has been consumed downstream and can no longer be deleted.',
      });
    }

    let affectedQuantIds: string[] = [];
    await this.database.runInTransaction(async () => {
      const junctions = await this.junctionRepository.findByCostId(costId);
      affectedQuantIds = junctions.map((j) => j.quantId);
      await this.junctionRepository.deleteByCostId(costId);
      await this.costsRepository.deleteCost(costId);
      await this.recomputeQuantTotalUnitCost(affectedQuantIds);
    });

    if (existing.sourceType === CostSourceTypeValues.GOODS_RECEIPT) {
      await this.grRepository.setCostAssociatedAt(existing.sourceId, new Date());
    }

    return { affectedQuantIds };
  }

  // -------------------------------------------------------------------------
  // 5. Read paths
  // -------------------------------------------------------------------------

  // Composite payload for the GR detail page's Costs tab: summary + DataTable rows.
  async findCostsForGoodsReceipt(grId: string, state: TableViewState): Promise<CostsForSourceDto> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, CostAssociationService.COSTS_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, CostAssociationService.COSTS_FIELD_MAP);
    const where = (filterWhere && searchWhere) ? and(filterWhere, searchWhere) : (filterWhere ?? searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, CostAssociationService.COSTS_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const [{ result: rows, count }, kindBreakdownRows, gr] = await Promise.all([
      this.costsRepository.findBySourceWithCategory(
        CostSourceTypeValues.GOODS_RECEIPT,
        grId,
        { where, orderBy: orderBy.length ? orderBy : undefined, limit, offset },
      ),
      this.costsRepository.findKindBreakdown(CostSourceTypeValues.GOODS_RECEIPT, grId),
      this.grRepository.findById(grId),
    ]);
    if (!gr) throw new NotFoundException('Goods receipt not found.');

    const dtos = await Promise.all(
      rows.map(async (r) => InventoryItemCostDto.from(r, await this.isLocked(r as unknown as InventoryItemCost))),
    );

    // Total + per-unit summary (in the dominant currency from the cost rows; assumes single currency).
    const dominantCurrency = kindBreakdownRows[0]?.currencyCode ?? '';
    const total = kindBreakdownRows.reduce((s, k) => s + k.amount, 0n);
    const allQuants = await this.quantsRepository.findBySource(CostSourceTypeValues.GOODS_RECEIPT, grId);
    const totalQty = allQuants.reduce((s, q) => s + Number(q.quantity), 0);
    const perUnit = totalQty > 0
      ? BigInt(new Decimal(total.toString()).dividedBy(totalQty).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0))
      : 0n;

    // Kind breakdown — always emit all 6 kinds with 0 for missing ones so the frontend table is
    // shape-stable (see plan §6.5).
    const kindMap = new Map<string, bigint>();
    for (const k of kindBreakdownRows) kindMap.set(k.kind, (kindMap.get(k.kind) ?? 0n) + k.amount);
    const kindBreakdown: CostKindBreakdownEntryDto[] = KIND_ENUM.map((kind) => {
      const amount = kindMap.get(kind) ?? 0n;
      const pct = total > 0n
        ? Number((amount * 10000n) / total) / 100
        : 0;
      return {
        kind,
        amount: CurrencyAmountDto.from(amount, dominantCurrency),
        percentage: pct,
      };
    });

    return {
      costAssociatedAt: gr.costAssociatedAt?.toISOString() ?? null,
      totalAmount: CurrencyAmountDto.from(total, dominantCurrency),
      perUnitCost: CurrencyAmountDto.from(perUnit, dominantCurrency),
      kindBreakdown,
      costRows: { result: dtos, count },
    };
  }

  async findAllocationsForCost(costId: string): Promise<CostAllocationDto[]> {
    const cost = await this.costsRepository.findById(costId);
    if (!cost) throw new NotFoundException('Cost row not found.');
    const rows = await this.junctionRepository.findAllocationsForCost(costId);
    return rows.map((r) => CostAllocationDto.from(r, cost.currencyCode));
  }

  // -------------------------------------------------------------------------
  // Private — the primitive used by every entrypoint.
  // -------------------------------------------------------------------------
  private async associateCostInternal(input: AssociateCostInput): Promise<InventoryItemCost> {
    let quants: InventoryItemQuant[];
    if (input.targetQuantIds && input.targetQuantIds.length > 0) {
      quants = await this.quantsRepository.findByIds(input.targetQuantIds);
      // Validate every targetQuant actually belongs to this source.
      const stray = quants.find((q) => q.sourceType !== input.sourceType || q.sourceId !== input.sourceId);
      if (stray) {
        throw new BadRequestException(
          `Quant ${stray.id} does not belong to ${input.sourceType}=${input.sourceId}.`,
        );
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
      await this.recomputeQuantTotalUnitCost(quants.map((q) => q.id));
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
            (s, q) => s.plus(new Decimal(q.totalUnitCost.toString()).times(q.quantity)),
            new Decimal(0),
          );
          if (totalValue.isZero()) {
            // Falls back to by_quantity when quants have no cost yet (typical first auto-associate).
            const sumQty = quants.reduce((s, q) => s.plus(q.quantity), new Decimal(0));
            if (sumQty.isZero()) return quants.map(() => new Decimal(1).dividedBy(quants.length));
            return quants.map((q) => new Decimal(q.quantity).dividedBy(sumQty));
          }
          return quants.map((q) =>
            new Decimal(q.totalUnitCost.toString()).times(q.quantity).dividedBy(totalValue),
          );
        }
        case 'equal':
          return quants.map(() => new Decimal(1).dividedBy(quants.length));
      }
    })();

    const allocated = quants.map((q, i) => ({
      quantId: q.id,
      allocatedAmount: BigInt(
        total.times(shares[i]).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0),
      ),
    }));

    const computedSum = allocated.reduce((s, a) => s + a.allocatedAmount, 0n);
    const remainder = totalAmount - computedSum;
    if (remainder !== 0n && allocated.length > 0) {
      allocated[allocated.length - 1].allocatedAmount += remainder;
    }
    return allocated;
  }

  // Updates each affected quant's denormalized total_unit_cost from the live junction rows.
  private async recomputeQuantTotalUnitCost(quantIds: string[]): Promise<void> {
    if (quantIds.length === 0) return;
    const [sums, quants] = await Promise.all([
      this.junctionRepository.sumAllocatedByQuantIds(quantIds),
      this.quantsRepository.findByIds(quantIds),
    ]);
    for (const q of quants) {
      const sum = sums.get(q.id) ?? 0n;
      const qty = new Decimal(q.quantity);
      const totalUnitCost = qty.isZero()
        ? 0n
        : BigInt(
            new Decimal(sum.toString()).dividedBy(qty).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0),
          );
      await this.quantsRepository.updateTotalUnitCost(q.id, totalUnitCost);
    }
  }

  private async loadCostDto(costId: string): Promise<InventoryItemCostDto> {
    const cost = await this.costsRepository.findById(costId);
    if (!cost) throw new NotFoundException('Cost row not found.');
    // Re-query via the joined projection so the DTO has category name + kind.
    const { result } = await this.costsRepository.findBySourceWithCategory(cost.sourceType, cost.sourceId, {
      where: eq(inventoryItemCosts.id, costId),
      limit: 1,
      offset: 0,
    });
    const row = result[0];
    if (!row) throw new NotFoundException('Cost row not found.');
    return InventoryItemCostDto.from(row, await this.isLocked(cost));
  }

}

import { GoodsReceiptLineItemsRepository } from '@domain/goods-receipt-line-items/repositories/goods-receipt-line-items.repository';
import {
  GoodsReceiptLinesRepository,
  type GoodsReceiptLineWithRefs,
} from '@domain/goods-receipt-lines/repositories/goods-receipt-lines.repository';
import { GoodsReceiptLotsRepository } from '@domain/goods-receipt-lots/repositories/goods-receipt-lots.repository';
import { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { GoodsReceiptItemsRepository } from '@domain/goods-receipts/repositories/goods-receipt-items.repository';
import {
  GoodsReceiptsRepository,
  type GoodsReceiptWithRefs,
} from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { GoodsReceiptsService } from '@domain/goods-receipts/services/goods-receipts.service';
import { InventoryItemLedgerService } from '@domain/inventory-item-ledger/services/inventory-item-ledger.service';
import { InventoryItemLotsService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { InventoryItemCostsRepository } from '@domain/inventory-item-quants/repositories/inventory-item-costs.repository';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryItemsRepository } from '@domain/inventory-items/repositories/inventory-items.repository';
import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import Decimal from '@vritti/api-sdk/decimal';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { allocateByWeight } from '@/common/allocate';
import {
  CostDistributionMethodValues,
  CostSourceTypeValues,
  GoodsReceiptStatusValues,
  InventoryItemLedgerReferenceTypeValues,
  InventoryItemLedgerTypeValues,
  type InventoryTracking,
  InventoryTrackingValues,
  PurchaseOrderStatusValues,
} from '@/db/schema';

const SERIAL_TRACKINGS = new Set<InventoryTracking>([
  InventoryTrackingValues.SERIAL,
  InventoryTrackingValues.LOT_SERIAL,
]);

type PublishItem = Awaited<ReturnType<GoodsReceiptItemsRepository['findByReceiptIdForPublish']>>[number];

// Lot snapshot for quant creation; a lot line missing its expiry is a hard error.
function toLotInfo(line: GoodsReceiptLineWithRefs) {
  if (!line.lotNumber) return undefined;
  if (!line.lotExpiryDate) {
    throw new BadRequestException({
      label: 'Missing Expiry Date',
      detail: `Line ${line.id} has a lot without an expiry date.`,
    });
  }
  return {
    lotNumber: line.lotNumber,
    manufacturingDate: line.lotManufacturingDate ?? null,
    expiryDate: line.lotExpiryDate,
  };
}

@Injectable()
export class GoodsReceiptsPublishService {
  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly goodsReceiptsRepository: GoodsReceiptsRepository,
    private readonly grItemsRepository: GoodsReceiptItemsRepository,
    private readonly grLotsRepository: GoodsReceiptLotsRepository,
    private readonly grLinesRepository: GoodsReceiptLinesRepository,
    private readonly grLineItemsRepository: GoodsReceiptLineItemsRepository,
    private readonly quantsService: InventoryItemQuantsService,
    private readonly costsRepository: InventoryItemCostsRepository,
    private readonly inventoryLotsService: InventoryItemLotsService,
    private readonly ledgerService: InventoryItemLedgerService,
    private readonly goodsReceiptsService: GoodsReceiptsService,
    private readonly inventoryItemsRepository: InventoryItemsRepository,
  ) {}

  async publish(id: string, siteCurrencyCode: string): Promise<GoodsReceiptDto> {
    const goodsReceipt = await this.goodsReceiptsRepository.findByIdWithRefs(id);
    if (!goodsReceipt) {
      throw new NotFoundException({ label: 'Goods Receipt Not Found', detail: 'Goods receipt not found.' });
    }
    if (goodsReceipt.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException({
        label: 'Cannot Publish',
        detail: 'Only DRAFT goods receipts can be published.',
      });
    }

    const grItems = await this.grItemsRepository.findByReceiptIdForPublish(id);
    if (grItems.length === 0) {
      throw new BadRequestException({
        label: 'Cannot Publish',
        detail: 'Add at least one item before publishing this goods receipt.',
      });
    }
    // Same gate as the UI's Publish button: every item fully distributed + all serial lines balanced.
    await this.goodsReceiptsService.assertPublishable(id, goodsReceipt.status, goodsReceipt.purchaseOrderId);

    // Cost is set on the quant at creation (price × exchange rate), so every item must carry a price.
    const itemsMissingPrice = grItems.filter((grItem) => (grItem.primaryUomUnitPrice ?? 0n) <= 0n);
    if (itemsMissingPrice.length > 0) {
      throw new BadRequestException({
        label: 'Missing Unit Price',
        detail: `${itemsMissingPrice.length} item(s) have no unit price. Set a price for every item before publishing.`,
      });
    }

    await this.database.runInTransaction(async () => {
      for (const grItem of grItems) {
        await this.publishItem(goodsReceipt, grItem, siteCurrencyCode);
      }
      if (goodsReceipt.purchaseOrderId) await this.finalizePoStatus(goodsReceipt.purchaseOrderId);
      await this.goodsReceiptsRepository.updateStatus(id, GoodsReceiptStatusValues.PUBLISHED, new Date());
    });

    return this.goodsReceiptsService.findById(id);
  }

  // Turns one item's lines into quants, then reconciles the linked PO line.
  private async publishItem(
    goodsReceipt: GoodsReceiptWithRefs,
    grItem: PublishItem,
    siteCurrencyCode: string,
  ): Promise<void> {
    const grLines = await this.grLinesRepository.findByItemId(grItem.id);
    const inventoryLotByGrLot = await this.resolveLots(grItem, grLines);

    // Sum the primary-UOM qty added per quant — a line may merge into an already-seen quant.
    const qtyByQuant = new Map<string, number>();
    let lastMrp: bigint | null = null;
    for (const grLine of grLines) {
      const { quantId, quantity } = await this.publishLine(
        goodsReceipt,
        grItem,
        grLine,
        inventoryLotByGrLot,
        siteCurrencyCode,
      );
      qtyByQuant.set(quantId, (qtyByQuant.get(quantId) ?? 0) + quantity);
      lastMrp = grLine.lotMrp ?? lastMrp;
    }

    if (lastMrp != null) {
      await this.inventoryItemsRepository.update(grItem.inventoryItemId, { defaultMrp: lastMrp });
    }

    await this.allocateItemCost(goodsReceipt, grItem, qtyByQuant, siteCurrencyCode);

    // Only the paid (ordered) qty reconciles against the PO; free qty is bonus stock, not ordered.
    await this.reconcilePoItem(goodsReceipt, grItem, grItem.orderedQty);
  }

  // Splits the item's paid amount across its quants by received qty so Σ quant_cost == paid exactly,
  // pinning each slice in inventory_item_costs/_quant_costs when an ITEM cost category exists.
  private async allocateItemCost(
    goodsReceipt: GoodsReceiptWithRefs,
    grItem: PublishItem,
    qtyByQuant: Map<string, number>,
    siteCurrencyCode: string,
  ): Promise<void> {
    const quants = [...qtyByQuant.entries()].map(([quantId, qty]) => ({ quantId, qty }));
    if (quants.length === 0) return;

    const total = BigInt(
      new Decimal((grItem.primaryUomUnitPrice ?? 0n).toString())
        .times(goodsReceipt.exchangeRate)
        .times(grItem.orderedQty)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toFixed(0),
    );
    if (total <= 0n) return;

    const allocs = allocateByWeight(
      total,
      quants.map((q) => q.qty),
    );

    const categoryId = await this.costsRepository.findItemCategoryId();
    if (categoryId) {
      const costId = await this.costsRepository.insertCost({
        categoryId,
        totalAmount: total,
        currencyCode: siteCurrencyCode,
        sourceType: CostSourceTypeValues.GOODS_RECEIPT,
        sourceId: goodsReceipt.id,
        distributionMethod: CostDistributionMethodValues.BY_QUANTITY,
        unallocatedAmount: 0n,
      });
      await this.costsRepository.insertQuantCosts(
        quants.map((q, i) => ({ quantId: q.quantId, costId, allocatedAmount: allocs[i] })),
      );
    }

    // Bumps cost/value by this receipt's slice — works whether the quant is fresh or merged.
    for (let i = 0; i < quants.length; i++) {
      await this.quantsService.addQuantCostValue(quants[i].quantId, allocs[i], allocs[i]);
    }
  }

  // Find-or-create the inventory lot for each distinct receipt lot once → { grLotId: inventoryLotId }.
  private async resolveLots(grItem: PublishItem, grLines: GoodsReceiptLineWithRefs[]): Promise<Map<string, string>> {
    const inventoryLotByGrLot = new Map<string, string>();
    for (const grLine of grLines) {
      const grLotId = grLine.goodsReceiptLotId;
      if (!grLotId || inventoryLotByGrLot.has(grLotId)) continue;
      const lotInfo = toLotInfo(grLine);
      if (!lotInfo) continue;
      const inventoryLot = await this.inventoryLotsService.findOrCreateLot({
        inventoryItemId: grItem.inventoryItemId,
        ...lotInfo,
        mrp: grLine.lotMrp,
      });
      inventoryLotByGrLot.set(grLotId, inventoryLot.id);
      await this.grLotsRepository.setResolvedLotId(grLotId, inventoryLot.id);
    }
    return inventoryLotByGrLot;
  }

  // Creates the quant for one line (tracking-aware via optional fields) + the ledger entry.
  // Returns the created/merged quant id and the primary-UOM qty added on this line; the cost
  // baseline is skipped — allocateItemCost owns quant_cost/value for GR.
  private async publishLine(
    goodsReceipt: GoodsReceiptWithRefs,
    grItem: PublishItem,
    grLine: GoodsReceiptLineWithRefs,
    inventoryLotByGrLot: Map<string, string>,
    siteCurrencyCode: string,
  ): Promise<{ quantId: string; quantity: number }> {
    // Snapshotted in the item's primary UOM at line add/edit — read it as-is.
    const primaryUomQuantity = grLine.primaryUomQty;

    // Effective landed unit cost in site-currency minor units. The amount paid (price × exchange rate × ordered
    // qty) is spread across the TOTAL received qty (ordered + free), so free goods pull the per-unit
    // cost down without ever reaching 0 (ordered_qty > 0 is guaranteed at item add).
    const unitCost = BigInt(
      new Decimal((grItem.primaryUomUnitPrice ?? 0n).toString())
        .times(goodsReceipt.exchangeRate)
        .times(grItem.orderedQty)
        .div(grItem.totalQty)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toFixed(0),
    );

    const serials = SERIAL_TRACKINGS.has(grItem.tracking)
      ? (await this.grLineItemsRepository.findByLineId(grLine.id)).map((li) => li.serialNumber)
      : undefined;

    const { quant } = await this.quantsService.createQuantScoped({
      inventoryItemId: grItem.inventoryItemId,
      locationId: grLine.locationId,
      quantity: primaryUomQuantity,
      tracking: grItem.tracking,
      unitCost,
      lotId: grLine.goodsReceiptLotId ? (inventoryLotByGrLot.get(grLine.goodsReceiptLotId) ?? null) : null,
      lot: grLine.goodsReceiptLotId ? toLotInfo(grLine) : undefined,
      serialNumbers: serials,
      costCurrency: siteCurrencyCode,
      sourceType: CostSourceTypeValues.GOODS_RECEIPT,
      sourceId: goodsReceipt.id,
      skipCostBaseline: true,
    });
    await this.grLinesRepository.setResolvedQuant(grLine.id, quant.id);

    await this.ledgerService.createEntry({
      inventoryItemId: grItem.inventoryItemId,
      type: InventoryItemLedgerTypeValues.GOODS_RECEIPT,
      quantity: primaryUomQuantity,
      referenceType: InventoryItemLedgerReferenceTypeValues.GOODS_RECEIPT,
      referenceId: goodsReceipt.id,
      notes: goodsReceipt.notes ?? null,
    });

    return { quantId: quant.id, quantity: primaryUomQuantity };
  }

  // PO-linked items only: enforce the remaining-quantity cap, then bump received_quantity.
  private async reconcilePoItem(
    goodsReceipt: GoodsReceiptWithRefs,
    grItem: PublishItem,
    accepted: number,
  ): Promise<void> {
    if (!goodsReceipt.purchaseOrderId || !grItem.poItemId) return;
    const ordered = Number(grItem.poOrderedQuantity ?? 0);
    const received = Number(grItem.poReceivedQuantity ?? 0);
    if (this.toScaled(received + accepted) > this.toScaled(ordered)) {
      throw new BadRequestException({
        label: 'Exceeds PO Quantity',
        detail: `Accepted quantity ${accepted} exceeds the remaining PO quantity ${ordered - received} for item ${grItem.id}.`,
      });
    }
    await this.goodsReceiptsRepository.updatePoItemReceivedQty(grItem.poItemId, accepted);
  }

  private async finalizePoStatus(purchaseOrderId: string): Promise<void> {
    const totals = await this.goodsReceiptsRepository.getPoTotals(purchaseOrderId);
    if (this.toScaled(totals.receivedQuantity) >= this.toScaled(totals.uomQty) && totals.uomQty > 0) {
      await this.goodsReceiptsRepository.updatePoStatus(purchaseOrderId, PurchaseOrderStatusValues.RECEIVED);
    } else if (totals.receivedQuantity > 0) {
      await this.goodsReceiptsRepository.updatePoStatus(purchaseOrderId, PurchaseOrderStatusValues.PARTIALLY_RECEIVED);
    }
  }

  private toScaled(value: number): number {
    return Math.round(value * 1000);
  }
}

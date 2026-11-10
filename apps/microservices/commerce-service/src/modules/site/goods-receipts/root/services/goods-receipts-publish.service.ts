import { GoodsReceiptLineItemsDomainRepository } from '@domain/goods-receipt-line-items/repositories/goods-receipt-line-items.repository';
import {
  type GoodsReceiptLineRow,
  GoodsReceiptLinesDomainRepository,
} from '@domain/goods-receipt-lines/repositories/goods-receipt-lines.repository';
import { GoodsReceiptLotsDomainRepository } from '@domain/goods-receipt-lots/repositories/goods-receipt-lots.repository';
import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import type { GoodsReceiptItemRow } from '@domain/goods-receipts/repositories/goods-receipt-items.repository';
import {
  type GoodsReceiptRow,
  GoodsReceiptsDomainRepository,
} from '@domain/goods-receipts/repositories/goods-receipts.repository';
import {
  type GoodsReceiptItemCost,
  GoodsReceiptItemsDomainService,
} from '@domain/goods-receipts/services/goods-receipt-items.service';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { InventoryItemLedgerDomainService } from '@domain/inventory-item-ledger/services/inventory-item-ledger.service';
import { InventoryItemLotsDomainService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { InventoryItemMrpsDomainService } from '@domain/inventory-item-mrps/services/inventory-item-mrps.service';
import { InventoryItemCostsDomainRepository } from '@domain/inventory-item-quants/repositories/inventory-item-costs.repository';
import { InventoryItemQuantsDomainService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryItemSitesDomainService } from '@domain/inventory-item-sites/services/inventory-item-sites.service';
import { PurchaseOrderItemsDomainRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import Decimal from '@vritti/api-sdk/decimal';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import { allocateByWeight } from '@/common/allocate';
import {
  CostDistributionMethodValues,
  CostSourceTypeValues,
  type GoodsReceiptLot,
  InventoryItemLedgerReferenceTypeValues,
  InventoryItemLedgerTypeValues,
  InventoryTrackingValues,
} from '@/db/schema';

@Injectable()
export class GoodsReceiptsPublishService {
  private readonly logger = new Logger(GoodsReceiptsPublishService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly goodsReceiptsRepository: GoodsReceiptsDomainRepository,
    private readonly itemsService: GoodsReceiptItemsDomainService,
    private readonly lotsRepository: GoodsReceiptLotsDomainRepository,
    private readonly linesRepository: GoodsReceiptLinesDomainRepository,
    private readonly lineItemsRepository: GoodsReceiptLineItemsDomainRepository,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly purchaseOrderItemsRepository: PurchaseOrderItemsDomainRepository,
    private readonly quantsService: InventoryItemQuantsDomainService,
    private readonly costsRepository: InventoryItemCostsDomainRepository,
    private readonly inventoryLotsService: InventoryItemLotsDomainService,
    private readonly ledgerService: InventoryItemLedgerDomainService,
    private readonly mrpsService: InventoryItemMrpsDomainService,
    private readonly inventoryItemSitesService: InventoryItemSitesDomainService,
    private readonly inboundDeliveriesService: InboundDeliveriesDomainService,
  ) {}

  // Lands a draft receipt's accepted stock at its site at provisional PO cost, in that site's context, and moves its POs
  async publish(id: string, leCurrencyCode: string, headers: NatsHeaders): Promise<GoodsReceiptDto> {
    const receipt = await this.goodsReceiptsRepository.findDraftOrThrow(id, 'Cannot Publish');
    this.goodsReceiptsRepository.assertPublishable(receipt);
    const siteContext: NatsHeaders = {
      ...headers,
      siteId: receipt.siteId,
      siteTimezone: receipt.siteTimezone ?? headers.siteTimezone,
      siteCurrencyCode: leCurrencyCode,
    };

    await this.database.runWithRlsContext(siteContext, async () => {
      const costs = await this.itemsService.findProvisionalCosts(receipt.id, leCurrencyCode);
      await this.database.runInTransaction(async () => {
        await this.inventoryItemSitesService.ensureEnabled(
          receipt.siteId,
          costs.map((cost) => cost.item.inventoryItemId),
        );
        for (const cost of costs) {
          await this.landItem(receipt, cost, leCurrencyCode);
        }
        await this.goodsReceiptsService.markPublished(receipt.id);
        await this.syncReceivedDocuments(receipt);
      });
    });

    this.logger.log(`goodsReceipts.publish — ${receipt.grNumber} at site ${receipt.siteId}`);
    return this.goodsReceiptsService.findById(id);
  }

  // Moves what the published receipt counted onto its documents: each PO line's received quantity, each touched PO's status, then its inbound delivery's
  private async syncReceivedDocuments(receipt: GoodsReceiptRow): Promise<void> {
    await this.purchaseOrderItemsRepository.syncReceivedQuantitiesForReceipt(receipt.id);
    await this.purchaseOrdersService.syncReceiptStatusesForReceipt(receipt.id);
    await this.inboundDeliveriesService.syncReceiptStatus(receipt.inboundDeliveryId);
  }

  // Turns an item's lines into quants with ledger entries, records its printed MRP and spreads its value over them
  private async landItem(receipt: GoodsReceiptRow, cost: GoodsReceiptItemCost, leCurrencyCode: string): Promise<void> {
    const lines = await this.linesRepository.findByItemId(cost.item.id);
    const lots = await this.lotsRepository.findByItemId(cost.item.id);
    const inventoryLotIdByReceiptLotId = await this.resolveInventoryLots(cost.item, lots, leCurrencyCode);

    const quantityByQuantId = new Map<string, Decimal>();
    for (const line of lines) {
      const quantId = await this.landLine(receipt, cost, line, lots, inventoryLotIdByReceiptLotId, leCurrencyCode);
      quantityByQuantId.set(quantId, (quantityByQuantId.get(quantId) ?? new Decimal(0)).plus(line.primaryUomQty));
    }

    const lastPricedLot = lots.findLast((lot) => lot.mrp !== null);
    if (lastPricedLot?.mrp) {
      await this.mrpsService.upsert(
        cost.item.inventoryItemId,
        cost.item.uomId,
        leCurrencyCode,
        lastPricedLot.mrp,
        inventoryLotIdByReceiptLotId.get(lastPricedLot.id) ?? null,
      );
    }

    await this.allocateItemValue(receipt, cost, quantityByQuantId, leCurrencyCode);
  }

  // Finds or creates the inventory lot of each receipt lot, carrying its MRP, and links the two
  private async resolveInventoryLots(
    item: GoodsReceiptItemRow,
    lots: GoodsReceiptLot[],
    leCurrencyCode: string,
  ): Promise<Map<string, string>> {
    const inventoryLotIdByReceiptLotId = new Map<string, string>();
    for (const lot of lots) {
      const inventoryLot = await this.inventoryLotsService.findOrCreateLot({
        inventoryItemId: item.inventoryItemId,
        lotNumber: lot.lotNumber,
        manufacturingDate: lot.manufacturingDate,
        expiryDate: lot.expiryDate,
        mrp: lot.mrp,
        mrpCurrencyCode: lot.mrp === null ? null : leCurrencyCode,
      });
      await this.lotsRepository.update(lot.id, { resolvedLotId: inventoryLot.id });
      inventoryLotIdByReceiptLotId.set(lot.id, inventoryLot.id);
    }
    return inventoryLotIdByReceiptLotId;
  }

  // Creates (or merges into) the quant one line lands in at the item's provisional unit cost, and its ledger entry
  private async landLine(
    receipt: GoodsReceiptRow,
    cost: GoodsReceiptItemCost,
    line: GoodsReceiptLineRow,
    lots: GoodsReceiptLot[],
    inventoryLotIdByReceiptLotId: Map<string, string>,
    leCurrencyCode: string,
  ): Promise<string> {
    const lot = lots.find((receiptLot) => receiptLot.id === line.goodsReceiptLotId);
    const isSerialTracked =
      cost.item.inventoryItemTracking === InventoryTrackingValues.SERIAL ||
      cost.item.inventoryItemTracking === InventoryTrackingValues.LOT_SERIAL;
    const serials = isSerialTracked ? await this.lineItemsRepository.findByLineId(line.id) : [];

    const { quant } = await this.quantsService.createQuantScoped({
      inventoryItemId: cost.item.inventoryItemId,
      locationId: line.locationId,
      quantity: line.primaryUomQty,
      tracking: cost.item.inventoryItemTracking,
      unitCost: cost.unitCost,
      lotId: lot ? (inventoryLotIdByReceiptLotId.get(lot.id) ?? null) : null,
      lot: lot
        ? { lotNumber: lot.lotNumber, manufacturingDate: lot.manufacturingDate, expiryDate: lot.expiryDate }
        : undefined,
      serialNumbers: isSerialTracked ? serials.map((serial) => serial.serialNumber) : undefined,
      costCurrency: leCurrencyCode,
      sourceType: CostSourceTypeValues.GOODS_RECEIPT,
      sourceId: receipt.id,
      skipCostBaseline: true,
    });
    await this.linesRepository.update(line.id, { resolvedQuantId: quant.id });

    await this.ledgerService.createEntry({
      inventoryItemId: cost.item.inventoryItemId,
      type: InventoryItemLedgerTypeValues.GOODS_RECEIPT,
      quantity: line.primaryUomQty,
      referenceType: InventoryItemLedgerReferenceTypeValues.GOODS_RECEIPT,
      referenceId: receipt.id,
      notes: receipt.notes,
    });
    return quant.id;
  }

  // Splits the item's provisional value over its quants by quantity, summing exactly, and pins each in the junction
  private async allocateItemValue(
    receipt: GoodsReceiptRow,
    cost: GoodsReceiptItemCost,
    quantityByQuantId: Map<string, Decimal>,
    leCurrencyCode: string,
  ): Promise<void> {
    const quantities = [...quantityByQuantId.entries()];
    if (quantities.length === 0 || cost.value <= 0n) return;
    const slices = allocateByWeight(
      cost.value,
      quantities.map(([, quantity]) => quantity.toNumber()),
    );

    const categoryId = await this.costsRepository.findItemCategoryId();
    if (categoryId) {
      const costId = await this.costsRepository.insertCost({
        categoryId,
        totalAmount: cost.value,
        currencyCode: leCurrencyCode,
        sourceType: CostSourceTypeValues.GOODS_RECEIPT,
        sourceId: receipt.id,
        distributionMethod: CostDistributionMethodValues.BY_QUANTITY,
        unallocatedAmount: 0n,
      });
      await this.costsRepository.insertQuantCosts(
        quantities.map(([quantId], index) => ({ quantId, costId, allocatedAmount: slices[index] })),
      );
    }

    for (const [index, [quantId]] of quantities.entries()) {
      await this.quantsService.addQuantCostValue(quantId, slices[index], slices[index]);
    }
  }
}

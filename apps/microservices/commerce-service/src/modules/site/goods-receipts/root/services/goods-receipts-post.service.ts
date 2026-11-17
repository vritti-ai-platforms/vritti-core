import { GoodsReceiptLineItemsDomainService } from '@domain/goods-receipt-line-items/services/goods-receipt-line-items.service';
import type { GoodsReceiptLineRow } from '@domain/goods-receipt-lines/repositories/goods-receipt-lines.repository';
import { GoodsReceiptLinesDomainService } from '@domain/goods-receipt-lines/services/goods-receipt-lines.service';
import { GoodsReceiptLotsDomainService } from '@domain/goods-receipt-lots/services/goods-receipt-lots.service';
import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import type { GoodsReceiptItemRow } from '@domain/goods-receipts/repositories/goods-receipt-items.repository';
import type { GoodsReceiptRow } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import {
  type GoodsReceiptItemCost,
  GoodsReceiptItemsDomainService,
} from '@domain/goods-receipts/services/goods-receipt-items.service';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { InventoryItemLedgerDomainService } from '@domain/inventory-item-ledger/services/inventory-item-ledger.service';
import { InventoryItemLotsDomainService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { InventoryItemQuantsDomainService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryItemSitesDomainRepository } from '@domain/inventory-item-sites/repositories/inventory-item-sites.repository';
import { PurchaseOrderItemsDomainService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import Decimal from '@vritti/api-sdk/decimal';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import { allocateByWeight, type CurrencyCode, minorToMajor } from '@vritti/api-sdk/money';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import {
  CostDistributionMethodValues,
  CostSourceTypeValues,
  type GoodsReceiptLot,
  InboundDeliverySourceValues,
  InventoryItemLedgerReferenceTypeValues,
  InventoryItemLedgerTypeValues,
  InventoryTrackingValues,
} from '@/db/schema';
import { PurchaseProgressService } from '@/modules/site/purchase-progress/services/purchase-progress.service';

export interface ReceiptLanding {
  costs: GoodsReceiptItemCost[];
  lotsByItemId: Map<string, GoodsReceiptLot[]>;
}

@Injectable()
export class GoodsReceiptsPostService {
  private readonly logger = new Logger(GoodsReceiptsPostService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly itemsService: GoodsReceiptItemsDomainService,
    private readonly lotsService: GoodsReceiptLotsDomainService,
    private readonly linesService: GoodsReceiptLinesDomainService,
    private readonly lineItemsService: GoodsReceiptLineItemsDomainService,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly purchaseOrderItemsService: PurchaseOrderItemsDomainService,
    private readonly quantsService: InventoryItemQuantsDomainService,
    private readonly inventoryLotsService: InventoryItemLotsDomainService,
    private readonly ledgerService: InventoryItemLedgerDomainService,
    private readonly inventoryItemSitesRepository: InventoryItemSitesDomainRepository,
    private readonly inboundDeliveriesService: InboundDeliveriesDomainService,
    private readonly purchasesRepository: PurchasesDomainRepository,
    private readonly purchaseProgressService: PurchaseProgressService,
  ) {}

  // Lands a draft receipt's accepted stock at its site at provisional PO cost, in that site's context, and moves the
  // counters and statuses of the PO lines and delivery it fulfils; its items must be enabled at the site and an existing
  // lot must carry the same MRP. A purchase's receipt tells its purchase in the same transaction; a Receive with Invoice
  // receipt is posted only with its supplier invoice
  async post(id: string, leCurrencyCode: string, headers: NatsHeaders): Promise<GoodsReceiptDto> {
    const receipt = await this.goodsReceiptsService.findDraftOrThrow(id, 'Cannot Post');
    if (receipt.deliverySource === InboundDeliverySourceValues.SUPPLIER_INVOICE) {
      this.purchasesRepository.assertNotPartOfPurchase(`Goods receipt "${receipt.grNumber}"`, [receipt.purchaseNumber]);
    }
    this.goodsReceiptsService.assertPostable(receipt);

    await this.inSiteContext(receipt, leCurrencyCode, headers, async () => {
      const landing = await this.prepareLanding(receipt, leCurrencyCode);
      await this.database.runInTransaction(async () => {
        await this.land(receipt, landing, leCurrencyCode);
        if (receipt.purchaseId) {
          await this.purchaseProgressService.notifyDocument(receipt.purchaseId, receipt.supplierId);
        }
      });
    });

    this.logger.log(`goodsReceipts.post — ${receipt.grNumber} at site ${receipt.siteId}`);
    return this.goodsReceiptsService.findById(id);
  }

  // Lands a prepared draft's stock, marks it posted and moves the documents it fulfils, in the caller's transaction
  async land(receipt: GoodsReceiptRow, landing: ReceiptLanding, leCurrencyCode: string): Promise<void> {
    for (const cost of landing.costs) {
      await this.landItem(receipt, cost, landing.lotsByItemId.get(cost.item.id) ?? [], leCurrencyCode);
    }
    await this.goodsReceiptsService.markPosted(receipt.id);
    await this.moveFulfilledDocuments(receipt, landing.costs);
  }

  // Runs work in a receipt's site context, which landing stock needs, with the legal entity's currency
  inSiteContext<T>(
    receipt: Pick<GoodsReceiptRow, 'siteId'>,
    leCurrencyCode: string,
    headers: NatsHeaders,
    run: () => Promise<T>,
  ): Promise<T> {
    const siteContext: NatsHeaders = {
      ...headers,
      siteId: receipt.siteId,
      leCurrencyCode: leCurrencyCode,
    };
    return this.database.runWithRlsContext(siteContext, run);
  }

  // Checks a draft's items are enabled at its site and its lots keep their MRPs, and works out what it lands at
  async prepareLanding(receipt: GoodsReceiptRow, leCurrencyCode: string): Promise<ReceiptLanding> {
    const costs = await this.itemsService.findProvisionalCosts(receipt.id, leCurrencyCode);
    await this.inventoryItemSitesRepository.ensureAtSite(
      _.uniq(costs.map((cost) => cost.item.inventoryItemId)),
      'items',
      receipt.siteId,
    );
    const lotsByItemId = new Map<string, GoodsReceiptLot[]>();
    for (const cost of costs) {
      const lots = await this.lotsService.findLotsOfItem(cost.item.id);
      await this.assertLotMrpsKept(cost.item, lots, leCurrencyCode);
      lotsByItemId.set(cost.item.id, lots);
    }
    return { costs, lotsByItemId };
  }

  // Moves what the posted receipt accepted and rejected onto its PO lines' counters, then its POs' statuses and its delivery's status
  private async moveFulfilledDocuments(receipt: GoodsReceiptRow, costs: GoodsReceiptItemCost[]): Promise<void> {
    await this.purchaseOrderItemsService.applyReceipt(
      costs.map((cost) => ({
        purchaseOrderItemId: cost.item.purchaseOrderItemId,
        acceptedPrimaryQty: cost.acceptedPrimaryQty,
        rejectedPrimaryQty: cost.item.rejectedPrimaryQty,
      })),
      'apply',
    );
    await this.purchaseOrdersService.syncProgressOfItems(costs.map((cost) => cost.item.purchaseOrderItemId));
    await this.inboundDeliveriesService.syncReceiptStatus(receipt.inboundDeliveryId);
  }

  // Rejects a receipt lot whose batch already exists for the item with another MRP; a lot keeps the MRP it was created with
  private async assertLotMrpsKept(
    item: GoodsReceiptItemRow,
    lots: GoodsReceiptLot[],
    leCurrencyCode: string,
  ): Promise<void> {
    for (const lot of lots) {
      if (lot.mrp === null) continue;
      const existing = await this.inventoryLotsService.findByItemAndNumber(item.inventoryItemId, lot.lotNumber);
      if (!existing || (existing.mrp === lot.mrp && existing.mrpCurrencyCode === leCurrencyCode)) continue;
      const existingMrp =
        existing.mrp === null || !existing.mrpCurrencyCode
          ? 'no MRP'
          : `MRP ${existing.mrpCurrencyCode} ${minorToMajor(existing.mrp, existing.mrpCurrencyCode as CurrencyCode)}`;
      throw new ConflictException({
        label: 'Lot MRP Differs',
        detail: `Lot ${lot.lotNumber} of "${item.inventoryItemName}" already exists with ${existingMrp}; a lot keeps the MRP it was created with. Correct the MRP on the receipt lot.`,
      });
    }
  }

  // Turns an item's lines into quants with ledger entries and spreads its value over them
  private async landItem(
    receipt: GoodsReceiptRow,
    cost: GoodsReceiptItemCost,
    lots: GoodsReceiptLot[],
    leCurrencyCode: string,
  ): Promise<void> {
    const lines = await this.linesService.findLinesOfItem(cost.item.id);
    const inventoryLotIdByReceiptLotId = await this.resolveInventoryLots(cost.item, lots, leCurrencyCode);

    const quantityByQuantId = new Map<string, Decimal>();
    for (const line of lines) {
      const quantId = await this.landLine(receipt, cost, line, lots, inventoryLotIdByReceiptLotId, leCurrencyCode);
      quantityByQuantId.set(quantId, (quantityByQuantId.get(quantId) ?? new Decimal(0)).plus(line.primaryUomQty));
    }

    await this.allocateItemValue(receipt, cost, quantityByQuantId, leCurrencyCode);
  }

  // Finds the inventory lot of each receipt lot, or creates it carrying the receipt lot's MRP, and links the two
  private async resolveInventoryLots(
    item: GoodsReceiptItemRow,
    lots: GoodsReceiptLot[],
    leCurrencyCode: string,
  ): Promise<Map<string, string>> {
    const inventoryLotIdByReceiptLotId = new Map<string, string>();
    for (const lot of lots) {
      const inventoryLot =
        (await this.inventoryLotsService.findByItemAndNumber(item.inventoryItemId, lot.lotNumber)) ??
        (await this.inventoryLotsService.createLot({
          inventoryItemId: item.inventoryItemId,
          lotNumber: lot.lotNumber,
          manufacturingDate: lot.manufacturingDate,
          expiryDate: lot.expiryDate,
          mrp: lot.mrp,
          mrpCurrencyCode: lot.mrp === null ? null : leCurrencyCode,
        }));
      await this.lotsService.linkInventoryLot(lot.id, inventoryLot.id);
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
    const serials = isSerialTracked ? await this.lineItemsService.findSerialsOfLine(line.id) : [];

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
    await this.linesService.linkQuant(line.id, quant.id);

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

    const categoryId = await this.quantsService.findItemCategoryId();
    if (categoryId) {
      await this.quantsService.bookCost(
        {
          categoryId,
          totalAmount: cost.value,
          currencyCode: leCurrencyCode,
          sourceType: CostSourceTypeValues.GOODS_RECEIPT,
          sourceId: receipt.id,
          distributionMethod: CostDistributionMethodValues.BY_QUANTITY,
          unallocatedAmount: 0n,
        },
        quantities.map(([quantId], index) => ({ quantId, allocatedAmount: slices[index] })),
      );
    }

    for (const [index, [quantId]] of quantities.entries()) {
      await this.quantsService.addQuantCostValue(quantId, slices[index], slices[index]);
    }
  }
}

import { GoodsReceiptLineItemsRepository } from '@domain/goods-receipt-line-items/repositories/goods-receipt-line-items.repository';
import { GoodsReceiptLinesRepository } from '@domain/goods-receipt-lines/repositories/goods-receipt-lines.repository';
import { GoodsReceiptLotsRepository } from '@domain/goods-receipt-lots/repositories/goods-receipt-lots.repository';
import { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { GoodsReceiptItemsRepository } from '@domain/goods-receipts/repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { GoodsReceiptsService } from '@domain/goods-receipts/services/goods-receipts.service';
import { CostAssociationService } from '@domain/inventory-item-costs/services/cost-association.service';
import { InventoryItemLedgerService } from '@domain/inventory-item-ledger/services/inventory-item-ledger.service';
import { InventoryItemLotsService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import {
  type CreateNewQuantParams,
  InventoryItemQuantsService,
} from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { UomConversionsService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException, PrimaryDatabaseService } from '@vritti/api-sdk';
import {
  CostSourceTypeValues,
  GoodsReceiptStatusValues,
  InventoryItemLedgerReferenceTypeValues,
  InventoryItemLedgerTypeValues,
  InventoryTrackingValues,
  PurchaseOrderStatusValues,
} from '@/db/schema';

@Injectable()
export class GoodsReceiptsPublishService {
  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly receiptsRepository: GoodsReceiptsRepository,
    private readonly itemsRepository: GoodsReceiptItemsRepository,
    private readonly lotsRepository: GoodsReceiptLotsRepository,
    private readonly linesRepository: GoodsReceiptLinesRepository,
    private readonly lineItemsRepository: GoodsReceiptLineItemsRepository,
    private readonly quantsService: InventoryItemQuantsService,
    private readonly lotsService: InventoryItemLotsService,
    private readonly ledgerService: InventoryItemLedgerService,
    private readonly receiptsService: GoodsReceiptsService,
    private readonly uomConversionsService: UomConversionsService,
    private readonly costAssociationService: CostAssociationService,
  ) {}

  async publish(id: string, buCurrencyCode: string): Promise<GoodsReceiptDto> {
    const receipt = await this.receiptsRepository.findByIdWithRefs(id);
    if (!receipt) throw new NotFoundException('Goods receipt not found.');
    if (receipt.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException('Only DRAFT goods receipts can be published.');
    }

    const items = await this.itemsRepository.findByReceiptIdForPublish(id);
    if (items.length === 0) throw new BadRequestException('Cannot publish a goods receipt with no items.');

    // Pre-flight: every serial-tracked line must be balanced (line_items count == quantity)
    const unbalanced = await this.linesRepository.findUnbalancedSerialLines(id);
    if (unbalanced.length > 0) {
      throw new BadRequestException(
        `Cannot publish: ${unbalanced.length} serial-tracked line(s) have a serial count mismatch.`,
      );
    }

    await this.database.runInTransaction(async () => {
      for (const item of items) {
        const lines = await this.linesRepository.findByItemId(item.id);

        // Track accepted quantity in the GR-item UOM for the PO cap check
        let acceptedInItemUom = 0;
        // Resolve each receipt lot to an inventory lot once, then reuse across its lines.
        const resolvedLotIdByGrLot = new Map<string, string>();

        for (const line of lines) {
          const lineQuantity = line.quantity; // in gr_item.uom_id
          const isSerialBearing =
            item.tracking === InventoryTrackingValues.SERIAL || item.tracking === InventoryTrackingValues.LOT_SERIAL;
          const requiresLot =
            item.tracking === InventoryTrackingValues.LOT || item.tracking === InventoryTrackingValues.LOT_SERIAL;

          if (lineQuantity <= 0 && !isSerialBearing) {
            throw new BadRequestException(`Line ${line.id} has zero quantity.`);
          }
          if (requiresLot && !line.goodsReceiptLotId) {
            throw new BadRequestException(`Line ${line.id} requires a lot for tracking=${item.tracking}.`);
          }

          const lotInfo =
            requiresLot && line.lotNumber
              ? (() => {
                  if (!line.lotExpiryDate) {
                    throw new BadRequestException(`Line ${line.id} lot is missing expiry date.`);
                  }
                  return {
                    lotNumber: line.lotNumber,
                    manufacturingDate: line.lotManufacturingDate ?? null,
                    expiryDate: line.lotExpiryDate,
                  };
                })()
              : undefined;

          const serials = isSerialBearing
            ? (await this.lineItemsRepository.findByLineId(line.id)).map((li) => li.serialNumber)
            : undefined;

          if (isSerialBearing && serials && serials.length === 0) {
            throw new BadRequestException(`Line ${line.id} has no serials.`);
          }

          // App-layer resolves the inventory lot (find-or-create) for lot/lot_serial lines, since
          // createNewQuantScoped requires a pre-resolved lotId. Cached per receipt lot.
          let resolvedLotId: string | null = null;
          if (requiresLot && line.goodsReceiptLotId && lotInfo) {
            resolvedLotId = resolvedLotIdByGrLot.get(line.goodsReceiptLotId) ?? null;
            if (!resolvedLotId) {
              const lot = await this.lotsService.findOrCreateLot({
                inventoryItemId: item.inventoryItemId,
                lotNumber: lotInfo.lotNumber,
                manufacturingDate: lotInfo.manufacturingDate,
                expiryDate: lotInfo.expiryDate,
              });
              resolvedLotId = lot.id;
              resolvedLotIdByGrLot.set(line.goodsReceiptLotId, resolvedLotId);
              await this.lotsRepository.setResolvedLotId(line.goodsReceiptLotId, resolvedLotId);
            }
          }

          // Convert the line's quantity to the inventory item's primary UOM
          const primaryUomQty = await this.uomConversionsService.toPrimaryQuantity(
            item.inventoryItemId,
            item.uomId,
            lineQuantity,
          );
          await this.linesRepository.setPrimaryUomQty(line.id, primaryUomQty);

          // Build the quant creation params per the item's tracking type
          let createParams: CreateNewQuantParams;
          const base = {
            inventoryItemId: item.inventoryItemId,
            locationId: line.locationId,
            quantity: primaryUomQty,
            costCurrency: buCurrencyCode,
            sourceType: CostSourceTypeValues.GOODS_RECEIPT,
            sourceId: receipt.id,
          };
          if (item.tracking === InventoryTrackingValues.QUANTITY) {
            createParams = { ...base, tracking: InventoryTrackingValues.QUANTITY };
          } else if (item.tracking === InventoryTrackingValues.LOT) {
            createParams = { ...base, tracking: InventoryTrackingValues.LOT, lot: lotInfo!, lotId: resolvedLotId };
          } else if (item.tracking === InventoryTrackingValues.SERIAL) {
            createParams = { ...base, tracking: InventoryTrackingValues.SERIAL, serialNumbers: serials! };
          } else {
            createParams = {
              ...base,
              tracking: InventoryTrackingValues.LOT_SERIAL,
              lot: lotInfo!,
              lotId: resolvedLotId,
              serialNumbers: serials!,
            };
          }

          const { quant } = await this.quantsService.createNewQuantScoped(createParams);
          await this.linesRepository.setResolvedQuant(line.id, quant.id);

          // Record the ledger entry in primary UOM to match the quant's UOM
          await this.ledgerService.createEntry({
            inventoryItemId: item.inventoryItemId,
            type: InventoryItemLedgerTypeValues.GOODS_RECEIPT,
            quantity: primaryUomQty,
            referenceType: InventoryItemLedgerReferenceTypeValues.GOODS_RECEIPT,
            referenceId: receipt.id,
            notes: receipt.notes ?? null,
          });

          acceptedInItemUom += lineQuantity;
        }

        // Re-check the PO cap and bump receivedQuantity on the linked PO item
        if (receipt.purchaseOrderId && item.poItemId) {
          const ordered = Number(item.poOrderedQuantity ?? 0);
          const received = Number(item.poReceivedQuantity ?? 0);
          if (this.toScaled(received + acceptedInItemUom) > this.toScaled(ordered)) {
            throw new BadRequestException(
              `Accepted quantity ${acceptedInItemUom} exceeds remaining PO quantity ${ordered - received} for item ${item.id}.`,
            );
          }
          await this.receiptsRepository.updatePoItemReceivedQty(item.poItemId, acceptedInItemUom);
        }
      }

      // Update PO status overall
      if (receipt.purchaseOrderId) {
        const totals = await this.receiptsRepository.getPoTotals(receipt.purchaseOrderId);
        if (this.toScaled(totals.receivedQuantity) >= this.toScaled(totals.uomQty) && totals.uomQty > 0) {
          await this.receiptsRepository.updatePoStatus(receipt.purchaseOrderId, PurchaseOrderStatusValues.RECEIVED);
        } else if (totals.receivedQuantity > 0) {
          await this.receiptsRepository.updatePoStatus(
            receipt.purchaseOrderId,
            PurchaseOrderStatusValues.PARTIALLY_RECEIVED,
          );
        }
      }

      await this.receiptsRepository.updateStatus(id, GoodsReceiptStatusValues.PUBLISHED, new Date());

      // Auto-create SUPPLIER_PRICE cost rows for each GR-item with a captured unit price
      await this.costAssociationService.autoAssociateSupplierPrice(
        id,
        null,
        buCurrencyCode,
        Number(receipt.exchangeRate),
      );
    });

    return this.receiptsService.findById(id);
  }

  private toScaled(value: number): number {
    return Math.round(value * 1000);
  }
}

import type { UpdateGoodsReceiptItemDto } from '@domain/goods-receipts/dto/request/update-goods-receipt-item.dto';
import type { GoodsReceiptRow } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { GoodsReceiptItemsDomainService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { InventoryItemQuantsDomainService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { InboundDeliverySourceValues } from '@/db/schema';
import type { GoodsReceiptItemQuantsWithDisplayDto } from '../dto/entity/goods-receipt-item-quants-with-display.dto';
import type { GoodsReceiptItemsCostWithDisplayDto } from '../dto/entity/goods-receipt-items-cost-with-display.dto';

@Injectable()
export class GoodsReceiptsItemsService {
  constructor(
    private readonly itemsService: GoodsReceiptItemsDomainService,
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly purchasesRepository: PurchasesDomainRepository,
    private readonly uomConversionsService: UomConversionsDomainService,
    private readonly quantsService: InventoryItemQuantsDomainService,
  ) {}

  // Changes an item's quantities on a draft receipt
  async updateItem(dto: UpdateGoodsReceiptItemDto): Promise<SuccessResponseDto> {
    const receipt = await this.goodsReceiptsService.findDraftOrThrow(dto.goodsReceiptId, 'Cannot Edit Item');
    this.assertNotReceiveWithInvoice(receipt);
    const item = await this.itemsService.findOnReceiptOrThrow(receipt.id, dto.itemId);
    return this.itemsService.updateItem(receipt, item, dto);
  }

  // Returns the provisional cost of a receipt's items, each accepted primary quantity also in the item's display unit
  async findItemsCost(goodsReceiptId: string, leCurrencyCode: string): Promise<GoodsReceiptItemsCostWithDisplayDto> {
    const cost = await this.itemsService.findItemsCost(goodsReceiptId, leCurrencyCode);
    return {
      ...cost,
      rows: cost.rows.map(({ displayUnitRatios, ...row }) => ({
        ...row,
        display: this.uomConversionsService.toDisplayUomQuantities(
          { acceptedPrimaryQty: row.acceptedPrimaryQty },
          displayUnitRatios,
        ),
      })),
    };
  }

  // Returns the quants a posted item landed in with their cost, each quantity also in the item's display unit
  async findItemQuants(itemId: string): Promise<GoodsReceiptItemQuantsWithDisplayDto> {
    const quants = await this.quantsService.findCostsByGrItemId(itemId);
    return {
      ...quants,
      rows: quants.rows.map(({ displayUnitRatios, ...row }) => ({
        ...row,
        display: this.uomConversionsService.toDisplayUomQuantities({ quantity: row.quantity }, displayUnitRatios),
      })),
    };
  }

  // Removes an item from a draft receipt
  async removeItem(goodsReceiptId: string, itemId: string): Promise<SuccessResponseDto> {
    const receipt = await this.goodsReceiptsService.findDraftOrThrow(goodsReceiptId, 'Cannot Remove Item');
    this.assertNotReceiveWithInvoice(receipt);
    const item = await this.itemsService.findOnReceiptOrThrow(receipt.id, itemId);
    return this.itemsService.removeItem(receipt, item);
  }

  // Rejects a change to a Receive with Invoice receipt, which is edited with its supplier invoice (409)
  private assertNotReceiveWithInvoice(receipt: GoodsReceiptRow): void {
    if (receipt.deliverySource !== InboundDeliverySourceValues.SUPPLIER_INVOICE) return;
    this.purchasesRepository.assertNotPartOfPurchase(`Goods receipt "${receipt.grNumber}"`, [receipt.purchaseNumber]);
  }
}

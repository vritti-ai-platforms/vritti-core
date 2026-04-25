import { PurchaseOrderItemsRepository } from '@domain/purchase-orders/repositories/purchase-order-items.repository';
import { Injectable } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { GoodsReceiptStatusValues, goodsReceiptItems, inventoryItems } from '@/db/schema';
import { GoodsReceiptItemDto } from '../dto/entity/goods-receipt-item.dto';
import { GoodsReceiptBatchesRepository } from '../repositories/goods-receipt-batches.repository';
import { GoodsReceiptItemsRepository } from '../repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from '../repositories/goods-receipts.repository';

@Injectable()
export class GoodsReceiptItemsService {
  private static readonly FIELD_MAP: FieldMap = {
    inventoryItemName: { column: inventoryItems.name, type: 'string' },
    acceptedQuantity: { column: goodsReceiptItems.acceptedQuantity, type: 'number' },
    rejectedQuantity: { column: goodsReceiptItems.rejectedQuantity, type: 'number' },
  };

  constructor(
    private readonly receiptsRepository: GoodsReceiptsRepository,
    private readonly itemsRepository: GoodsReceiptItemsRepository,
    private readonly batchesRepository: GoodsReceiptBatchesRepository,
    private readonly poItemsRepository: PurchaseOrderItemsRepository,
  ) {}

  // Find all inventory item IDs for a goods receipt
  async findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    await this.ensureReceiptExists(goodsReceiptId);
    return this.itemsRepository.findInventoryItemIds(goodsReceiptId);
  }

  // Find all items for a goods receipt
  async findByGoodsReceiptId(goodsReceiptId: string): Promise<GoodsReceiptItemDto[]> {
    await this.ensureReceiptExists(goodsReceiptId);
    const rows = await this.itemsRepository.findByReceiptId(goodsReceiptId);
    return rows.map((row) => GoodsReceiptItemDto.from(row));
  }

  // Find items for table view with filtering, search, and pagination
  async findForTable(
    goodsReceiptId: string,
    state: TableViewState,
  ): Promise<{ result: GoodsReceiptItemDto[]; count: number }> {
    await this.ensureReceiptExists(goodsReceiptId);

    const filterWhere = FilterProcessor.buildWhere(state.filters, GoodsReceiptItemsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, GoodsReceiptItemsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.itemsRepository.findForTable(goodsReceiptId, {
      where,
      orderBy: FilterProcessor.buildOrderBy(state.sort, GoodsReceiptItemsService.FIELD_MAP),
      limit,
      offset,
    });

    return { result: result.map((row) => GoodsReceiptItemDto.from(row)), count };
  }

  // Find a single item by receipt ID and item ID
  async findById(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemDto> {
    await this.ensureReceiptExists(goodsReceiptId);
    const item = await this.itemsRepository.findByReceiptIdAndItemId(goodsReceiptId, itemId);
    if (!item) throw new NotFoundException('Goods receipt item not found.');

    const rows = await this.itemsRepository.findByReceiptId(goodsReceiptId);
    const enriched = rows.find((row) => row.id === item.id);
    if (!enriched) throw new NotFoundException('Goods receipt item not found.');
    return GoodsReceiptItemDto.from(enriched);
  }

  // Add an item to a goods receipt
  async addItem(
    goodsReceiptId: string,
    data: { inventoryItemId: string; acceptedQuantity: number; rejectedQuantity?: number },
  ): Promise<CreateResponseDto<GoodsReceiptItemDto>> {
    const receipt = await this.ensureEditableReceipt(goodsReceiptId);
    if (receipt.purchaseOrderId) {
      const poItem = await this.poItemsRepository.findItemByInventoryItemId(receipt.purchaseOrderId, data.inventoryItemId);
      if (!poItem) {
        throw new BadRequestException('Inventory item is not part of the linked purchase order.');
      }
    }

    this.validateQuantities(data.acceptedQuantity, data.rejectedQuantity ?? 0);

    const entity = await this.itemsRepository.create({
      goodsReceiptId,
      inventoryItemId: data.inventoryItemId,
      acceptedQuantity: String(data.acceptedQuantity),
      rejectedQuantity: String(data.rejectedQuantity ?? 0),
    });

    const dto = await this.findById(goodsReceiptId, entity.id);
    return {
      success: true,
      message: `Item added to goods receipt "${receipt.grNumber}".`,
      data: dto,
    };
  }

  // Update an existing item on a goods receipt
  async updateItem(
    goodsReceiptId: string,
    itemId: string,
    data: { inventoryItemId?: string; acceptedQuantity?: number; rejectedQuantity?: number },
  ): Promise<SuccessResponseDto> {
    const receipt = await this.ensureEditableReceipt(goodsReceiptId);
    const item = await this.itemsRepository.findByReceiptIdAndItemId(goodsReceiptId, itemId);
    if (!item) throw new NotFoundException('Goods receipt item not found.');

    if (data.inventoryItemId !== undefined && receipt.purchaseOrderId) {
      const poItem = await this.poItemsRepository.findItemByInventoryItemId(receipt.purchaseOrderId, data.inventoryItemId);
      if (!poItem) {
        throw new BadRequestException('Inventory item is not part of the linked purchase order.');
      }
    }

    if (data.acceptedQuantity !== undefined || data.rejectedQuantity !== undefined) {
      const acceptedQuantity = data.acceptedQuantity ?? Number(item.acceptedQuantity);
      const rejectedQuantity = data.rejectedQuantity ?? Number(item.rejectedQuantity);
      this.validateQuantities(acceptedQuantity, rejectedQuantity);
    }

    await this.itemsRepository.update(item.id, {
      inventoryItemId: data.inventoryItemId,
      acceptedQuantity: data.acceptedQuantity === undefined ? undefined : String(data.acceptedQuantity),
      rejectedQuantity: data.rejectedQuantity === undefined ? undefined : String(data.rejectedQuantity),
    });
    return { success: true, message: 'Item updated.' };
  }

  // Remove an item from a goods receipt
  async removeItem(goodsReceiptId: string, itemId: string): Promise<SuccessResponseDto> {
    const receipt = await this.ensureEditableReceipt(goodsReceiptId);
    const item = await this.itemsRepository.findByReceiptIdAndItemId(goodsReceiptId, itemId);
    if (!item) throw new NotFoundException('Goods receipt item not found.');
    await this.itemsRepository.delete(item.id);
    return { success: true, message: `Item removed from goods receipt "${receipt.grNumber}".` };
  }

  // Get the accepted total quantity for a specific item
  async getAcceptedTotalForItem(itemId: string): Promise<number> {
    const item = await this.itemsRepository.findItemById(itemId);
    return Number(item?.acceptedQuantity ?? 0);
  }

  private validateQuantities(acceptedQuantity: number, rejectedQuantity: number) {
    if (!Number.isFinite(acceptedQuantity) || acceptedQuantity < 0) {
      throw new BadRequestException('acceptedQuantity must be greater than or equal to 0.');
    }
    if (!Number.isFinite(rejectedQuantity) || rejectedQuantity < 0) {
      throw new BadRequestException('rejectedQuantity must be greater than or equal to 0.');
    }
    if (acceptedQuantity <= 0 && rejectedQuantity <= 0) {
      throw new BadRequestException('At least one of acceptedQuantity or rejectedQuantity must be greater than 0.');
    }
  }

  private async ensureReceiptExists(goodsReceiptId: string) {
    const receipt = await this.receiptsRepository.findById(goodsReceiptId);
    if (!receipt) throw new NotFoundException('Goods receipt not found.');
    return receipt;
  }

  private async ensureEditableReceipt(goodsReceiptId: string) {
    const receipt = await this.ensureReceiptExists(goodsReceiptId);
    if (receipt.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException('Items can only be modified on DRAFT goods receipts.');
    }
    return receipt;
  }
}

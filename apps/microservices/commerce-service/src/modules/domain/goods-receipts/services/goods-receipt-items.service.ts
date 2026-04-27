import { PurchaseOrderItemsRepository } from '@domain/purchase-orders/repositories/purchase-order-items.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { GoodsReceiptStatusValues, goodsReceiptItems, inventoryItems } from '@/db/schema';
import { GoodsReceiptItemDto } from '../dto/entity/goods-receipt-item.dto';
import { GoodsReceiptItemsRepository } from '../repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from '../repositories/goods-receipts.repository';

@Injectable()
export class GoodsReceiptItemsService {
  private readonly logger = new Logger(GoodsReceiptItemsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    inventoryItemName: { column: inventoryItems.name, type: 'string' },
    rejectedQuantity: { column: goodsReceiptItems.rejectedQuantity, type: 'number' },
  };

  constructor(
    private readonly receiptsRepository: GoodsReceiptsRepository,
    private readonly itemsRepository: GoodsReceiptItemsRepository,
    private readonly poItemsRepository: PurchaseOrderItemsRepository,
  ) {}

  async findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    await this.ensureReceiptExists(goodsReceiptId);
    return this.itemsRepository.findInventoryItemIds(goodsReceiptId);
  }

  async findByGoodsReceiptId(goodsReceiptId: string): Promise<GoodsReceiptItemDto[]> {
    await this.ensureReceiptExists(goodsReceiptId);
    const rows = await this.itemsRepository.findByReceiptId(goodsReceiptId);
    return rows.map(GoodsReceiptItemDto.from);
  }

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

    return { result: result.map(GoodsReceiptItemDto.from), count };
  }

  async findById(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemDto> {
    await this.ensureReceiptExists(goodsReceiptId);
    const row = await this.itemsRepository.findByReceiptIdAndItemIdWithRefs(goodsReceiptId, itemId);
    if (!row) throw new NotFoundException('Goods receipt item not found.');
    return GoodsReceiptItemDto.from(row);
  }

  // Add an item to a goods receipt. acceptedQuantity is derived from sum(lines.quantity).
  async addItem(
    goodsReceiptId: string,
    data: { inventoryItemId: string; rejectedQuantity?: number },
  ): Promise<CreateResponseDto<GoodsReceiptItemDto>> {
    const receipt = await this.ensureEditableReceipt(goodsReceiptId);
    if (receipt.purchaseOrderId) {
      const poItem = await this.poItemsRepository.findItemByInventoryItemId(receipt.purchaseOrderId, data.inventoryItemId);
      if (!poItem) {
        throw new BadRequestException('Inventory item is not part of the linked purchase order.');
      }
    }

    // Reject duplicate (DB also enforces unique constraint, but produce a clean error)
    const existing = await this.itemsRepository.findByReceiptAndInventoryItem(goodsReceiptId, data.inventoryItemId);
    if (existing) {
      throw new ValidationException({
        detail: 'This inventory item is already on the goods receipt.',
        errors: [{ field: 'inventoryItemId', message: 'Already added to this goods receipt.' }],
      });
    }

    if (data.rejectedQuantity !== undefined) {
      this.validateRejectedQuantity(data.rejectedQuantity);
    }

    const entity = await this.itemsRepository.create({
      goodsReceiptId,
      inventoryItemId: data.inventoryItemId,
      rejectedQuantity: String(data.rejectedQuantity ?? 0),
    });

    this.logger.log(`Added item ${entity.id} to goods receipt ${goodsReceiptId}`);
    const dto = await this.findById(goodsReceiptId, entity.id);
    return {
      success: true,
      message: `Item added to goods receipt "${receipt.grNumber}".`,
      data: dto,
    };
  }

  // Update an existing item (only rejectedQuantity is editable; inventoryItemId is set-once).
  async updateItem(
    goodsReceiptId: string,
    itemId: string,
    data: { rejectedQuantity?: number },
  ): Promise<SuccessResponseDto> {
    await this.ensureEditableReceipt(goodsReceiptId);
    const item = await this.itemsRepository.findByReceiptIdAndItemId(goodsReceiptId, itemId);
    if (!item) throw new NotFoundException('Goods receipt item not found.');

    if (data.rejectedQuantity !== undefined) {
      this.validateRejectedQuantity(data.rejectedQuantity);
    }

    await this.itemsRepository.update(item.id, {
      rejectedQuantity: data.rejectedQuantity === undefined ? undefined : String(data.rejectedQuantity),
    });
    return { success: true, message: 'Item updated.' };
  }

  async removeItem(goodsReceiptId: string, itemId: string): Promise<SuccessResponseDto> {
    const receipt = await this.ensureEditableReceipt(goodsReceiptId);
    const item = await this.itemsRepository.findByReceiptIdAndItemId(goodsReceiptId, itemId);
    if (!item) throw new NotFoundException('Goods receipt item not found.');
    await this.itemsRepository.delete(item.id);
    return { success: true, message: `Item removed from goods receipt "${receipt.grNumber}".` };
  }

  private validateRejectedQuantity(rejectedQuantity: number) {
    if (!Number.isFinite(rejectedQuantity) || rejectedQuantity < 0) {
      throw new BadRequestException('rejectedQuantity must be greater than or equal to 0.');
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

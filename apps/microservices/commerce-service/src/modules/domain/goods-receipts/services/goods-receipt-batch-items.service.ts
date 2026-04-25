import { Injectable } from '@nestjs/common';
import { BadRequestException, type CreateResponseDto, NotFoundException, type SuccessResponseDto } from '@vritti/api-sdk';
import { GoodsReceiptStatusValues } from '@/db/schema';
import { GoodsReceiptBatchItemDto } from '../dto/entity/goods-receipt-batch-item.dto';
import { GoodsReceiptBatchItemsRepository } from '../repositories/goods-receipt-batch-items.repository';
import { GoodsReceiptBatchesRepository } from '../repositories/goods-receipt-batches.repository';
import { GoodsReceiptItemsRepository } from '../repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from '../repositories/goods-receipts.repository';

@Injectable()
export class GoodsReceiptBatchItemsService {
  constructor(
    private readonly receiptsRepository: GoodsReceiptsRepository,
    private readonly itemsRepository: GoodsReceiptItemsRepository,
    private readonly batchesRepository: GoodsReceiptBatchesRepository,
    private readonly batchItemsRepository: GoodsReceiptBatchItemsRepository,
  ) {}

  async listByBatch(goodsReceiptId: string, lineId: string, batchId: string): Promise<GoodsReceiptBatchItemDto[]> {
    await this.ensureBatchContext(goodsReceiptId, lineId, batchId);
    const rows = await this.batchItemsRepository.findByBatchId(batchId);
    return rows.map((row) => GoodsReceiptBatchItemDto.from(row));
  }

  async addItem(
    goodsReceiptId: string,
    lineId: string,
    batchId: string,
    data: { quantity: number },
  ): Promise<CreateResponseDto<GoodsReceiptBatchItemDto>> {
    await this.ensureEditableBatch(goodsReceiptId, lineId, batchId);
    this.validateQuantity(data.quantity);
    const entity = await this.batchItemsRepository.create({ goodsReceiptBatchId: batchId, quantity: String(data.quantity) });
    await this.batchesRepository.refreshIsBalanced(batchId);
    return {
      success: true,
      message: 'Batch item added.',
      data: GoodsReceiptBatchItemDto.from(entity),
    };
  }

  async updateItem(
    goodsReceiptId: string,
    lineId: string,
    batchId: string,
    itemId: string,
    data: { quantity: number },
  ): Promise<SuccessResponseDto> {
    await this.ensureEditableBatch(goodsReceiptId, lineId, batchId);
    this.validateQuantity(data.quantity);
    const existing = await this.batchItemsRepository.findByBatchIdAndItemId(batchId, itemId);
    if (!existing) throw new NotFoundException('Goods receipt batch item not found.');
    await this.batchItemsRepository.update(existing.id, { quantity: String(data.quantity) });
    await this.batchesRepository.refreshIsBalanced(batchId);
    return { success: true, message: 'Batch item updated.' };
  }

  async removeItem(goodsReceiptId: string, lineId: string, batchId: string, itemId: string): Promise<SuccessResponseDto> {
    await this.ensureEditableBatch(goodsReceiptId, lineId, batchId);
    const existing = await this.batchItemsRepository.findByBatchIdAndItemId(batchId, itemId);
    if (!existing) throw new NotFoundException('Goods receipt batch item not found.');
    await this.batchItemsRepository.delete(existing.id);
    await this.batchesRepository.refreshIsBalanced(batchId);
    return { success: true, message: `Batch item "${itemId}" removed successfully.` };
  }

  private validateQuantity(quantity: number) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('quantity must be greater than 0.');
    }
  }

  private async ensureBatchContext(goodsReceiptId: string, lineId: string, batchId: string) {
    const line = await this.itemsRepository.findByReceiptIdAndItemId(goodsReceiptId, lineId);
    if (!line) throw new NotFoundException('Goods receipt line not found.');
    const batch = await this.batchesRepository.findByLineIdAndBatchId(lineId, batchId);
    if (!batch) throw new NotFoundException('Goods receipt batch not found.');
    return batch;
  }

  private async ensureEditableBatch(goodsReceiptId: string, lineId: string, batchId: string) {
    const receipt = await this.receiptsRepository.findById(goodsReceiptId);
    if (!receipt) throw new NotFoundException('Goods receipt not found.');
    if (receipt.status !== GoodsReceiptStatusValues.ALLOCATION_PENDING) {
      throw new BadRequestException('Batch items can only be modified on ALLOCATION_PENDING goods receipts.');
    }
    return this.ensureBatchContext(goodsReceiptId, lineId, batchId);
  }
}

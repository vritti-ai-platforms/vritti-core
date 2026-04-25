import { Injectable } from '@nestjs/common';
import { BadRequestException, type CreateResponseDto, NotFoundException, type SuccessResponseDto } from '@vritti/api-sdk';
import { GoodsReceiptStatusValues } from '@/db/schema';
import { GoodsReceiptBatchDto } from '../dto/entity/goods-receipt-batch.dto';
import { GoodsReceiptBatchItemsRepository } from '../repositories/goods-receipt-batch-items.repository';
import { GoodsReceiptBatchesRepository } from '../repositories/goods-receipt-batches.repository';
import { GoodsReceiptItemsRepository } from '../repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from '../repositories/goods-receipts.repository';

@Injectable()
export class GoodsReceiptBatchesService {
  constructor(
    private readonly receiptsRepository: GoodsReceiptsRepository,
    private readonly itemsRepository: GoodsReceiptItemsRepository,
    private readonly batchesRepository: GoodsReceiptBatchesRepository,
    private readonly batchItemsRepository: GoodsReceiptBatchItemsRepository,
  ) {}

  async findByLine(goodsReceiptId: string, lineId: string): Promise<GoodsReceiptBatchDto[]> {
    await this.ensureLineForReceipt(goodsReceiptId, lineId);
    const batches = await this.batchesRepository.findByLineId(lineId);
    const stats = await this.batchesRepository.findStatsByBatchIds(batches.map((batch) => batch.id));
    return batches.map((batch) => {
      const stat = stats.get(batch.id);
      const accepted = Number(batch.acceptedQuantity);
      const sum = Number(stat?.batchItemsQuantitySum ?? 0);
      return GoodsReceiptBatchDto.from({
        ...batch,
        batchItemsCount: Number(stat?.batchItemsCount ?? 0),
        batchItemsQuantitySum: sum,
        batchItemsDelta: Number((accepted - sum).toFixed(3)),
      });
    });
  }

  async findById(goodsReceiptId: string, lineId: string, batchId: string): Promise<GoodsReceiptBatchDto> {
    await this.ensureLineForReceipt(goodsReceiptId, lineId);
    const batch = await this.batchesRepository.findByLineIdAndBatchId(lineId, batchId);
    if (!batch) throw new NotFoundException('Goods receipt batch not found.');
    const batches = await this.findByLine(goodsReceiptId, lineId);
    const matched = batches.find((row) => row.id === batch.id);
    if (!matched) throw new NotFoundException('Goods receipt batch not found.');
    return matched;
  }

  async addBatch(
    goodsReceiptId: string,
    lineId: string,
    data: {
      inventoryItemId: string;
      locationId: string;
      acceptedQuantity: number;
      rejectedQuantity?: number;
      rejectionReason?: string;
      manufacturingDate?: string;
      expiryDate?: string;
    },
  ): Promise<CreateResponseDto<GoodsReceiptBatchDto>> {
    const { receipt, line } = await this.ensureEditableLine(goodsReceiptId, lineId);
    this.validateQuantities(data.acceptedQuantity, data.rejectedQuantity ?? 0);
    this.validateInventoryItemForLine(line.inventoryItemId, data.inventoryItemId);

    const entity = await this.batchesRepository.create({
      goodsReceiptLineId: line.id,
      inventoryItemId: data.inventoryItemId,
      locationId: data.locationId,
      acceptedQuantity: String(data.acceptedQuantity),
      rejectedQuantity: String(data.rejectedQuantity ?? 0),
      rejectionReason: data.rejectionReason ?? null,
      manufacturingDate: data.manufacturingDate ?? null,
      expiryDate: data.expiryDate ?? null,
    });
    await this.batchesRepository.refreshIsBalanced(entity.id);
    const dto = await this.findById(goodsReceiptId, lineId, entity.id);
    return {
      success: true,
      message: `Batch added to goods receipt "${receipt.grNumber}".`,
      data: dto,
    };
  }

  async updateBatch(
    goodsReceiptId: string,
    lineId: string,
    batchId: string,
    data: {
      inventoryItemId?: string;
      locationId?: string;
      acceptedQuantity?: number;
      rejectedQuantity?: number;
      rejectionReason?: string | null;
      manufacturingDate?: string | null;
      expiryDate?: string | null;
    },
  ): Promise<SuccessResponseDto> {
    const { line } = await this.ensureEditableLine(goodsReceiptId, lineId);
    const batch = await this.batchesRepository.findByLineIdAndBatchId(lineId, batchId);
    if (!batch) throw new NotFoundException('Goods receipt batch not found.');

    const acceptedQuantity = data.acceptedQuantity ?? Number(batch.acceptedQuantity);
    const rejectedQuantity = data.rejectedQuantity ?? Number(batch.rejectedQuantity);
    this.validateQuantities(acceptedQuantity, rejectedQuantity);

    const inventoryItemId = data.inventoryItemId ?? batch.inventoryItemId;
    this.validateInventoryItemForLine(line.inventoryItemId, inventoryItemId);

    await this.batchesRepository.update(batch.id, {
      inventoryItemId,
      locationId: data.locationId,
      acceptedQuantity: data.acceptedQuantity !== undefined ? String(data.acceptedQuantity) : undefined,
      rejectedQuantity: data.rejectedQuantity !== undefined ? String(data.rejectedQuantity) : undefined,
      rejectionReason: data.rejectionReason === undefined ? undefined : data.rejectionReason,
      manufacturingDate: data.manufacturingDate === undefined ? undefined : data.manufacturingDate,
      expiryDate: data.expiryDate === undefined ? undefined : data.expiryDate,
    });
    await this.batchesRepository.refreshIsBalanced(batch.id);
    return { success: true, message: 'Batch updated.' };
  }

  async removeBatch(goodsReceiptId: string, lineId: string, batchId: string): Promise<SuccessResponseDto> {
    const { receipt } = await this.ensureEditableLine(goodsReceiptId, lineId);
    const batch = await this.batchesRepository.findByLineIdAndBatchId(lineId, batchId);
    if (!batch) throw new NotFoundException('Goods receipt batch not found.');
    await this.batchesRepository.delete(batch.id);
    return { success: true, message: `Batch removed from goods receipt "${receipt.grNumber}".` };
  }

  private validateQuantities(acceptedQuantity: number, rejectedQuantity: number) {
    if (!Number.isFinite(acceptedQuantity) || acceptedQuantity <= 0) {
      throw new BadRequestException('acceptedQuantity must be greater than 0.');
    }
    if (!Number.isFinite(rejectedQuantity) || rejectedQuantity < 0) {
      throw new BadRequestException('rejectedQuantity must be greater than or equal to 0.');
    }
  }

  private validateInventoryItemForLine(lineInventoryItemId: string, inventoryItemId: string): void {
    if (lineInventoryItemId !== inventoryItemId) {
      throw new BadRequestException('Batch inventory item must match the line inventory item.');
    }
  }

  private async ensureLineForReceipt(goodsReceiptId: string, lineId: string) {
    const line = await this.itemsRepository.findByReceiptIdAndItemId(goodsReceiptId, lineId);
    if (!line) throw new NotFoundException('Goods receipt line not found.');
    return line;
  }

  private async ensureEditableLine(goodsReceiptId: string, lineId: string) {
    const receipt = await this.receiptsRepository.findById(goodsReceiptId);
    if (!receipt) throw new NotFoundException('Goods receipt not found.');
    if (receipt.status !== GoodsReceiptStatusValues.ALLOCATION_PENDING) {
      throw new BadRequestException('Batches can only be modified on ALLOCATION_PENDING goods receipts.');
    }
    const line = await this.ensureLineForReceipt(goodsReceiptId, lineId);
    return { receipt, line };
  }
}

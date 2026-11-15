import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CurrencyAmountDto, type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type InventoryTracking, InventoryTrackingValues } from '@/db/schema';
import { GoodsReceiptLotDto } from '../dto/entity/goods-receipt-lot.dto';
import type { AddGoodsReceiptLotDto } from '../dto/request/add-goods-receipt-lot.dto';
import type { UpdateGoodsReceiptLotDto } from '../dto/request/update-goods-receipt-lot.dto';
import {
  type GoodsReceiptLotRow,
  GoodsReceiptLotsDomainRepository,
} from '../repositories/goods-receipt-lots.repository';

export interface GoodsReceiptLotItem {
  id: string;
  siteId: string;
  tracking: InventoryTracking;
}

@Injectable()
export class GoodsReceiptLotsDomainService {
  private readonly logger = new Logger(GoodsReceiptLotsDomainService.name);

  private static readonly LOT_TRACKINGS: InventoryTracking[] = [
    InventoryTrackingValues.LOT,
    InventoryTrackingValues.LOT_SERIAL,
  ];

  constructor(private readonly repository: GoodsReceiptLotsDomainRepository) {}

  // Adds a lot to a lot-tracked item of a draft receipt; its MRP is printed in the legal entity's currency
  async addLot(
    item: GoodsReceiptLotItem,
    dto: AddGoodsReceiptLotDto,
    leCurrencyCode: string,
  ): Promise<CreateResponseDto<GoodsReceiptLotDto>> {
    this.assertLotTracked(item);
    await this.assertLotNumberFree(item.id, dto.lotNumber);
    this.assertMrpInCurrency(dto.mrp, leCurrencyCode);

    const created = await this.repository.create({
      goodsReceiptItemId: item.id,
      siteId: item.siteId,
      lotNumber: dto.lotNumber,
      manufacturingDate: dto.manufacturingDate ?? null,
      expiryDate: dto.expiryDate,
      mrp: dto.mrp ? majorToMinor(dto.mrp.value, dto.mrp.currency as CurrencyCode, 'mrp') : null,
    });

    this.logger.log(`Added lot ${dto.lotNumber} to goods receipt item ${item.id}`);
    return {
      success: true,
      message: `Lot "${dto.lotNumber}" added successfully.`,
      data: GoodsReceiptLotDto.from(await this.findOnItemOrThrow(item.id, created.id), leCurrencyCode),
    };
  }

  // Changes a lot's number, dates or MRP on a draft receipt
  async updateLot(
    item: GoodsReceiptLotItem,
    dto: UpdateGoodsReceiptLotDto,
    leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    const lot = await this.findOnItemOrThrow(item.id, dto.lotId);
    if (dto.lotNumber !== undefined && dto.lotNumber !== lot.lotNumber) {
      await this.assertLotNumberFree(item.id, dto.lotNumber, lot.id);
    }
    this.assertMrpInCurrency(dto.mrp, leCurrencyCode);

    await this.repository.update(lot.id, {
      lotNumber: dto.lotNumber,
      manufacturingDate: dto.manufacturingDate,
      expiryDate: dto.expiryDate,
      mrp: dto.mrp ? majorToMinor(dto.mrp.value, dto.mrp.currency as CurrencyCode, 'mrp') : dto.mrp,
    });
    this.logger.log(`Updated lot ${lot.id} on goods receipt item ${item.id}`);
    return { success: true, message: `Lot "${dto.lotNumber ?? lot.lotNumber}" updated successfully.` };
  }

  // Links a receipt lot to the inventory lot it landed in, in the caller's transaction
  async linkInventoryLot(lotId: string, inventoryLotId: string): Promise<void> {
    await this.repository.update(lotId, { resolvedLotId: inventoryLotId });
  }

  // Returns the lots of a receipt item, their MRP in the legal entity's currency
  async findByItem(itemId: string, leCurrencyCode: string): Promise<GoodsReceiptLotDto[]> {
    const lots = await this.repository.findByItemId(itemId);
    return lots.map((lot) => GoodsReceiptLotDto.from(lot, leCurrencyCode));
  }

  // Returns the lots of a receipt item with how much of it their lines hold, for landing them in stock
  findLotsOfItem(itemId: string): Promise<GoodsReceiptLotRow[]> {
    return this.repository.findByItemId(itemId);
  }

  // Removes a lot, with the lines it is distributed to, from a draft receipt
  async removeLot(item: GoodsReceiptLotItem, lotId: string): Promise<SuccessResponseDto> {
    const lot = await this.findOnItemOrThrow(item.id, lotId);
    await this.repository.delete(lot.id);
    this.logger.log(`Removed lot ${lot.lotNumber} from goods receipt item ${item.id}`);
    return { success: true, message: `Lot "${lot.lotNumber}" removed successfully.` };
  }

  // Loads a lot of the given receipt item, throwing when it is not on it
  private async findOnItemOrThrow(itemId: string, lotId: string): Promise<GoodsReceiptLotRow> {
    const lot = await this.repository.findOnItem(itemId, lotId);
    if (!lot) throw new NotFoundException('Goods receipt lot not found.');
    return lot;
  }

  // Rejects lots on an item that is not tracked by lot
  private assertLotTracked(item: { tracking: InventoryTracking }): void {
    if (GoodsReceiptLotsDomainService.LOT_TRACKINGS.includes(item.tracking)) return;
    throw new BadRequestException({
      label: 'Lots Not Tracked',
      detail: `This item is tracked by ${item.tracking.toLowerCase()}, so it has no lots.`,
    });
  }

  // Rejects a lot number another lot of the same receipt item already uses
  private async assertLotNumberFree(itemId: string, lotNumber: string, excludeLotId?: string): Promise<void> {
    const isTaken = await this.repository.isLotNumberTaken(itemId, lotNumber, excludeLotId);
    if (!isTaken) return;
    throw new ConflictException({
      label: 'Lot Already Added',
      detail: `Lot "${lotNumber}" is already on this item. Edit that lot instead.`,
      errors: [{ field: 'lotNumber', message: 'Already on this item' }],
    });
  }

  // Rejects an MRP printed in another currency than the legal entity's
  private assertMrpInCurrency(mrp: CurrencyAmountDto | null | undefined, leCurrencyCode: string): void {
    if (!mrp || mrp.currency === leCurrencyCode) return;
    throw new BadRequestException({
      label: 'MRP Currency',
      detail: `The MRP is printed in ${leCurrencyCode}, the company's currency.`,
      errors: [{ field: 'mrp', message: `Enter it in ${leCurrencyCode}` }],
    });
  }
}

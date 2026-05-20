import type { PurchaseOrderItemDto } from '@domain/purchase-order-items/dto/entity/purchase-order-item.dto';
import { PurchaseOrderItemsService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrderDto as PurchaseOrderDtoClass } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrdersRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { SupplierItemsRepository } from '@domain/supplier-items/repositories/supplier-items.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  NotFoundException,
  PrimaryDatabaseService,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import type { AddPurchaseOrderItemDto } from '@/modules/purchase-orders/dto/request/add-purchase-order-item.dto';
import type { UpdatePurchaseOrderItemDto } from '@/modules/purchase-orders/dto/request/update-purchase-order-item.dto';

@Injectable()
export class PurchaseOrdersItemsService {
  private readonly logger = new Logger(PurchaseOrdersItemsService.name);

  constructor(
    private readonly itemsService: PurchaseOrderItemsService,
    private readonly repository: PurchaseOrdersRepository,
    private readonly supplierItemsRepository: SupplierItemsRepository,
    private readonly database: PrimaryDatabaseService,
  ) {}

  async findItems(poId: string): Promise<PurchaseOrderItemDto[]> {
    const po = await this.getPurchaseOrderContext(poId);
    return this.itemsService.findByPoId(poId, po.currencyCode, po.supplierCurrencyCode);
  }

  async findItemIds(poId: string): Promise<string[]> {
    const po = await this.repository.findByIdWithSupplierName(poId);
    if (!po) throw new NotFoundException('Purchase order not found.');
    return this.itemsService.findIdsByPoId(poId);
  }

  async findItemsForTable(
    poId: string,
    state: TableViewState,
  ): Promise<{ result: PurchaseOrderItemDto[]; count: number }> {
    const po = await this.getPurchaseOrderContext(poId);
    return this.itemsService.findForTable(poId, state, po.currencyCode, po.supplierCurrencyCode);
  }

  async addItem(poId: string, data: AddPurchaseOrderItemDto): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const po = await this.getPurchaseOrderContext(poId);

    const supplierItem = await this.supplierItemsRepository.findItemBySupplierAndInventoryItem(
      po.supplierId,
      data.inventoryItemId,
    );
    if (!supplierItem) {
      throw new BadRequestException({
        label: 'Item Not Linked',
        detail: 'This inventory item is not linked to the purchase order supplier.',
      });
    }

    await this.database.runInTransaction(async () => {
      await this.itemsService.addItem(po, data, supplierItem.uomId);
      await this.repository.syncTotalAmount(poId);
    });

    this.logger.log(`Added PO item: ${po.poNumber} (${poId})`);
    return {
      success: true,
      message: `Line item added to purchase order "${po.poNumber}".`,
      data: PurchaseOrderDtoClass.from(po, po.supplierName, po.supplierCurrencyCode),
    };
  }

  async updateItem(poId: string, itemId: string, data: UpdatePurchaseOrderItemDto): Promise<SuccessResponseDto> {
    const po = await this.getPurchaseOrderContext(poId);

    await this.database.runInTransaction(async () => {
      await this.itemsService.updateItem(po, itemId, data);
      await this.repository.syncTotalAmount(poId);
    });

    this.logger.log(`Updated PO item: ${po.poNumber} (${itemId})`);
    return { success: true, message: `Line item updated for purchase order "${po.poNumber}".` };
  }

  async removeItem(poId: string, itemId: string): Promise<SuccessResponseDto> {
    const po = await this.getPurchaseOrderContext(poId);

    await this.database.runInTransaction(async () => {
      await this.itemsService.removeItem(po, itemId);
      await this.repository.syncTotalAmount(poId);
    });

    this.logger.log(`Removed PO item: ${po.poNumber} (${itemId})`);
    return { success: true, message: `Line item removed from purchase order "${po.poNumber}".` };
  }

  private async getPurchaseOrderContext(poId: string) {
    const po = await this.repository.findByIdWithSupplierName(poId);
    if (!po) throw new NotFoundException('Purchase order not found.');
    return po;
  }
}

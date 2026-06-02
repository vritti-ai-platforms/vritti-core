import { GoodsReceiptsService } from '@domain/goods-receipts/services/goods-receipts.service';
import type { PurchaseOrderItemDto } from '@domain/purchase-order-items/dto/entity/purchase-order-item.dto';
import { PurchaseOrderItemsRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import { PurchaseOrderItemsService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrderDto as PurchaseOrderDtoClass } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrdersRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { SupplierItemsRepository } from '@domain/supplier-items/repositories/supplier-items.repository';
import { UomConversionsService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  NotFoundException,
  PrimaryDatabaseService,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import type { AddPurchaseOrderItemDto } from '@/modules/purchase-orders/dto/request/add-purchase-order-item.dto';
import type { UpdatePurchaseOrderItemDto } from '@/modules/purchase-orders/dto/request/update-purchase-order-item.dto';

@Injectable()
export class PurchaseOrdersItemsService {
  private readonly logger = new Logger(PurchaseOrdersItemsService.name);

  constructor(
    private readonly itemsService: PurchaseOrderItemsService,
    private readonly itemsRepository: PurchaseOrderItemsRepository,
    private readonly repository: PurchaseOrdersRepository,
    private readonly supplierItemsRepository: SupplierItemsRepository,
    private readonly uomConversionsService: UomConversionsService,
    private readonly database: PrimaryDatabaseService,
    private readonly goodsReceiptsService: GoodsReceiptsService,
  ) {}

  async findItems(poId: string): Promise<PurchaseOrderItemDto[]> {
    await this.getPurchaseOrderContext(poId);
    return this.itemsService.findByPoId(poId);
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
    await this.getPurchaseOrderContext(poId);
    return this.itemsService.findForTable(poId, state);
  }

  async addItem(poId: string, data: AddPurchaseOrderItemDto): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const po = await this.getPurchaseOrderContext(poId);
    await this.assertNoGoodsReceipt(poId);

    const supplierItem = await this.supplierItemsRepository.findById(data.supplierItemId);
    if (!supplierItem) {
      throw new ValidationException({
        detail: 'Supplier item not found.',
        errors: [{ field: 'supplierItemId', message: 'Supplier item not found.' }],
      });
    }

    if (supplierItem.supplierId !== po.supplierId) {
      throw new ValidationException({
        detail: 'This supplier item does not belong to the purchase order supplier.',
        errors: [{ field: 'supplierItemId', message: 'Supplier mismatch.' }],
      });
    }

    const primaryUomQty = await this.uomConversionsService.toPrimaryUomQuantity(
      supplierItem.inventoryItemId,
      supplierItem.uomId,
      data.uomQty,
    );

    // Scheme override from the form, falling back to the supplier item's standing scheme.
    const scheme = {
      buyQty: data.schemeBuyQty ?? supplierItem.schemeBuyQty ?? null,
      freeQty: data.schemeFreeQty ?? supplierItem.schemeFreeQty ?? null,
      hasScheme: data.hasScheme ?? supplierItem.hasScheme ?? false,
    };

    await this.database.runInTransaction(async () => {
      await this.itemsService.addItem(
        po,
        data,
        supplierItem.inventoryItemId,
        supplierItem.uomId,
        primaryUomQty,
        scheme,
      );
      await this.repository.syncTotalAmount(poId);
    });

    this.logger.log(`Added PO item: ${po.poNumber} (${poId})`);
    return {
      success: true,
      message: `Line item added to purchase order "${po.poNumber}".`,
      data: PurchaseOrderDtoClass.from(po, po.supplierName),
    };
  }

  async updateItem(poId: string, itemId: string, data: UpdatePurchaseOrderItemDto): Promise<SuccessResponseDto> {
    const po = await this.getPurchaseOrderContext(poId);
    await this.assertNoGoodsReceipt(poId);

    const existingItem = await this.itemsRepository.findItemById(poId, itemId);
    if (!existingItem) throw new NotFoundException('Purchase order line item not found.');

    const inventoryItemId = data.inventoryItemId ?? existingItem.inventoryItemId;
    const uomId = existingItem.uomId;
    const orderedUomQty = data.uomQty ?? existingItem.uomQty;

    // Recompute the primary-UOM quantity for the current item, uom, and qty
    const primaryUomQty = await this.uomConversionsService.toPrimaryUomQuantity(inventoryItemId, uomId, orderedUomQty);

    // Scheme override from the form, falling back to the line's existing scheme.
    const scheme = {
      buyQty: data.schemeBuyQty ?? existingItem.schemeBuyQty ?? null,
      freeQty: data.schemeFreeQty ?? existingItem.schemeFreeQty ?? null,
      hasScheme: data.hasScheme ?? existingItem.hasScheme ?? false,
    };

    await this.database.runInTransaction(async () => {
      await this.itemsService.updateItem(po, itemId, data, primaryUomQty, scheme);
      await this.repository.syncTotalAmount(poId);
    });

    this.logger.log(`Updated PO item: ${po.poNumber} (${itemId})`);
    return { success: true, message: `Line item updated for purchase order "${po.poNumber}".` };
  }

  async removeItem(poId: string, itemId: string): Promise<SuccessResponseDto> {
    const po = await this.getPurchaseOrderContext(poId);
    await this.assertNoGoodsReceipt(poId);

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

  private async assertNoGoodsReceipt(poId: string): Promise<void> {
    if (await this.goodsReceiptsService.hasGoodsReceiptForPo(poId)) {
      throw new BadRequestException({
        label: 'Cannot Edit Line Items',
        detail: 'A goods receipt exists for this purchase order, so its line items can no longer be edited.',
      });
    }
  }
}

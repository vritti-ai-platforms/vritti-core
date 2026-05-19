import { PurchaseOrdersService } from '@domain/purchase-orders/services/purchase-orders.service';
import { SupplierItemsRepository } from '@domain/supplier-items/repositories/supplier-items.repository';
import { BadRequestException, type CreateResponseDto } from '@vritti/api-sdk';
import { Injectable } from '@nestjs/common';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import type { AddPurchaseOrderItemDto } from '../dto/request/add-purchase-order-item.dto';

@Injectable()
export class PurchaseOrdersItemsService {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly supplierItemsRepository: SupplierItemsRepository,
  ) {}

  async addItem(id: string, dto: AddPurchaseOrderItemDto): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const po = await this.purchaseOrdersService.findById(id);

    const supplierItem = await this.supplierItemsRepository.findItemBySupplierAndInventoryItem(
      po.supplierId,
      dto.inventoryItemId,
    );
    if (!supplierItem) {
      throw new BadRequestException({
        label: 'Item Not Linked',
        detail: 'This inventory item is not linked to the purchase order supplier.',
      });
    }

    return this.purchaseOrdersService.addItem(id, dto, supplierItem.uomId);
  }
}

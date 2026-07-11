import { GoodsReceiptsService } from '@domain/goods-receipts/services/goods-receipts.service';
import { PurchaseOrderItemsRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrdersRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { PurchaseOrdersService } from '@domain/purchase-orders/services/purchase-orders.service';
import { SuppliersRepository } from '@domain/suppliers/repositories/suppliers.repository';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { ChangePurchaseOrderExchangeRateDto } from '@/modules/purchase-orders/dto/request/change-purchase-order-exchange-rate.dto';
import type { ChangePurchaseOrderSupplierDto } from '@/modules/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import type { CreatePurchaseOrderDto } from '@/modules/purchase-orders/dto/request/create-purchase-order.dto';

@Injectable()
export class PurchaseOrdersRootService {
  private readonly logger = new Logger(PurchaseOrdersRootService.name);

  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly repository: PurchaseOrdersRepository,
    private readonly itemsRepository: PurchaseOrderItemsRepository,
    private readonly suppliersRepository: SuppliersRepository,
    private readonly goodsReceiptsService: GoodsReceiptsService,
  ) {}

  async create(dto: CreatePurchaseOrderDto, siteCurrencyCode: string): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const supplier = await this.suppliersRepository.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    this.logger.log(`purchaseOrders.create — supplier: ${dto.supplierId}, site currency: ${siteCurrencyCode}`);
    return this.purchaseOrdersService.create(dto, supplier.currencyCode, siteCurrencyCode);
  }

  async findById(id: string): Promise<PurchaseOrderDto> {
    const dto = await this.purchaseOrdersService.findById(id);
    dto.goodsReceiptExists = await this.goodsReceiptsService.hasGoodsReceiptForPo(id);
    return dto;
  }

  async changeSupplier(id: string, dto: ChangePurchaseOrderSupplierDto): Promise<SuccessResponseDto> {
    const supplier = await this.suppliersRepository.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    await this.assertNoGoodsReceipt(id, 'Cannot Change Supplier');

    const inventoryItemIds = await this.itemsRepository.findInventoryItemIdsByPoId(id);
    if (inventoryItemIds.length > 0) {
      throw new BadRequestException({
        label: 'Cannot Change Supplier',
        detail: 'Remove all line items before changing the supplier.',
      });
    }

    return this.purchaseOrdersService.changeSupplier(id, dto.supplierId, supplier.name);
  }

  async changeExchangeRate(
    id: string,
    dto: ChangePurchaseOrderExchangeRateDto,
    siteCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    const po = await this.repository.findById(id);
    if (!po) throw new NotFoundException('Purchase order not found.');

    await this.assertNoGoodsReceipt(id, 'Cannot Change Exchange Rate');

    const supplier = await this.suppliersRepository.findById(po.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    this.logger.log(`purchaseOrders.changeExchangeRate — id: ${id}, type: ${dto.exchangeRateType}`);
    return this.purchaseOrdersService.changeExchangeRate(id, dto, supplier.currencyCode, siteCurrencyCode);
  }

  private async assertNoGoodsReceipt(poId: string, label: string): Promise<void> {
    if (await this.goodsReceiptsService.hasGoodsReceiptForPo(poId)) {
      throw new BadRequestException({
        label,
        detail: 'A goods receipt exists for this purchase order.',
      });
    }
  }
}

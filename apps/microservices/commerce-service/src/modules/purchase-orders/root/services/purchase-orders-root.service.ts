import { PurchaseOrderItemsRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrdersRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { PurchaseOrdersService } from '@domain/purchase-orders/services/purchase-orders.service';
import { SuppliersRepository } from '@domain/suppliers/repositories/suppliers.repository';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, type CreateResponseDto, NotFoundException, type SuccessResponseDto } from '@vritti/api-sdk';
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
  ) {}

  async create(dto: CreatePurchaseOrderDto, buCurrencyCode: string): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const supplier = await this.suppliersRepository.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    this.logger.log(`purchaseOrders.create — supplier: ${dto.supplierId}, bu currency: ${buCurrencyCode}`);
    return this.purchaseOrdersService.create(dto, supplier.currencyCode, buCurrencyCode);
  }

  async changeSupplier(id: string, dto: ChangePurchaseOrderSupplierDto): Promise<SuccessResponseDto> {
    const supplier = await this.suppliersRepository.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

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
    buCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    const po = await this.repository.findById(id);
    if (!po) throw new NotFoundException('Purchase order not found.');

    const supplier = await this.suppliersRepository.findById(po.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    this.logger.log(`purchaseOrders.changeExchangeRate — id: ${id}, type: ${dto.exchangeRateType}`);
    return this.purchaseOrdersService.changeExchangeRate(id, dto, supplier.currencyCode, buCurrencyCode);
  }
}

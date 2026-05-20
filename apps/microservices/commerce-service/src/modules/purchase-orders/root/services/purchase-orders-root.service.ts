import { PurchaseOrderItemsRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import { PurchaseOrderItemsService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrdersRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { PurchaseOrdersService } from '@domain/purchase-orders/services/purchase-orders.service';
import { SuppliersRepository } from '@domain/suppliers/repositories/suppliers.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  NotFoundException,
  PrimaryDatabaseService,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import { PurchaseOrderStatusValues } from '@/db/schema';
import type { ChangePurchaseOrderCurrencyDto } from '@/modules/purchase-orders/dto/request/change-purchase-order-currency.dto';
import type { ChangePurchaseOrderSupplierDto } from '@/modules/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import type { CreatePurchaseOrderDto } from '@/modules/purchase-orders/dto/request/create-purchase-order.dto';

@Injectable()
export class PurchaseOrdersRootService {
  private readonly logger = new Logger(PurchaseOrdersRootService.name);

  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly repository: PurchaseOrdersRepository,
    private readonly itemsService: PurchaseOrderItemsService,
    private readonly itemsRepository: PurchaseOrderItemsRepository,
    private readonly suppliersRepository: SuppliersRepository,
    private readonly database: PrimaryDatabaseService,
  ) {}

  async create(dto: CreatePurchaseOrderDto): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const supplier = await this.suppliersRepository.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    this.logger.log(`purchaseOrders.create — supplier: ${dto.supplierId}`);
    return this.purchaseOrdersService.create(dto, supplier.currencyCode);
  }

  async changeSupplier(id: string, dto: ChangePurchaseOrderSupplierDto): Promise<SuccessResponseDto> {
    const supplier = await this.suppliersRepository.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const itemIds = await this.itemsRepository.findItemIdsByPoId(id);
    if (itemIds.length > 0) {
      throw new BadRequestException({
        label: 'Cannot Change Supplier',
        detail: 'Remove all line items before changing the supplier.',
      });
    }

    return this.purchaseOrdersService.changeSupplier(id, dto.supplierId, supplier.name);
  }

  // Full atomic transaction: header currency update + item price recalculation + totalAmount sync
  async changeCurrency(id: string, dto: ChangePurchaseOrderCurrencyDto): Promise<SuccessResponseDto> {
    const po = await this.repository.findByIdWithSupplierName(id);
    if (!po) throw new NotFoundException('Purchase order not found.');

    if (po.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({
        label: 'Cannot Change Currency',
        detail: 'Currency can only be changed while the purchase order is in draft.',
      });
    }

    const supplier = await this.suppliersRepository.findById(po.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const isSameCurrency = supplier.currencyCode === dto.currencyCode;
    const resolvedRate = isSameCurrency ? 1 : (dto.conversionRate ?? undefined);

    if (!isSameCurrency && (resolvedRate == null || resolvedRate <= 0)) {
      throw new BadRequestException({
        label: 'Invalid Conversion Rate',
        detail: `Conversion rate is required and must be greater than 0 when supplier currency (${supplier.currencyCode}) differs from PO currency (${dto.currencyCode}).`,
        errors: [{ field: 'conversionRate', message: 'Conversion rate must be greater than 0.' }],
      });
    }

    const effectiveRate = resolvedRate ?? 1;

    await this.database.runInTransaction(async () => {
      await this.repository.updateCurrency(id, {
        currencyCode: dto.currencyCode,
        conversionRate: String(effectiveRate),
      });
      await this.itemsService.recalculateForCurrencyChange(
        id,
        dto.currencyCode,
        effectiveRate,
        supplier.currencyCode ?? po.currencyCode,
      );
      await this.repository.syncTotalAmount(id);
    });

    this.logger.log(`Changed PO currency: ${po.poNumber} (${id}) -> ${dto.currencyCode}`);
    return {
      success: true,
      message: `Currency changed to "${dto.currencyCode}" for purchase order "${po.poNumber}".`,
    };
  }
}

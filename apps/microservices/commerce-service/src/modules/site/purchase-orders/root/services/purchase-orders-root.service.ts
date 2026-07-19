import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { PurchaseOrderItemsDomainRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import type { ChangePurchaseOrderExchangeRateDto } from '@domain/purchase-orders/dto/request/change-purchase-order-exchange-rate.dto';
import type { ChangePurchaseOrderSupplierDto } from '@domain/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import type { CreatePurchaseOrderDto } from '@domain/purchase-orders/dto/request/create-purchase-order.dto';
import { PurchaseOrdersDomainRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { SupplierSitesDomainService } from '@domain/supplier-sites/services/supplier-sites.service';
import { SuppliersDomainRepository } from '@domain/suppliers/repositories/suppliers.repository';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly repository: PurchaseOrdersDomainRepository,
    private readonly itemsRepository: PurchaseOrderItemsDomainRepository,
    private readonly suppliersRepository: SuppliersDomainRepository,
    private readonly supplierSitesService: SupplierSitesDomainService,
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
  ) {}

  async create(
    dto: CreatePurchaseOrderDto,
    siteId: string,
    siteCurrencyCode: string,
  ): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const supplier = await this.suppliersRepository.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    await this.assertSupplierPurchasable(supplier, siteId);
    this.logger.log(`purchaseOrders.create — supplier: ${dto.supplierId}, site currency: ${siteCurrencyCode}`);
    return this.purchaseOrdersService.create(dto, supplier.currencyCode, siteCurrencyCode);
  }

  async findById(id: string): Promise<PurchaseOrderDto> {
    const dto = await this.purchaseOrdersService.findById(id);
    dto.goodsReceiptExists = await this.goodsReceiptsService.hasGoodsReceiptForPo(id);
    return dto;
  }

  async changeSupplier(id: string, dto: ChangePurchaseOrderSupplierDto, siteId: string): Promise<SuccessResponseDto> {
    const supplier = await this.suppliersRepository.findByIdWithParty(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    await this.assertSupplierPurchasable(supplier, siteId);

    await this.assertNoGoodsReceipt(id, 'Cannot Change Supplier');

    const inventoryItemIds = await this.itemsRepository.findInventoryItemIdsByPoId(id);
    if (inventoryItemIds.length > 0) {
      throw new BadRequestException({
        label: 'Cannot Change Supplier',
        detail: 'Remove all line items before changing the supplier.',
      });
    }

    return this.purchaseOrdersService.changeSupplier(id, dto.supplierId, supplier.partyName ?? '');
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

  // Rejects a supplier that is purchasing-blocked or not enrolled for the ordering site
  private async assertSupplierPurchasable(
    supplier: { id: string; purchasingBlocked: boolean },
    siteId: string,
  ): Promise<void> {
    if (supplier.purchasingBlocked) {
      throw new BadRequestException({
        label: 'Supplier Blocked',
        detail: 'Purchasing is blocked for this supplier.',
      });
    }
    const enrolled = await this.supplierSitesService.isEnrolled(supplier.id, siteId);
    if (!enrolled) {
      throw new BadRequestException({
        label: 'Supplier Not Enrolled',
        detail: 'Supplier is not enrolled for this site. Enroll the supplier before creating this document.',
      });
    }
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

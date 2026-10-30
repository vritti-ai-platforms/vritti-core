import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { PurchaseOrderItemsDomainRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import { PurchaseOrderItemsDomainService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import type { ChangePurchaseOrderExchangeRateDto } from '@domain/purchase-orders/dto/request/change-purchase-order-exchange-rate.dto';
import type { ChangePurchaseOrderSupplierDto } from '@domain/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import type { CreatePurchaseOrderDto } from '@domain/purchase-orders/dto/request/create-purchase-order.dto';
import type { SetPurchaseOrderConversionRateDto } from '@domain/purchase-orders/dto/request/set-purchase-order-conversion-rate.dto';
import { PurchaseOrdersDomainRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { SupplierSitesDomainService } from '@domain/supplier-sites/services/supplier-sites.service';
import { SuppliersDomainRepository } from '@domain/suppliers/repositories/suppliers.repository';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly repository: PurchaseOrdersDomainRepository,
    private readonly itemsRepository: PurchaseOrderItemsDomainRepository,
    private readonly itemsService: PurchaseOrderItemsDomainService,
    private readonly database: PrimaryDatabaseService,
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
    const currencyCode = dto.currencyCode ?? supplier.currencyCode;
    if (!supplier.currencyCodes.includes(currencyCode)) {
      throw new BadRequestException({
        label: 'Currency Not Accepted',
        detail: `This supplier trades in ${supplier.currencyCodes.join(', ')}, not ${currencyCode}.`,
        errors: [{ field: 'currencyCode', message: "Not one of the supplier's currencies" }],
      });
    }
    this.logger.log(`purchaseOrders.create — supplier: ${dto.supplierId}, currency: ${currencyCode}`);
    return this.purchaseOrdersService.create(dto, currencyCode, siteCurrencyCode);
  }

  async findById(id: string): Promise<PurchaseOrderDto> {
    const dto = await this.purchaseOrdersService.findById(id);
    dto.goodsReceiptExists = await this.goodsReceiptsService.hasGoodsReceiptForPo(id);
    return dto;
  }

  async changeSupplier(
    id: string,
    dto: ChangePurchaseOrderSupplierDto,
    siteId: string,
    siteCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
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

    return this.purchaseOrdersService.changeSupplier(
      id,
      {
        id: supplier.id,
        name: supplier.partyName ?? '',
        currencyCode: supplier.currencyCode,
        currencyCodes: supplier.currencyCodes,
      },
      siteCurrencyCode,
    );
  }

  async changeExchangeRate(
    id: string,
    dto: ChangePurchaseOrderExchangeRateDto,
    siteCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    const po = await this.repository.findById(id);
    if (!po) throw new NotFoundException('Purchase order not found.');

    await this.assertNoGoodsReceipt(id, 'Cannot Change Exchange Rate');

    this.logger.log(`purchaseOrders.changeExchangeRate — id: ${id}, type: ${dto.exchangeRateType}`);
    return this.purchaseOrdersService.changeExchangeRate(id, dto, siteCurrencyCode);
  }

  // Sets the rate from another of the supplier's currencies into the PO currency and re-converts its lines in it
  async setConversionRate(dto: SetPurchaseOrderConversionRateDto): Promise<SuccessResponseDto> {
    const po = await this.repository.findByIdWithSupplierName(dto.id);
    if (!po) throw new NotFoundException('Purchase order not found.');
    await this.assertNoGoodsReceipt(dto.id, 'Cannot Change Conversion Rate');
    const supplier = await this.suppliersRepository.findById(po.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    if (!supplier.currencyCodes.includes(dto.currencyCode)) {
      throw new BadRequestException({
        label: 'Currency Not Accepted',
        detail: `This supplier trades in ${supplier.currencyCodes.join(', ')}, not ${dto.currencyCode}.`,
        errors: [{ field: 'currencyCode', message: "Not one of the supplier's currencies" }],
      });
    }

    const repriced = await this.database.runInTransaction(async () => {
      const rate = await this.purchaseOrdersService.setConversionRate(dto.id, dto.currencyCode, dto.rate);
      const count = await this.itemsService.repriceSourceCurrency(
        { ...po, conversionRates: { ...po.conversionRates, [dto.currencyCode]: rate } },
        dto.currencyCode,
        rate,
      );
      await this.repository.syncTotalAmount(dto.id);
      return count;
    });
    return {
      success: true,
      message: `1 ${dto.currencyCode} = ${dto.rate} ${po.currencyCode}; ${pluralize('line', repriced, true)} re-converted.`,
    };
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

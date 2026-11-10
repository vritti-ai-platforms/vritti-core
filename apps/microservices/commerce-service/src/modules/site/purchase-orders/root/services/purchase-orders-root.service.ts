import { GoodsReceiptItemsDomainService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import { PurchaseOrderItemsDomainService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import type { ChangePurchaseOrderSupplierDto } from '@domain/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import type { CreatePurchaseOrderDto } from '@domain/purchase-orders/dto/request/create-purchase-order.dto';
import type { SetPurchaseOrderConversionRateDto } from '@domain/purchase-orders/dto/request/set-purchase-order-conversion-rate.dto';
import type { UpdatePurchaseOrderTaxDateDto } from '@domain/purchase-orders/dto/request/update-purchase-order-tax-date.dto';
import { PurchaseOrdersDomainRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { SupplierEnrollmentsDomainRepository } from '@domain/supplier-enrollments/repositories/supplier-enrollments.repository';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { SuppliersDomainRepository } from '@domain/suppliers/repositories/suppliers.repository';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { Supplier } from '@/db/schema';
import { PurchaseOrderProblemsDto } from '../dto/entity/purchase-order-problems.dto';

export interface PurchaseOrderSite {
  siteId: string;
  timezone: string;
  leCurrencyCode: string;
}

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly purchaseOrdersRepository: PurchaseOrdersDomainRepository,
    private readonly itemsService: PurchaseOrderItemsDomainService,
    private readonly suppliersRepository: SuppliersDomainRepository,
    private readonly supplierEnrollmentsRepository: SupplierEnrollmentsDomainRepository,
    private readonly goodsReceiptItemsService: GoodsReceiptItemsDomainService,
    private readonly supplierInvoicesService: SupplierInvoicesDomainService,
  ) {}

  // Creates a PO at a site the supplier may be purchased from, in one of the supplier's currencies
  async create(dto: CreatePurchaseOrderDto, site: PurchaseOrderSite): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const supplier = await this.suppliersRepository.findByIdOrThrow(dto.supplierId);
    await this.supplierEnrollmentsRepository.assertPurchasable(supplier.id, site.siteId);
    const currencyCode = dto.currencyCode ?? supplier.currencyCode;
    this.assertTradesIn(supplier, currencyCode);

    this.logger.log(
      `purchaseOrders.create — supplier: ${supplier.id}, site: ${site.siteId}, currency: ${currencyCode}`,
    );
    return this.purchaseOrdersService.create(dto, { ...site, currencyCode });
  }

  // Moves a draft PO to another supplier its site may purchase from
  async changeSupplier(dto: ChangePurchaseOrderSupplierDto, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersRepository.findDetailOrThrow(dto.id);
    const supplier = await this.suppliersRepository.findWithPartyOrThrow(dto.supplierId);
    await this.supplierEnrollmentsRepository.assertPurchasable(supplier.id, po.siteId);

    return this.purchaseOrdersService.changeSupplier(
      po,
      {
        id: supplier.id,
        name: supplier.partyName,
        currencyCode: supplier.currencyCode,
        currencyCodes: supplier.currencyCodes,
      },
      leCurrencyCode,
      dto.exchangeRate,
    );
  }

  // Sets the rate from another of the supplier's currencies into the PO currency and converts its lines in it again
  async setConversionRate(dto: SetPurchaseOrderConversionRateDto): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersRepository.findDetailOrThrow(dto.id);
    const supplier = await this.suppliersRepository.findByIdOrThrow(po.supplierId);
    this.assertTradesIn(supplier, dto.currencyCode);

    const repricedCount = await this.database.runInTransaction(async () => {
      const rate = await this.purchaseOrdersService.setConversionRate(po, dto.currencyCode, dto.rate);
      const conversionRates = { ...po.conversionRates, [dto.currencyCode]: rate };
      const count = await this.itemsService.repriceSourceCurrency({ ...po, conversionRates }, dto.currencyCode, rate);
      await this.purchaseOrdersRepository.syncTotalAmount(po.id);
      return count;
    });
    return {
      success: true,
      message: `1 ${dto.currencyCode} = ${dto.rate} ${po.currencyCode} on "${po.poNumber}"; ${pluralize('line', repricedCount, true)} converted again.`,
    };
  }

  // Sets a PO's tax date and moves every line that follows it in the same transaction
  async updateTaxDate(dto: UpdatePurchaseOrderTaxDateDto): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersRepository.findDetailOrThrow(dto.id);
    const movedCount = await this.database.runInTransaction(async () => {
      await this.purchaseOrdersService.updateTaxDate(po, dto.taxDate);
      return this.itemsService.followPoTaxDate(po.id, dto.taxDate);
    });
    return {
      success: true,
      message: `Tax date of purchase order "${po.poNumber}" set to ${dto.taxDate}; ${pluralize('following line', movedCount, true)} updated.`,
    };
  }

  // Gathers the flags raised on a PO's receipts and invoices, grouped by order line, invoice header flags kept for the order
  async findProblems(id: string): Promise<PurchaseOrderProblemsDto> {
    const po = await this.purchaseOrdersRepository.findDetailOrThrow(id);
    const receiptItems = await this.goodsReceiptItemsService.findFlaggedForPurchaseOrder(po.id);
    const invoices = await this.supplierInvoicesService.findFlaggedForPurchaseOrder(po.id);
    return PurchaseOrderProblemsDto.from(receiptItems, invoices);
  }

  // Rejects a currency the supplier does not trade in
  private assertTradesIn(supplier: Supplier, currencyCode: string): void {
    if (supplier.currencyCodes.includes(currencyCode)) return;
    throw new BadRequestException({
      label: 'Currency Not Accepted',
      detail: `This supplier trades in ${supplier.currencyCodes.join(', ')}, not ${currencyCode}.`,
      errors: [{ field: 'currencyCode', message: "Not one of the supplier's currencies" }],
    });
  }
}

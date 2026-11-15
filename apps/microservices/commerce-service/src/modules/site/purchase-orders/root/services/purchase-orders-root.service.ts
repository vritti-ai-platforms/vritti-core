import { GoodsReceiptItemsDomainService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import {
  PurchaseEventActionValues,
  PurchaseEventDocumentTypeValues,
} from '@domain/purchase-events/dto/entity/purchase-event.dto';
import { PurchaseOrderItemsDomainService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import type { ChangePurchaseOrderExchangeRateDto } from '@domain/purchase-orders/dto/request/change-purchase-order-exchange-rate.dto';
import type { ChangePurchaseOrderSupplierDto } from '@domain/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import type { CreatePurchaseOrderDto } from '@domain/purchase-orders/dto/request/create-purchase-order.dto';
import type { SetPurchaseOrderConversionRateDto } from '@domain/purchase-orders/dto/request/set-purchase-order-conversion-rate.dto';
import type { UpdatePurchaseOrderStatusDto } from '@domain/purchase-orders/dto/request/update-purchase-order-status.dto';
import type { UpdatePurchaseOrderTaxDateDto } from '@domain/purchase-orders/dto/request/update-purchase-order-tax-date.dto';
import type { PurchaseOrderRow } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { SupplierInvoiceHoldsDomainService } from '@domain/supplier-invoices/services/supplier-invoice-holds.service';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PurchaseOrderStatusValues, type Supplier } from '@/db/schema';
import { PurchaseProgressService } from '@/modules/site/purchase-progress/services/purchase-progress.service';
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
    private readonly itemsService: PurchaseOrderItemsDomainService,
    private readonly suppliersService: SuppliersDomainService,
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly goodsReceiptItemsService: GoodsReceiptItemsDomainService,
    private readonly supplierInvoiceHoldsService: SupplierInvoiceHoldsDomainService,
    private readonly purchasesService: PurchasesDomainService,
    private readonly purchaseProgressService: PurchaseProgressService,
  ) {}

  // Creates a PO at a site the supplier may be purchased from, in one of the supplier's currencies, on the payment term
  // of the supplier's enrollment at the site
  async create(dto: CreatePurchaseOrderDto, site: PurchaseOrderSite): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const supplier = await this.suppliersService.findByIdOrThrow(dto.supplierId);
    await this.supplierEnrollmentsService.assertPurchasable(supplier.id, site.siteId);
    const enrollment = await this.supplierEnrollmentsService.findBySupplierAndSiteOrThrow(supplier.id, site.siteId);
    const currencyCode = dto.currencyCode ?? supplier.currencyCode;
    this.assertTradesIn(supplier, currencyCode);

    this.logger.log(
      `purchaseOrders.create — supplier: ${supplier.id}, site: ${site.siteId}, currency: ${currencyCode}`,
    );
    return this.purchaseOrdersService.create(dto, { ...site, currencyCode, paymentTermId: enrollment.paymentTermId });
  }

  // Moves a PO along its workflow; a purchase's PO is not cancelled here, and confirming one tells its purchase in the
  // same transaction
  async updateStatus(dto: UpdatePurchaseOrderStatusDto, actorId: string | null): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersService.findDetailOrThrow(dto.id);
    if (dto.status === PurchaseOrderStatusValues.CANCELLED) this.assertNotPartOfPurchase(po);
    return this.database.runInTransaction(async () => {
      const result = await this.purchaseOrdersService.changeStatus(po, dto.status);
      if (po.purchaseId && dto.status === PurchaseOrderStatusValues.CONFIRMED) {
        await this.purchaseProgressService.notifyDocument(
          po.purchaseId,
          po.supplierId,
          {
            action: PurchaseEventActionValues.CONFIRM_PURCHASE_ORDER,
            documentType: PurchaseEventDocumentTypeValues.PURCHASE_ORDER,
            documentId: po.id,
          },
          actorId,
        );
      }
      return result;
    });
  }

  // Sets a PO's tax date and moves every line that follows it in the same transaction
  async updateTaxDate(dto: UpdatePurchaseOrderTaxDateDto): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersService.findDetailOrThrow(dto.id);
    const movedCount = await this.database.runInTransaction(async () => {
      await this.purchaseOrdersService.updateTaxDate(po, dto.taxDate);
      return this.itemsService.followPoTaxDate(po.id, dto.taxDate);
    });
    return {
      success: true,
      message: `Tax date of purchase order "${po.poNumber}" set to ${dto.taxDate}; ${pluralize('following line', movedCount, true)} updated.`,
    };
  }

  // Moves a draft PO to another supplier its site may purchase from, on that supplier's payment term at the site
  async changeSupplier(dto: ChangePurchaseOrderSupplierDto, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersService.findDetailOrThrow(dto.id);
    this.assertNotPartOfPurchase(po);
    const supplier = await this.suppliersService.findWithPartyOrThrow(dto.supplierId);
    await this.supplierEnrollmentsService.assertPurchasable(supplier.id, po.siteId);
    const enrollment = await this.supplierEnrollmentsService.findBySupplierAndSiteOrThrow(supplier.id, po.siteId);

    return this.purchaseOrdersService.changeSupplier(
      po,
      {
        id: supplier.id,
        name: supplier.partyName,
        currencyCode: supplier.currencyCode,
        currencyCodes: supplier.currencyCodes,
        paymentTermId: enrollment.paymentTermId,
      },
      leCurrencyCode,
      dto.exchangeRate,
    );
  }

  // Sets the rate from another of the supplier's currencies into the PO currency and converts its lines in it again
  async setConversionRate(dto: SetPurchaseOrderConversionRateDto): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersService.findDetailOrThrow(dto.id);
    this.assertNotPartOfPurchase(po);
    const supplier = await this.suppliersService.findByIdOrThrow(po.supplierId);
    this.assertTradesIn(supplier, dto.currencyCode);

    const repricedCount = await this.database.runInTransaction(async () => {
      const rate = await this.purchaseOrdersService.setConversionRate(po, dto.currencyCode, dto.rate);
      const conversionRates = { ...po.conversionRates, [dto.currencyCode]: rate };
      const count = await this.itemsService.repriceSourceCurrency({ ...po, conversionRates }, dto.currencyCode, rate);
      await this.purchaseOrdersService.syncTotalAmount(po.id);
      return count;
    });
    return {
      success: true,
      message: `1 ${dto.currencyCode} = ${dto.rate} ${po.currencyCode} on "${po.poNumber}"; ${pluralize('line', repricedCount, true)} converted again.`,
    };
  }

  // Changes a foreign-currency PO's rate into the legal entity's currency; a purchase's PO keeps the rate it was ordered at
  async changeExchangeRate(
    dto: ChangePurchaseOrderExchangeRateDto,
    leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersService.findDetailOrThrow(dto.id);
    this.assertNotPartOfPurchase(po);
    return this.purchaseOrdersService.changeExchangeRate(po, dto.exchangeRate, leCurrencyCode);
  }

  // Marks a confirmed PO delivery completed: its lines cancel what they still had to receive and its statuses follow, in one transaction
  async completeDelivery(id: string): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersService.findDetailOrThrow(id);
    this.purchaseOrdersService.assertDeliveryCompletable(po);
    const cancelledLines = await this.database.runInTransaction(async () => {
      await this.purchaseOrdersService.completeDelivery(po);
      const count = await this.itemsService.cancelRemaining(po.id);
      await this.purchaseOrdersService.syncProgress([po.id]);
      return count;
    });
    this.logger.log(`purchaseOrders.completeDelivery — ${po.poNumber}, lines cancelled: ${cancelledLines}`);
    return {
      success: true,
      message: `Purchase order "${po.poNumber}" marked delivery completed; ${pluralize('line', cancelledLines, true)} cancelled what was left to receive.`,
    };
  }

  // Gathers the flags raised on a PO's receipts and the open holds on its invoices, grouped by order line
  async findProblems(id: string): Promise<PurchaseOrderProblemsDto> {
    const po = await this.purchaseOrdersService.findDetailOrThrow(id);
    const receiptItems = await this.goodsReceiptItemsService.findFlaggedForPurchaseOrder(po.id);
    const holds = await this.supplierInvoiceHoldsService.findOpenForPurchaseOrder(po.id);
    return PurchaseOrderProblemsDto.from(receiptItems, holds);
  }

  // Deletes a draft PO that no purchase created
  async delete(id: string): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersService.findDetailOrThrow(id);
    this.assertNotPartOfPurchase(po);
    return this.purchaseOrdersService.delete(po);
  }

  // Rejects a change to a PO a purchase created; it is ordered from its approved allocations (409)
  private assertNotPartOfPurchase(po: Pick<PurchaseOrderRow, 'poNumber' | 'purchaseNumber'>): void {
    this.purchasesService.assertNotPartOfPurchase(`Purchase order "${po.poNumber}"`, [po.purchaseNumber]);
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

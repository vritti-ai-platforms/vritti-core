import { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
import { PurchaseSuppliersDomainRepository } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import type { RequestPurchaseQuotationDto } from '@domain/purchases/dto/request/request-purchase-quotation.dto';
import type { PurchaseRow } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import type { PurchaseQuotationTableRowDto } from '@domain/supplier-quotations/dto/entity/purchase-quotation.dto';
import { SupplierQuotationsDomainService } from '@domain/supplier-quotations/services/supplier-quotations.service';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';
import { formatISO } from 'date-fns';
import { PurchasingRulesService } from '@/modules/site/purchasing-rules/services/purchasing-rules.service';
import { PurchaseItemQuoteDto, PurchaseItemQuoteRowDto } from '../../items/root/dto/entity/purchase-item-quote.dto';
import { PurchaseDetailQuotationDto } from '../dto/entity/purchase-detail-quotation.dto';

@Injectable()
export class PurchasesQuotationsService {
  private readonly logger = new Logger(PurchasesQuotationsService.name);

  constructor(
    private readonly purchasesRepository: PurchasesDomainRepository,
    private readonly itemsService: PurchaseItemsDomainService,
    private readonly purchaseSuppliersRepository: PurchaseSuppliersDomainRepository,
    private readonly suppliersService: SuppliersDomainService,
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly supplierItemsService: SupplierItemsDomainService,
    private readonly supplierQuotationsService: SupplierQuotationsDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
    private readonly purchasingRulesService: PurchasingRulesService,
  ) {}

  // Requests a quotation from a supplier enrolled at the purchase's site: a draft the site owns, linked to the purchase,
  // with one line per purchase item still to allocate, in the supplier's unit for it — its site item's, else its supplier
  // item's, else the item's primary unit; items the site's rules buy only from suppliers set up for them are left out
  // when this one is not. Only a purchase that requires quotations requests them; the others allocate directly
  async request(dto: RequestPurchaseQuotationDto): Promise<CreateResponseDto<{ quotationId: string }>> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(dto.id);
    this.purchasesRepository.assertOpen(purchase, 'Cannot Request Quotation');
    if (!purchase.quotationsRequired) {
      throw new BadRequestException({
        label: 'Quotations Not Required',
        detail: `"${purchase.purchaseNumber}" does not require quotations, so its items are allocated to suppliers directly.`,
      });
    }
    const supplier = await this.suppliersService.findByIdOrThrow(dto.supplierId);
    this.purchaseSuppliersRepository.requireActiveEnrollment(
      await this.supplierEnrollmentsService.findPurchasingSnapshot(supplier.id, purchase.siteId),
    );
    const items = (await this.itemsService.findByPurchaseId(purchase.id)).filter((item) =>
      new Decimal(item.primaryQty).gt(item.allocatedPrimaryQty),
    );
    const itemIds = items.map((item) => item.inventoryItemId);
    const [siteUnits, unsourced] = await Promise.all([
      this.supplierItemsService.findSiteUnits(supplier.id, purchase.siteId, itemIds),
      this.purchasingRulesService.findUnsourcedItemIds(supplier.id, purchase.siteId, itemIds),
    ]);
    const lines = items
      .filter((item) => !unsourced.has(item.inventoryItemId))
      .map((item) => ({
        purchaseItemId: item.id,
        inventoryItemId: item.inventoryItemId,
        uomId: siteUnits.get(item.inventoryItemId) ?? item.primaryUomId,
      }));
    if (lines.length === 0) {
      throw new BadRequestException({
        label: 'Nothing To Quote',
        detail: `This site buys the items of "${purchase.purchaseNumber}" still to allocate only from suppliers that have them set up here, and this supplier has none of them.`,
        errors: [{ field: 'supplierId', message: 'None of these items set up here' }],
      });
    }

    const { quotationId } = await this.supplierQuotationsService.createDraftForPurchase({
      purchaseId: purchase.id,
      siteId: purchase.siteId,
      purchaseNumber: purchase.purchaseNumber,
      supplierId: supplier.id,
      currencyCode: supplier.currencyCode,
      validFrom: formatISO(new Date(), { representation: 'date' }),
      lines,
    });

    const leftOutCount = items.length - lines.length;
    this.logger.log(`purchases.quotations.request — ${purchase.purchaseNumber}, supplier: ${supplier.id}`);
    return {
      success: true,
      message:
        leftOutCount > 0
          ? `Quotation requested for ${pluralize('item', lines.length, true)} of "${purchase.purchaseNumber}"; ${pluralize('item', leftOutCount, true)} the supplier does not have set up here left out.`
          : `Quotation requested for ${pluralize('item', lines.length, true)} of "${purchase.purchaseNumber}".`,
      data: { quotationId },
    };
  }

  // Returns one page of the quotations a purchase requested, drafts included, without their lines
  async findForTable(
    id: string,
    state: TableState,
  ): Promise<{ result: PurchaseQuotationTableRowDto[]; count: number }> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    return this.supplierQuotationsService.findForPurchaseTable(purchase.id, purchase.siteId, state);
  }

  // Returns one page of the quotation lines quoting a purchase item, each priced per primary unit and marked when it is
  // the cheapest in its currency among the posted quotes valid today
  async findItemQuotesTable(
    id: string,
    purchaseItemId: string,
    state: TableState,
  ): Promise<{ result: PurchaseItemQuoteRowDto[]; count: number }> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const [page, quotations] = await Promise.all([
      this.supplierQuotationsService.findForPurchaseItemTable(purchase.id, purchase.siteId, purchaseItemId, state),
      this.findForItems(purchase, [purchaseItemId]),
    ]);
    const quotes = PurchaseItemQuoteDto.forItem(quotations, purchaseItemId);
    const quotesByLineId = new Map(quotes.map((quote) => [quote.line.id, quote]));
    const lowestLineIds = this.lowestLineIds(quotes);
    return {
      result: page.result.map((row) =>
        Object.assign(new PurchaseItemQuoteRowDto(), quotesByLineId.get(row.line.id), {
          isLowest: lowestLineIds.has(row.line.id),
        }),
      ),
      count: page.count,
    };
  }

  // Returns the quotations a purchase requested that quote the given items, with only those lines, each priced per
  // primary unit
  async findForItems(purchase: PurchaseRow, purchaseItemIds: string[]): Promise<PurchaseDetailQuotationDto[]> {
    const quotations = await this.supplierQuotationsService.findForPurchaseItems(
      purchase.id,
      purchase.siteId,
      purchaseItemIds,
    );
    const factors = await this.uomConversionsService.resolveFactors(
      quotations.flatMap((quotation) =>
        quotation.items.map((item) => ({ inventoryItemId: item.inventoryItemId, uomId: item.uomId })),
      ),
    );
    return quotations.map((quotation) => PurchaseDetailQuotationDto.from(quotation, factors));
  }

  // Counts the quotations a purchase requested, drafts included
  countForPurchase(purchaseId: string): Promise<number> {
    return this.supplierQuotationsService.countForPurchase(purchaseId);
  }

  // The cheapest line per currency, per primary unit, among the posted quotes valid today; the quotes come cheapest first
  // within each currency
  private lowestLineIds(quotes: PurchaseItemQuoteDto[]): Set<string> {
    const today = formatISO(new Date(), { representation: 'date' });
    const lowest = new Map<string, string>();
    for (const quote of quotes) {
      const isValid = quote.validFrom <= today && (quote.validTo === null || quote.validTo >= today);
      const currency = quote.line.unitPricePerPrimary.currency;
      if (quote.isPosted && isValid && !lowest.has(currency)) lowest.set(currency, quote.line.id);
    }
    return new Set(lowest.values());
  }
}

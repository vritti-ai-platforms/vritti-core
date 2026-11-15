import {
  PurchaseEventActionValues,
  PurchaseEventDocumentTypeValues,
} from '@domain/purchase-events/dto/entity/purchase-event.dto';
import { PurchaseEventsDomainService } from '@domain/purchase-events/services/purchase-events.service';
import { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { RequestPurchaseQuotationDto } from '@domain/purchases/dto/request/request-purchase-quotation.dto';
import type { PurchaseRow } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import type { PurchaseQuotationDto } from '@domain/supplier-quotations/dto/entity/purchase-quotation.dto';
import { SupplierQuotationsDomainService } from '@domain/supplier-quotations/services/supplier-quotations.service';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { formatISO } from 'date-fns';
import { PurchaseStepValues } from '@/db/schema';
import { PurchaseDetailQuotationDto } from '../dto/entity/purchase-detail-quotation.dto';

export interface PurchaseQuotationCounts {
  quotationCount: number;
  postedSupplierCount: number;
}

@Injectable()
export class PurchasesQuotationsService {
  private readonly logger = new Logger(PurchasesQuotationsService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly purchasesService: PurchasesDomainService,
    private readonly itemsService: PurchaseItemsDomainService,
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly eventsService: PurchaseEventsDomainService,
    private readonly suppliersService: SuppliersDomainService,
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly supplierItemsService: SupplierItemsDomainService,
    private readonly supplierQuotationsService: SupplierQuotationsDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  // Requests a quotation from a supplier enrolled at the purchase's site: a legal-entity draft linked to the purchase
  // with one line per purchase item the supplier supplies at the site, in its unit there; items it does not supply there
  // are left out
  async request(
    dto: RequestPurchaseQuotationDto,
    headers: NatsHeaders,
  ): Promise<CreateResponseDto<{ quotationId: string }>> {
    const purchase = await this.purchasesService.findDetailOrThrow(dto.id);
    this.purchasesService.assertCollectingQuotations(purchase);
    const supplier = await this.suppliersService.findByIdOrThrow(dto.supplierId);
    this.legsService.requireActiveEnrollment(
      await this.supplierEnrollmentsService.findPurchasingSnapshot(supplier.id, purchase.siteId),
    );
    const items = await this.itemsService.findByPurchaseId(purchase.id);
    const siteUnits = await this.supplierItemsService.findSiteUnits(
      supplier.id,
      purchase.siteId,
      items.map((item) => item.inventoryItemId),
    );
    const lines = items.flatMap((item) => {
      const uomId = siteUnits.get(item.inventoryItemId);
      return uomId ? [{ purchaseItemId: item.id, inventoryItemId: item.inventoryItemId, uomId }] : [];
    });
    if (lines.length === 0) {
      throw new BadRequestException({
        label: 'Nothing To Quote',
        detail: `The supplier supplies none of the items of "${purchase.purchaseNumber}" at this site.`,
        errors: [{ field: 'supplierId', message: 'Supplies none of these items here' }],
      });
    }

    const { quotationId } = await this.inLegalEntityWorkspace(headers, () =>
      this.supplierQuotationsService.createDraftForPurchase(
        {
          purchaseId: purchase.id,
          purchaseNumber: purchase.purchaseNumber,
          supplierId: supplier.id,
          currencyCode: supplier.currencyCode,
          validFrom: formatISO(new Date(), { representation: 'date' }),
          lines,
        },
        headers.userId || null,
      ),
    );
    await this.eventsService.record({
      purchaseId: purchase.id,
      action: PurchaseEventActionValues.REQUEST_QUOTATION,
      documentType: PurchaseEventDocumentTypeValues.SUPPLIER_QUOTATION,
      documentId: quotationId,
      actorId: headers.userId || null,
    });

    const leftOutCount = items.length - lines.length;
    this.logger.log(`purchases.quotations.request — ${purchase.purchaseNumber}, supplier: ${supplier.id}`);
    return {
      success: true,
      message:
        leftOutCount > 0
          ? `Quotation requested for ${pluralize('item', lines.length, true)} of "${purchase.purchaseNumber}"; ${pluralize('item', leftOutCount, true)} the supplier does not supply here left out.`
          : `Quotation requested for ${pluralize('item', lines.length, true)} of "${purchase.purchaseNumber}".`,
      data: { quotationId },
    };
  }

  // Moves a purchase to sourcing once enough suppliers have a quotation for it posted to its site or legal entity
  async complete(id: string, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    const postedSupplierCount = await this.supplierQuotationsService.countPostedSuppliersForPurchase(
      purchase.id,
      purchase.siteId,
    );
    await this.database.runInTransaction(async () => {
      await this.purchasesService.completeQuotations(purchase, postedSupplierCount);
      await this.eventsService.record({
        purchaseId: purchase.id,
        action: PurchaseEventActionValues.COMPLETE_QUOTATIONS,
        stepBefore: PurchaseStepValues.QUOTING,
        stepAfter: PurchaseStepValues.SOURCING,
        actorId: headers.userId || null,
      });
    });
    this.logger.log(`purchases.quotations.complete — ${purchase.purchaseNumber}`);
    return { success: true, message: `Quotations of "${purchase.purchaseNumber}" completed; it is now sourcing.` };
  }

  // Returns the quotations a purchase requested, read in its legal entity's workspace (drafts are the LE's), each line
  // priced per primary unit
  async findByPurchase(id: string, headers: NatsHeaders): Promise<PurchaseDetailQuotationDto[]> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    const quotations = await this.inLegalEntityWorkspace(headers, () =>
      this.supplierQuotationsService.findForPurchase(purchase.id, purchase.siteId),
    );
    const primaryPerUnit = await this.findPrimaryPerUnit(quotations);
    return quotations.map((quotation) => PurchaseDetailQuotationDto.from(quotation, primaryPerUnit));
  }

  // Counts the quotations a purchase requested, drafts included, and the suppliers with one posted to its site or legal
  // entity, read in its legal entity's workspace (drafts are the LE's)
  countForPurchase(purchase: PurchaseRow, headers: NatsHeaders): Promise<PurchaseQuotationCounts> {
    return this.inLegalEntityWorkspace(headers, async () => ({
      quotationCount: await this.supplierQuotationsService.countForPurchase(purchase.id),
      postedSupplierCount: await this.supplierQuotationsService.countPostedSuppliersForPurchase(
        purchase.id,
        purchase.siteId,
      ),
    }));
  }

  // Works out once per item and unit how many primary units one unit of a quotation line holds
  private async findPrimaryPerUnit(quotations: PurchaseQuotationDto[]): Promise<Map<string, number>> {
    const primaryPerUnit = new Map<string, number>();
    for (const item of quotations.flatMap((quotation) => quotation.items)) {
      const key = PurchaseDetailQuotationDto.unitKey(item.inventoryItemId, item.uomId);
      if (primaryPerUnit.has(key)) continue;
      primaryPerUnit.set(
        key,
        await this.uomConversionsService.toPrimaryUomQuantity(item.inventoryItemId, item.uomId, 1),
      );
    }
    return primaryPerUnit;
  }

  // Runs a step in the legal entity's own workspace, which RLS requires to write or read its draft quotations
  inLegalEntityWorkspace<T>(headers: NatsHeaders, run: () => Promise<T>): Promise<T> {
    return this.database.runWithRlsContext({ ...headers, siteId: '', siteTimezone: '' }, run);
  }
}

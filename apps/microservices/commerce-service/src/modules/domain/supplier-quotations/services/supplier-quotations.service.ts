import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, asc, desc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { majorToMinor } from '@vritti/api-sdk/money';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import {
  type SupplierQuotation,
  type SupplierQuotationItem,
  type SupplierQuotationSite,
  supplierQuotations,
} from '@/db/schema';
import {
  PurchaseItemQuotationLineDto,
  PurchaseQuotationDto,
  PurchaseQuotationTableRowDto,
} from '../dto/entity/purchase-quotation.dto';
import { PurchaseQuotationItemTermsDto } from '../dto/entity/purchase-quotation-item-terms.dto';
import { SupplierQuotationDetailDto, SupplierQuotationDto } from '../dto/entity/supplier-quotation.dto';
import { SupplierQuotationCountsDto } from '../dto/entity/supplier-quotation-counts.dto';
import type { CreatePurchaseQuotationDraftDto } from '../dto/request/create-purchase-quotation-draft.dto';
import type { CreateSupplierQuotationDto } from '../dto/request/create-supplier-quotation.dto';
import type { SupplierQuotationItemFieldsDto } from '../dto/request/supplier-quotation-item-fields.dto';
import type { UpdateSupplierQuotationDto } from '../dto/request/update-supplier-quotation.dto';
import {
  type SiteOwnedQuotation,
  SupplierQuotationsDomainRepository,
} from '../repositories/supplier-quotations.repository';

@Injectable()
export class SupplierQuotationsDomainService {
  private readonly logger = new Logger(SupplierQuotationsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    quotationNumber: { column: supplierQuotations.quotationNumber, type: 'string' },
    quotationDate: { column: supplierQuotations.quotationDate, type: 'string' },
    validFrom: { column: supplierQuotations.validFrom, type: 'string' },
    validTo: { column: supplierQuotations.validTo, type: 'string' },
  };

  constructor(private readonly repository: SupplierQuotationsDomainRepository) {}

  // Records a draft quotation in a currency the caller has checked is one of the supplier's
  async create(data: CreateSupplierQuotationDto, currencyCode: string): Promise<SupplierQuotationDto> {
    SupplierQuotationsDomainService.assertValidity(data.validFrom, data.validTo ?? null);
    await this.assertNumberFree(data.supplierId, data.quotationNumber);
    const entity = await this.repository.create({
      supplierId: data.supplierId,
      quotationNumber: data.quotationNumber,
      quotationDate: data.quotationDate,
      currencyCode,
      validFrom: data.validFrom,
      validTo: data.validTo,
      note: data.note,
    });
    this.logger.log(`Created supplier quotation ${entity.quotationNumber} (${entity.id})`);
    return SupplierQuotationDto.from({ ...entity, itemCount: 0, siteCount: 0, canWrite: true });
  }

  // Records a draft quotation the purchase's site owns, one unpriced line per purchase item, numbered after the purchase
  async createDraftForPurchase(input: CreatePurchaseQuotationDraftDto): Promise<{ quotationId: string }> {
    if (input.lines.length === 0) {
      throw new BadRequestException({
        label: 'No Items',
        detail: 'Add the items to buy to the purchase before requesting a quotation for them.',
      });
    }
    const quotationNumber = SupplierQuotationsDomainService.nextFreeNumber(
      input.purchaseNumber,
      await this.repository.findNumbersStartingWith(input.supplierId, input.purchaseNumber),
    );
    const quotation = await this.repository.transaction(async () => {
      const created = await this.repository.create({
        siteId: input.siteId,
        supplierId: input.supplierId,
        purchaseId: input.purchaseId,
        quotationNumber,
        quotationDate: input.validFrom,
        currencyCode: input.currencyCode,
        validFrom: input.validFrom,
      });
      await this.repository.insertItems(
        input.lines.map((line) => ({
          quotationId: created.id,
          purchaseItemId: line.purchaseItemId,
          inventoryItemId: line.inventoryItemId,
          uomId: line.uomId,
          unitPrice: 0n,
        })),
      );
      return created;
    });
    this.logger.log(`Created quotation ${quotationNumber} (${quotation.id}) for purchase ${input.purchaseId}`);
    return { quotationId: quotation.id };
  }

  // Adds a line to a draft quotation; the caller has checked the unit is the item's and resolved the quoted MRP
  async addItem(
    quotation: SupplierQuotation,
    item: { inventoryItemId: string; uomId: string },
    fields: SupplierQuotationItemFieldsDto,
    currencyCode: string,
    mrpId: string | null,
  ): Promise<void> {
    await this.assertDraft(quotation);
    if (await this.repository.findItemByInventoryItem(quotation.id, item.inventoryItemId, item.uomId)) {
      throw new ConflictException({
        label: 'Item Already Quoted',
        detail: 'This item is already on the quotation in this unit. Edit its line instead.',
        errors: [{ field: 'inventoryItemId', message: 'Already on the quotation' }],
      });
    }
    await this.repository.insertItem({
      quotationId: quotation.id,
      inventoryItemId: item.inventoryItemId,
      uomId: item.uomId,
      ...SupplierQuotationsDomainService.toItemColumns(fields, currencyCode),
      mrpId,
    });
  }

  // Updates the header; the validity is what the posted prices carry, so it changes only while the quotation is a draft,
  // and the currency only while it has no lines either
  async update(data: UpdateSupplierQuotationDto): Promise<SuccessResponseDto> {
    const { id, ...fields } = data;
    const existing = await this.requireQuotation(id);
    const validityChanged =
      (fields.validFrom !== undefined && fields.validFrom !== existing.validFrom) ||
      (fields.validTo !== undefined && (fields.validTo ?? null) !== existing.validTo);
    if (validityChanged) await this.assertDraft(existing);
    if (fields.currencyCode !== undefined && fields.currencyCode !== existing.currencyCode) {
      await this.assertDraft(existing);
      if ((await this.repository.findItems(id)).length > 0) {
        throw new BadRequestException({
          label: 'Quotation Has Lines',
          detail: `The lines are priced in ${existing.currencyCode}; remove them before changing the quotation's currency.`,
          errors: [{ field: 'currencyCode', message: `Lines are priced in ${existing.currencyCode}` }],
        });
      }
    }
    SupplierQuotationsDomainService.assertValidity(
      fields.validFrom ?? existing.validFrom,
      fields.validTo !== undefined ? (fields.validTo ?? null) : existing.validTo,
    );
    if (fields.quotationNumber && fields.quotationNumber !== existing.quotationNumber) {
      await this.assertNumberFree(existing.supplierId, fields.quotationNumber);
    }
    if (Object.keys(fields).length > 0) await this.repository.update(id, fields);
    return { success: true, message: 'Quotation updated successfully.' };
  }

  async updateItem(
    quotation: SupplierQuotation,
    item: SupplierQuotationItem,
    fields: SupplierQuotationItemFieldsDto,
    currencyCode: string,
    mrpId: string | null,
  ): Promise<void> {
    await this.assertDraft(quotation);
    await this.repository.updateItem(item.id, {
      ...SupplierQuotationsDomainService.toItemColumns(fields, currencyCode),
      mrpId,
    });
  }

  recordSite(
    quotation: SupplierQuotation,
    siteId: string | null,
    postedBy: string | null,
  ): Promise<SupplierQuotationSite> {
    return this.repository.insertSite({ quotationId: quotation.id, siteId, ownerSiteId: quotation.siteId, postedBy });
  }

  // Returns a supplier's quotations for the data table, only those posted to the named site when one is named
  async findForSupplierTable(
    supplierId: string,
    state: TableState,
    siteId?: string,
  ): Promise<{ result: SupplierQuotationDto[]; count: number }> {
    const fieldMap = SupplierQuotationsDomainService.FIELD_MAP;
    const { limit = 20, offset = 0 } = state.pagination;
    const { result, count } = await this.repository.findForSupplierTable(supplierId, {
      siteId,
      where: and(
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, fieldMap),
      ),
      orderBy: FilterProcessor.buildOrderBy(state.sort, fieldMap),
      limit,
      offset,
    });
    return { result: result.map(SupplierQuotationDto.from), count };
  }

  // Counts a quotation's lines and the sites it is posted to, one per tab of its page; a named supplier must own it
  async findCounts(quotationId: string, supplierId?: string): Promise<SupplierQuotationCountsDto> {
    return SupplierQuotationCountsDto.from(await this.repository.findCountsOrThrow(quotationId, supplierId));
  }

  // Returns a quotation with its lines and the sites it is posted to
  async findDetail(id: string): Promise<SupplierQuotationDetailDto> {
    const quotation = await this.repository.findRow(id);
    if (!quotation) throw new NotFoundException('Quotation not found.');
    const [items, sites] = await Promise.all([this.repository.findItems(id), this.repository.findSites(id)]);
    return SupplierQuotationDetailDto.fromDetail(quotation, items, sites);
  }

  // Returns one of a supplier's quotations the request can read, with its lines and the sites it is posted to
  async findDetailOfSupplier(supplierId: string, quotationId: string): Promise<SupplierQuotationDetailDto> {
    const quotation = await this.repository.findForSupplier(supplierId, quotationId);
    if (!quotation) throw new NotFoundException('Quotation not found.');
    const [items, sites] = await Promise.all([
      this.repository.findItems(quotationId),
      this.repository.findSites(quotationId),
    ]);
    return SupplierQuotationDetailDto.fromDetail(quotation, items, sites);
  }

  async requireQuotation(id: string): Promise<SupplierQuotation> {
    const quotation = await this.repository.findById(id);
    if (!quotation) throw new NotFoundException('Quotation not found.');
    return quotation;
  }

  // Returns the quotations a purchase requested with their lines, each marked posted when it is posted to the site or

  // Returns one page of the quotations a purchase requested, newest first, without their lines
  async findForPurchaseTable(
    purchaseId: string,
    siteId: string,
    state: TableState,
  ): Promise<{ result: PurchaseQuotationTableRowDto[]; count: number }> {
    const fieldMap: FieldMap = {
      quotationNumber: { column: supplierQuotations.quotationNumber, type: 'string' },
      supplierId: { column: supplierQuotations.supplierId, type: 'string' },
      validFrom: { column: supplierQuotations.validFrom, type: 'string' },
    };
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { limit = 50, offset = 0 } = state.pagination;
    const { result, count } = await this.repository.findForPurchaseTable(purchaseId, siteId, {
      where: and(
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, { quotationNumber: fieldMap.quotationNumber }),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [desc(supplierQuotations.createdAt)],
      limit,
      offset,
    });
    return { result: result.map(PurchaseQuotationTableRowDto.from), count };
  }

  // Returns the ids of a quotation's lines that quote an item of the purchase it was requested for
  findLineIdsForPurchase(purchaseId: string, quotationId: string): Promise<string[]> {
    return this.repository.findLineIdsForPurchase(purchaseId, quotationId);
  }

  // Returns one page of the lines of a purchase's quotations that quote one of its items, narrowed and ordered by the
  // table's state
  async findForPurchaseItemTable(
    purchaseId: string,
    siteId: string,
    purchaseItemId: string,
    state: TableState,
  ): Promise<{ result: PurchaseItemQuotationLineDto[]; count: number }> {
    const fieldMap: FieldMap = {
      supplierId: { column: supplierQuotations.supplierId, type: 'string' },
      quotationNumber: { column: supplierQuotations.quotationNumber, type: 'string' },
      validFrom: { column: supplierQuotations.validFrom, type: 'string' },
    };
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { limit = 50, offset = 0 } = state.pagination;
    const { result, count } = await this.repository.findForPurchaseItemTable(purchaseId, purchaseItemId, siteId, {
      where: FilterProcessor.buildWhere(state.filters, fieldMap),
      orderBy: orderBy.length > 0 ? orderBy : [asc(supplierQuotations.quotationNumber)],
      limit,
      offset,
    });
    return { result: result.map(PurchaseItemQuotationLineDto.from), count };
  }

  // Returns the quotations a purchase requested that quote any of the given purchase items, each with only those lines
  async findForPurchaseItems(
    purchaseId: string,
    siteId: string,
    purchaseItemIds: string[],
  ): Promise<PurchaseQuotationDto[]> {
    const lines = await this.repository.findItemsForPurchaseItems(purchaseId, [...new Set(purchaseItemIds)]);
    if (lines.length === 0) return [];
    const quotations = await this.repository.findForPurchase(purchaseId, siteId);
    return quotations.flatMap((quotation) => {
      const quoted = lines.filter((line) => line.quotationId === quotation.id);
      return quoted.length > 0 ? [PurchaseQuotationDto.from(quotation, quoted)] : [];
    });
  }

  // Returns the terms of the given lines of the purchase's quotations posted to the site or its legal entity and valid
  // on the day; lines that are not are left out
  async findPostedItemsForPurchase(
    purchaseId: string,
    siteId: string,
    quotationItemIds: string[],
    onDate: string,
  ): Promise<PurchaseQuotationItemTermsDto[]> {
    if (quotationItemIds.length === 0) return [];
    const rows = await this.repository.findPostedItemsForPurchase(
      purchaseId,
      siteId,
      [...new Set(quotationItemIds)],
      onDate,
    );
    return rows.map(PurchaseQuotationItemTermsDto.from);
  }

  // Counts, per purchase item, the suppliers whose quotation for the purchase quotes it, is posted to the site or its legal
  // entity and is valid on the day
  countQuotingSuppliersByItem(
    purchaseId: string,
    siteId: string,
    purchaseItemIds: string[],
    onDate: string,
  ): Promise<Map<string, number>> {
    return this.repository.countQuotingSuppliersByItem(purchaseId, siteId, [...new Set(purchaseItemIds)], onDate);
  }

  // Counts the quotations the purchase requested that the workspace can read, drafts included
  countForPurchase(purchaseId: string): Promise<number> {
    return this.repository.countForPurchase(purchaseId);
  }

  async requireItem(quotationId: string, itemId: string): Promise<SupplierQuotationItem> {
    const item = await this.repository.findItem(quotationId, itemId);
    if (!item) throw new NotFoundException('Quotation line not found.');
    return item;
  }

  findItems(quotationId: string) {
    return this.repository.findItems(quotationId);
  }

  findSite(quotationId: string, siteId: string | null): Promise<SupplierQuotationSite | undefined> {
    return this.repository.findSite(quotationId, siteId);
  }

  // Loads a quotation the request's site owns, rejecting one another site posted to it
  findOwnedByRequestSiteOrThrow(quotationId: string): Promise<SiteOwnedQuotation> {
    return this.repository.findOwnedByRequestSiteOrThrow(quotationId);
  }

  // Rejects changing a quotation the request's site does not own
  assertOwnedByRequestSite(quotationId: string): Promise<void> {
    return this.repository.assertOwnedByRequestSite(quotationId);
  }

  // The quotation's posting to the request's site, throwing when it is not posted here
  findPostingAtRequestSiteOrThrow(quotationId: string): Promise<SupplierQuotationSite> {
    return this.repository.findPostingAtRequestSiteOrThrow(quotationId);
  }

  findSites(quotationId: string): Promise<SupplierQuotationSite[]> {
    return this.repository.findSites(quotationId);
  }

  // Deletes a quotation that is not posted to any site
  async delete(id: string): Promise<void> {
    const existing = await this.requireQuotation(id);
    await this.assertDraft(existing, 'Remove the quotation from every site before deleting it.');
    await this.repository.delete(id);
    this.logger.log(`Deleted supplier quotation ${existing.quotationNumber} (${id})`);
  }

  async removeItem(quotation: SupplierQuotation, itemId: string): Promise<void> {
    await this.assertDraft(quotation);
    const item = await this.requireItem(quotation.id, itemId);
    await this.repository.deleteItem(item.id);
  }

  removeSiteRecord(quotationSiteId: string): Promise<void> {
    return this.repository.deleteSite(quotationSiteId);
  }

  // Lines and validity are fixed once the quotation's prices exist at any site
  private async assertDraft(
    quotation: SupplierQuotation,
    detail = 'The quotation is posted to sites, so its lines and validity are fixed. Remove it from every site to change them.',
  ): Promise<void> {
    if ((await this.repository.countSites(quotation.id)) === 0) return;
    throw new BadRequestException({ label: 'Quotation Posted', detail });
  }

  private async assertNumberFree(supplierId: string, quotationNumber: string): Promise<void> {
    if (!(await this.repository.findByNumber(supplierId, quotationNumber))) return;
    throw new ConflictException({
      label: 'Quotation Number Exists',
      detail: `This supplier already has a quotation numbered "${quotationNumber}".`,
      errors: [{ field: 'quotationNumber', message: 'Already used for this supplier' }],
    });
  }

  // The purchase number when the supplier has no quotation by it, else the first free "<number>-<n>" from 2 up
  private static nextFreeNumber(purchaseNumber: string, taken: string[]): string {
    const takenNumbers = new Set(taken);
    if (!takenNumbers.has(purchaseNumber)) return purchaseNumber;
    let suffix = 2;
    while (takenNumbers.has(`${purchaseNumber}-${suffix}`)) suffix += 1;
    return `${purchaseNumber}-${suffix}`;
  }

  private static assertValidity(validFrom: string, validTo: string | null): void {
    if (!validTo || validTo >= validFrom) return;
    throw new BadRequestException({
      label: 'Invalid Validity',
      detail: 'The end date cannot be before the start date.',
      errors: [{ field: 'validTo', message: 'Before the start date' }],
    });
  }

  // Converts a line's form fields to columns, rejecting an amount in another currency or a half-filled scheme
  private static toItemColumns(fields: SupplierQuotationItemFieldsDto, currencyCode: string) {
    for (const [field, amount] of [
      ['unitPrice', fields.unitPrice],
      ['mrp', fields.mrp],
    ] as const) {
      if (!amount || amount.currency === currencyCode) continue;
      throw new BadRequestException({
        label: 'Wrong Currency',
        detail: `Amounts must be in the supplier's currency (${currencyCode}).`,
        errors: [{ field, message: `Must be in ${currencyCode}` }],
      });
    }
    const hasBuy = fields.schemeBuyQty != null;
    const hasFree = fields.schemeFreeQty != null;
    if (hasBuy !== hasFree) {
      throw new BadRequestException({
        label: 'Incomplete Scheme',
        detail: 'A scheme needs both the bought and the free quantity.',
        errors: [{ field: hasBuy ? 'schemeFreeQty' : 'schemeBuyQty', message: 'Required with a scheme' }],
      });
    }
    return {
      supplierItemCode: fields.supplierItemCode ?? null,
      unitPrice: majorToMinor(fields.unitPrice.value, fields.unitPrice.currency, 'unitPrice'),
      schemeBuyQty: fields.schemeBuyQty ?? null,
      schemeFreeQty: fields.schemeFreeQty ?? null,
      taxInclusive: fields.taxInclusive ?? false,
    };
  }
}

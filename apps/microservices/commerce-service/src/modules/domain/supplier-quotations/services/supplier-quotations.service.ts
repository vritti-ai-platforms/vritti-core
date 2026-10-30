import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { majorToMinor } from '@vritti/api-sdk/money';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import {
  type SupplierQuotation,
  type SupplierQuotationItem,
  type SupplierQuotationSite,
  supplierQuotations,
} from '@/db/schema';
import { SupplierQuotationDetailDto, SupplierQuotationDto } from '../dto/entity/supplier-quotation.dto';
import type { CreateSupplierQuotationDto } from '../dto/request/create-supplier-quotation.dto';
import type { SupplierQuotationItemFieldsDto } from '../dto/request/supplier-quotation-item-fields.dto';
import type { UpdateSupplierQuotationDto } from '../dto/request/update-supplier-quotation.dto';
import { SupplierQuotationsDomainRepository } from '../repositories/supplier-quotations.repository';

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

  // Returns a supplier's quotations for the data table, or only those posted to one site
  async findForSupplierTable(
    supplierId: string,
    state: TableViewState,
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

  // Returns a quotation with its lines and the sites it is posted to
  async findDetail(id: string): Promise<SupplierQuotationDetailDto> {
    const quotation = await this.requireQuotation(id);
    const [items, sites] = await Promise.all([this.repository.findItems(id), this.repository.findSites(id)]);
    return SupplierQuotationDetailDto.fromDetail(quotation, items, sites);
  }

  async requireQuotation(id: string): Promise<SupplierQuotation> {
    const quotation = await this.repository.findById(id);
    if (!quotation) throw new NotFoundException('Quotation not found.');
    return quotation;
  }

  // Records a draft quotation in a currency the caller has checked is one of the supplier's
  async create(
    data: CreateSupplierQuotationDto,
    currencyCode: string,
    createdBy: string | null,
  ): Promise<SupplierQuotationDto> {
    SupplierQuotationsDomainService.assertValidity(data.validFrom, data.validTo ?? null);
    await this.assertNumberFree(data.supplierId, data.quotationNumber);
    const entity = await this.repository.create({
      supplierId: data.supplierId,
      quotationNumber: data.quotationNumber,
      quotationDate: data.quotationDate,
      currencyCode,
      validFrom: data.validFrom,
      validTo: data.validTo ?? null,
      note: data.note ?? null,
      createdBy,
    });
    this.logger.log(`Created supplier quotation ${entity.quotationNumber} (${entity.id})`);
    return SupplierQuotationDto.from({ ...entity, itemCount: 0, siteCount: 0 });
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

  // Deletes a quotation that is not posted to any site
  async delete(id: string): Promise<void> {
    const existing = await this.requireQuotation(id);
    await this.assertDraft(existing, 'Remove the quotation from every site before deleting it.');
    await this.repository.delete(id);
    this.logger.log(`Deleted supplier quotation ${existing.quotationNumber} (${id})`);
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

  async removeItem(quotation: SupplierQuotation, itemId: string): Promise<void> {
    await this.assertDraft(quotation);
    const item = await this.requireItem(quotation.id, itemId);
    await this.repository.deleteItem(item.id);
  }

  async requireItem(quotationId: string, itemId: string): Promise<SupplierQuotationItem> {
    const item = await this.repository.findItem(quotationId, itemId);
    if (!item) throw new NotFoundException('Quotation line not found.');
    return item;
  }

  findItems(quotationId: string) {
    return this.repository.findItems(quotationId);
  }

  findSite(quotationId: string, siteId: string): Promise<SupplierQuotationSite | undefined> {
    return this.repository.findSite(quotationId, siteId);
  }

  findSites(quotationId: string): Promise<SupplierQuotationSite[]> {
    return this.repository.findSites(quotationId);
  }

  recordSite(quotationId: string, siteId: string, postedBy: string | null): Promise<SupplierQuotationSite> {
    return this.repository.insertSite({ quotationId, siteId, postedBy });
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

import { InventoryItemMrpsDomainService } from '@domain/inventory-item-mrps/services/inventory-item-mrps.service';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import {
  type QuotationPriceLine,
  SupplierItemPricesDomainService,
} from '@domain/supplier-item-prices/services/supplier-item-prices.service';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import type {
  SupplierQuotationDetailDto,
  SupplierQuotationDto,
} from '@domain/supplier-quotations/dto/entity/supplier-quotation.dto';
import type { AddSupplierQuotationItemDto } from '@domain/supplier-quotations/dto/request/add-supplier-quotation-item.dto';
import type { CreateSupplierQuotationDto } from '@domain/supplier-quotations/dto/request/create-supplier-quotation.dto';
import type { UpdateSupplierQuotationDto } from '@domain/supplier-quotations/dto/request/update-supplier-quotation.dto';
import type { UpdateSupplierQuotationItemDto } from '@domain/supplier-quotations/dto/request/update-supplier-quotation-item.dto';
import { SupplierQuotationsDomainService } from '@domain/supplier-quotations/services/supplier-quotations.service';
import { SupplierSitesDomainService } from '@domain/supplier-sites/services/supplier-sites.service';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CurrencyAmountDto, majorToMinor } from '@vritti/api-sdk/money';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

// Quotations at the legal entity: the document lives in the quotations domain, the prices it posts live with the
// supplier's items, so posting and removal run across both in one transaction
@Injectable()
export class LeSupplierQuotationsService {
  private readonly logger = new Logger(LeSupplierQuotationsService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly quotations: SupplierQuotationsDomainService,
    private readonly supplierItems: SupplierItemsDomainService,
    private readonly supplierItemPrices: SupplierItemPricesDomainService,
    private readonly supplierSites: SupplierSitesDomainService,
    private readonly suppliers: SuppliersDomainService,
    private readonly inventoryItems: InventoryItemsDomainService,
    private readonly mrps: InventoryItemMrpsDomainService,
  ) {}

  table(
    supplierId: string,
    state: TableViewState,
    siteId?: string,
  ): Promise<{ result: SupplierQuotationDto[]; count: number }> {
    return this.quotations.findForSupplierTable(supplierId, state, siteId);
  }

  findById(id: string): Promise<SupplierQuotationDetailDto> {
    return this.quotations.findDetail(id);
  }

  async create(
    dto: CreateSupplierQuotationDto,
    userId: string | null,
  ): Promise<CreateResponseDto<SupplierQuotationDto>> {
    const supplier = await this.suppliers.findById(dto.supplierId);
    const currencyCode = dto.currencyCode ?? supplier.currencyCode;
    LeSupplierQuotationsService.assertSupplierCurrency(supplier.currencyCodes, currencyCode);
    const data = await this.quotations.create(dto, currencyCode, userId);
    return { success: true, message: `Quotation "${data.quotationNumber}" created as a draft.`, data };
  }

  async update(dto: UpdateSupplierQuotationDto): Promise<SuccessResponseDto> {
    if (dto.currencyCode !== undefined) {
      const quotation = await this.quotations.requireQuotation(dto.id);
      const supplier = await this.suppliers.findById(quotation.supplierId);
      LeSupplierQuotationsService.assertSupplierCurrency(supplier.currencyCodes, dto.currencyCode);
    }
    return this.quotations.update(dto);
  }

  // Deletes a quotation; removing it from every site first takes its prices with it
  async delete(id: string): Promise<SuccessResponseDto> {
    const quotation = await this.quotations.requireQuotation(id);
    await this.database.runInTransaction(async () => {
      for (const site of await this.quotations.findSites(id)) {
        await this.supplierItemPrices.removeQuotationPrices(site.id);
        await this.quotations.removeSiteRecord(site.id);
      }
      await this.quotations.delete(id);
    });
    return { success: true, message: `Quotation "${quotation.quotationNumber}" deleted.` };
  }

  async addItem(dto: AddSupplierQuotationItemDto): Promise<SuccessResponseDto> {
    const { quotationId, inventoryItemId, uomId, ...fields } = dto;
    const quotation = await this.quotations.requireQuotation(quotationId);
    await this.assertUomAllowed(inventoryItemId, uomId);
    const { currencyCode } = quotation;
    // One transaction, so a rejected line does not leave its newly recorded MRP behind
    await this.database.runInTransaction(async () => {
      const mrpId = await this.resolveMrp(inventoryItemId, uomId, currencyCode, fields.mrp);
      await this.quotations.addItem(quotation, { inventoryItemId, uomId }, fields, currencyCode, mrpId);
    });
    return { success: true, message: 'Line added.' };
  }

  async updateItem(dto: UpdateSupplierQuotationItemDto): Promise<SuccessResponseDto> {
    const { quotationId, id, ...fields } = dto;
    const quotation = await this.quotations.requireQuotation(quotationId);
    const item = await this.quotations.requireItem(quotationId, id);
    const { currencyCode } = quotation;
    await this.database.runInTransaction(async () => {
      // An MRP the request leaves out stays as it is; null clears it
      const mrpId =
        fields.mrp === undefined
          ? item.mrpId
          : await this.resolveMrp(item.inventoryItemId, item.uomId, currencyCode, fields.mrp);
      await this.quotations.updateItem(quotation, item, fields, currencyCode, mrpId);
    });
    return { success: true, message: 'Line updated.' };
  }

  async removeItem(quotationId: string, id: string): Promise<SuccessResponseDto> {
    const quotation = await this.quotations.requireQuotation(quotationId);
    await this.quotations.removeItem(quotation, id);
    return { success: true, message: 'Line removed.' };
  }

  // Posts the quotation to a site: every line becomes the site's price from the quotation's start date, creating the
  // supplier item and setting it up at the site where either is missing
  async postToSite(quotationId: string, siteId: string, userId: string | null): Promise<SuccessResponseDto> {
    const quotation = await this.quotations.requireQuotation(quotationId);
    if (await this.quotations.findSite(quotationId, siteId)) {
      throw new ConflictException({ label: 'Already Posted', detail: 'The quotation is already posted to this site.' });
    }
    const items = await this.quotations.findItems(quotationId);
    if (items.length === 0) {
      throw new BadRequestException({
        label: 'No Lines',
        detail: 'Add at least one line before posting the quotation.',
      });
    }
    if (!(await this.supplierSites.isEnrolled(quotation.supplierId, siteId))) {
      throw new BadRequestException({
        label: 'Supplier Not Enrolled',
        detail: 'Enroll the supplier at this site before posting the quotation to it.',
        errors: [{ field: 'siteId', message: 'Supplier not enrolled' }],
      });
    }
    const posted = await this.database.runInTransaction(async () => {
      const site = await this.quotations.recordSite(quotationId, siteId, userId);
      // Each line's item becomes the supplier's at the site first, then the line is priced there
      const lines: QuotationPriceLine[] = [];
      for (const item of items) {
        const supplierItemId = await this.supplierItems.findOrCreateItemAtSite(
          {
            supplierId: quotation.supplierId,
            inventoryItemId: item.inventoryItemId,
            uomId: item.uomId,
            supplierItemCode: item.supplierItemCode ?? null,
          },
          siteId,
        );
        lines.push({
          supplierItemId,
          currencyCode: quotation.currencyCode,
          unitPrice: item.unitPrice,
          mrpId: item.mrpId ?? null,
          schemeBuyQty: item.schemeBuyQty ?? null,
          schemeFreeQty: item.schemeFreeQty ?? null,
          taxInclusive: item.taxInclusive,
        });
      }
      return this.supplierItemPrices.postQuotationPrices(
        site.id,
        siteId,
        lines,
        {
          validFrom: quotation.validFrom,
          validTo: quotation.validTo ?? null,
          note: `Quotation ${quotation.quotationNumber}`,
        },
        userId,
      );
    });
    this.logger.log(`Posted quotation ${quotation.quotationNumber} to site ${siteId}: ${posted} prices`);
    return { success: true, message: `Posted ${pluralize('price', posted, true)} to the site.` };
  }

  // Removes the quotation from a site as though it was never posted there: its prices go, earlier prices return
  async removeFromSite(quotationId: string, siteId: string): Promise<SuccessResponseDto> {
    const quotation = await this.quotations.requireQuotation(quotationId);
    const site = await this.quotations.findSite(quotationId, siteId);
    if (!site) throw new NotFoundException('The quotation is not posted to this site.');
    const removed = await this.database.runInTransaction(async () => {
      const count = await this.supplierItemPrices.removeQuotationPrices(site.id);
      await this.quotations.removeSiteRecord(site.id);
      return count;
    });
    this.logger.log(`Removed quotation ${quotation.quotationNumber} from site ${siteId}: ${removed} prices`);
    return { success: true, message: `Removed ${pluralize('price', removed, true)} from the site.` };
  }

  // The quoted MRP as one of the item's MRPs in the line's unit — reusing an equal amount, recording a new one
  private async resolveMrp(
    inventoryItemId: string,
    uomId: string,
    currencyCode: string,
    mrp: CurrencyAmountDto | null | undefined,
  ): Promise<string | null> {
    if (!mrp) return null;
    if (mrp.currency !== currencyCode) {
      throw new BadRequestException({
        label: 'Wrong Currency',
        detail: `The MRP must be in the quotation's currency (${currencyCode}).`,
        errors: [{ field: 'mrp', message: `Must be in ${currencyCode}` }],
      });
    }
    const row = await this.mrps.findOrRecord(
      inventoryItemId,
      uomId,
      currencyCode,
      majorToMinor(mrp.value, currencyCode, 'mrp'),
    );
    return row.id;
  }

  // A quotation is in one of the currencies its supplier trades in
  private static assertSupplierCurrency(supplierCurrencies: string[], currencyCode: string): void {
    if (supplierCurrencies.includes(currencyCode)) return;
    throw new BadRequestException({
      label: 'Currency Not Accepted',
      detail: `This supplier trades in ${supplierCurrencies.join(', ')}, not ${currencyCode}.`,
      errors: [{ field: 'currencyCode', message: "Not one of the supplier's currencies" }],
    });
  }

  // A line's unit must be one the item can be bought in: its base unit, a per-item conversion, or its unit family
  private async assertUomAllowed(inventoryItemId: string, uomId: string): Promise<void> {
    const { allowedUomIds } = await this.inventoryItems.findAllowedUomIds(inventoryItemId);
    if (allowedUomIds.includes(uomId)) return;
    throw new BadRequestException({
      label: 'Invalid UOM',
      detail: 'The selected unit is not one this item can be bought in. Define a per-item conversion first.',
      errors: [{ field: 'uomId', message: 'Not a unit of this item' }],
    });
  }
}

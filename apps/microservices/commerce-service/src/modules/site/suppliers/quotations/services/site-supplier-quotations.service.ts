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
import { Injectable } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LeSupplierQuotationsService } from '@/modules/legal-entity/suppliers/quotations/services/supplier-quotations.service';

// Quotations at a site: it writes, posts and deletes the quotations it owns, and removes any posted to it; the legal
// entity's quotation service runs the shared work once the site's own rules pass
@Injectable()
export class SiteSupplierQuotationsService {
  constructor(
    private readonly quotations: SupplierQuotationsDomainService,
    private readonly supplierItems: SupplierItemsDomainService,
    private readonly legalEntityQuotations: LeSupplierQuotationsService,
  ) {}

  // Creates a draft quotation the site owns
  create(dto: CreateSupplierQuotationDto): Promise<CreateResponseDto<SupplierQuotationDto>> {
    return this.legalEntityQuotations.create(dto);
  }

  // Adds a line to a quotation the site owns
  async addItem(dto: AddSupplierQuotationItemDto): Promise<SuccessResponseDto> {
    await this.quotations.assertOwnedByRequestSite(dto.quotationId);
    return this.legalEntityQuotations.addItem(dto);
  }

  // Changes the header of a quotation the site owns
  async update(dto: UpdateSupplierQuotationDto): Promise<SuccessResponseDto> {
    await this.quotations.assertOwnedByRequestSite(dto.id);
    return this.legalEntityQuotations.update(dto);
  }

  // Changes a line of a quotation the site owns
  async updateItem(dto: UpdateSupplierQuotationItemDto): Promise<SuccessResponseDto> {
    await this.quotations.assertOwnedByRequestSite(dto.quotationId);
    return this.legalEntityQuotations.updateItem(dto);
  }

  // Posts a quotation the site owns to the site, once the supplier has an item for every line
  async post(quotationId: string, userId: string | null): Promise<SuccessResponseDto> {
    await this.quotations.assertOwnedByRequestSite(quotationId);
    const quotation = await this.quotations.requireQuotation(quotationId);
    await this.supplierItems.assertHasItemsFor(quotation.supplierId, await this.quotations.findItems(quotationId));
    return this.legalEntityQuotations.postToSite(quotationId, quotation.siteId, userId);
  }

  // Returns one of the supplier's quotations the site can read — its own, or one posted to it or to the legal entity
  findById(supplierId: string, quotationId: string): Promise<SupplierQuotationDetailDto> {
    return this.quotations.findDetailOfSupplier(supplierId, quotationId);
  }

  // Returns the supplier's quotations the site can read
  table(supplierId: string, state: TableState): Promise<{ result: SupplierQuotationDto[]; count: number }> {
    return this.quotations.findForSupplierTable(supplierId, state);
  }

  // Deletes a quotation the site owns while it is posted nowhere but the site; elsewhere the legal entity or that site
  // removes it first
  async delete(id: string): Promise<SuccessResponseDto> {
    await this.quotations.assertOwnedByRequestSite(id);
    const quotation = await this.quotations.requireQuotation(id);
    const elsewhere = (await this.quotations.findSites(id)).filter((site) => site.siteId !== quotation.siteId);
    if (elsewhere.length > 0) {
      throw new ConflictException({
        label: 'Posted Elsewhere',
        detail: `"${quotation.quotationNumber}" is posted beyond this site. The legal entity or those sites remove it there first.`,
      });
    }
    return this.legalEntityQuotations.delete(id);
  }

  // Removes a line from a quotation the site owns
  async removeItem(quotationId: string, id: string): Promise<SuccessResponseDto> {
    await this.quotations.assertOwnedByRequestSite(quotationId);
    return this.legalEntityQuotations.removeItem(quotationId, id);
  }

  // Removes a quotation posted to the site, whoever owns it, taking its prices here with it
  async removeFromSite(quotationId: string): Promise<SuccessResponseDto> {
    const posting = await this.quotations.findPostingAtRequestSiteOrThrow(quotationId);
    return this.legalEntityQuotations.removeFromSite(quotationId, posting.siteId);
  }
}

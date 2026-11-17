import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
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
import { BadRequestException, ConflictException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LeSupplierQuotationsService } from '@/modules/legal-entity/suppliers/quotations/services/supplier-quotations.service';
import { PurchasingRulesService } from '@/modules/site/purchasing-rules/services/purchasing-rules.service';

// Quotations at a site: it writes, posts and deletes the quotations it owns, and removes any posted to it; the legal
// entity's quotation service runs the shared work once the site's own rules pass
@Injectable()
export class SiteSupplierQuotationsService {
  constructor(
    private readonly quotations: SupplierQuotationsDomainService,
    private readonly supplierItems: SupplierItemsDomainService,
    private readonly supplierEnrollments: SupplierEnrollmentsDomainService,
    private readonly purchasingRules: PurchasingRulesService,
    private readonly legalEntityQuotations: LeSupplierQuotationsService,
  ) {}

  // Creates a draft quotation the site owns
  create(dto: CreateSupplierQuotationDto): Promise<CreateResponseDto<SupplierQuotationDto>> {
    return this.legalEntityQuotations.create(dto);
  }

  // Adds a line to a quotation the site owns; an item the site's rules buy only from suppliers set up for it needs the
  // supplier's item in that unit
  async addItem(dto: AddSupplierQuotationItemDto): Promise<SuccessResponseDto> {
    const quotation = await this.quotations.findOwnedByRequestSiteOrThrow(dto.quotationId);
    await this.purchasingRules.assertSourced(quotation.supplierId, quotation.siteId, [dto], 'inventoryItemId');
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

  // Posts a quotation the site owns to the site: each line's supplier item — created by the site when its rules allow,
  // which needs the supplier's enrollment there active — set up at the site and priced there
  async post(quotationId: string, userId: string | null): Promise<SuccessResponseDto> {
    const quotation = await this.quotations.findOwnedByRequestSiteOrThrow(quotationId);
    const lines = await this.quotations.findItems(quotationId);
    await this.purchasingRules.assertSourced(quotation.supplierId, quotation.siteId, lines, 'items');
    const createsSupplierItems = !(await this.supplierItems.isEverySetUp(quotation.supplierId, lines));
    if (createsSupplierItems) await this.assertActiveAt(quotation.supplierId, quotation.siteId);
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

  // Rejects creating the supplier's items from the site while its enrollment there is inactive
  private async assertActiveAt(supplierId: string, siteId: string): Promise<void> {
    const activeSiteIds = await this.supplierEnrollments.findEnrolledSiteIds({ supplierId, isActive: true });
    if (activeSiteIds.includes(siteId)) return;
    throw new BadRequestException({
      label: 'Enrollment Inactive',
      detail: "Reactivate the supplier's enrollment at this site before posting quotations that add its items.",
    });
  }
}

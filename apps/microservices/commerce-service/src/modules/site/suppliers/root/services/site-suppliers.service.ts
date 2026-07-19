import type { UpdateSiteSupplierItemPriceDto } from '@domain/supplier-items/dto/request/update-site-supplier-item-price.dto';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import {
  type EnrollmentPicks,
  SupplierSitesDomainService,
} from '@domain/supplier-sites/services/supplier-sites.service';
import type { SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Injectable, Logger } from '@nestjs/common';
import type { SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';

// Site-workspace orchestration: every mutation is verified to belong to the caller's site
// (RpcSiteId) since the permissive RLS policies cannot restrict per-site on their own.
@Injectable()
export class SiteSuppliersService {
  private readonly logger = new Logger(SiteSuppliersService.name);

  constructor(
    private readonly supplierSitesService: SupplierSitesDomainService,
    private readonly supplierItemsService: SupplierItemsDomainService,
  ) {}

  // Updates an enrollment's picks after confirming it belongs to the caller's site
  async updateEnrollment(
    id: string,
    siteId: string,
    data: EnrollmentPicks & { isActive?: boolean },
  ): Promise<SuccessResponseDto> {
    await this.assertEnrollmentInSite(id, siteId);
    this.logger.log(`site.suppliers.updateEnrollment — id: ${id}`);
    return this.supplierSitesService.updateEnrollment(id, data);
  }

  // Removes an enrollment after confirming it belongs to the caller's site
  async unenroll(id: string, siteId: string): Promise<SuccessResponseDto> {
    await this.assertEnrollmentInSite(id, siteId);
    this.logger.log(`site.suppliers.unenroll — id: ${id}`);
    return this.supplierSitesService.unenroll(id);
  }

  // Lists a supplier's items for the site, requiring the supplier be enrolled here first
  async listItems(
    supplierId: string,
    siteId: string,
    state: TableViewState,
  ): Promise<{ result: SupplierItemDto[]; count: number }> {
    await this.assertEnrolled(supplierId, siteId);
    return this.supplierItemsService.findForTable(supplierId, state);
  }

  // Updates a site-specific price after confirming the row belongs to the caller's site
  async updatePrice(dto: UpdateSiteSupplierItemPriceDto, siteId: string): Promise<SuccessResponseDto> {
    await this.assertPriceInSite(dto.id, siteId);
    this.logger.log(`site.suppliers.updateItemPrice — id: ${dto.id}`);
    return this.supplierItemsService.updatePrice(dto);
  }

  // Deletes a site-specific price after confirming the row belongs to the caller's site
  async deletePrice(id: string, siteId: string): Promise<SuccessResponseDto> {
    await this.assertPriceInSite(id, siteId);
    this.logger.log(`site.suppliers.deleteItemPrice — id: ${id}`);
    return this.supplierItemsService.deletePrice(id);
  }

  // Rejects enrollments that do not belong to the caller's site (masked as not-found)
  private async assertEnrollmentInSite(id: string, siteId: string): Promise<void> {
    const enrollment = await this.supplierSitesService.findById(id);
    if (enrollment.siteId !== siteId) throw new NotFoundException('Enrollment not found.');
  }

  // Rejects operations on suppliers that are not enrolled for the caller's site
  private async assertEnrolled(supplierId: string, siteId: string): Promise<void> {
    const enrolled = await this.supplierSitesService.isEnrolled(supplierId, siteId);
    if (!enrolled) {
      throw new BadRequestException({
        label: 'Supplier Not Enrolled',
        detail: 'This supplier is not enrolled for your site.',
      });
    }
  }

  // Rejects price rows that are not the caller's site-specific rows (general rows are read-only here)
  private async assertPriceInSite(id: string, siteId: string): Promise<void> {
    const price = await this.supplierItemsService.findPriceById(id);
    if (!price || price.siteId !== siteId) throw new NotFoundException('Price not found.');
  }
}

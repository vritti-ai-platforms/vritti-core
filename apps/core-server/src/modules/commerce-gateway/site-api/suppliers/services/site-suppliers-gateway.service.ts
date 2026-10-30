import type { EnrollSiteSupplierDto } from '@commerce/supplier-sites/dto/request/enroll-site-supplier.dto';
import type { UpdateSiteSupplierEnrollmentDto } from '@commerce/supplier-sites/dto/request/update-site-supplier-enrollment.dto';
import type { SiteSupplierEnrollmentResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-enrollment-response.dto';
import type { SiteSupplierItemResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-response.dto';
import type { SiteSupplierItemTableResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-table-response.dto';
import type { SiteSupplierListRowResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-list-row-response.dto';
import type { SiteSupplierResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-response.dto';
import type { SiteSupplierTableResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-table-response.dto';
import type { UpdateSupplierItemSiteDto } from '@commerce/suppliers/dto/request/update-supplier-item-site.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class SiteSuppliersGatewayService {
  private readonly logger = new Logger(SiteSuppliersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns the legal entity's suppliers with this site's enrollment status for the data table
  async findForTable(userId: string): Promise<SiteSupplierTableResponseDto> {
    this.logger.log('site.suppliers.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-site-suppliers');

    const { result, count } = await this.nats.send<{ result: SiteSupplierListRowResponseDto[]; count: number }>(
      'commerce',
      'site.suppliers.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Enrolls a supplier for the session site
  async enroll(dto: EnrollSiteSupplierDto): Promise<CreateResponseDto<SiteSupplierEnrollmentResponseDto>> {
    this.logger.log(`site.suppliers.enroll — supplierId: ${dto.supplierId}`);
    return this.nats.send('commerce', 'site.suppliers.enroll', dto);
  }

  // Updates the site's enrollment picks for a supplier
  async updateEnrollment(supplierId: string, dto: UpdateSiteSupplierEnrollmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.updateEnrollment — supplierId: ${supplierId}`);
    return this.nats.send('commerce', 'site.suppliers.updateEnrollment', { supplierId, ...dto });
  }

  // Removes the site's enrollment for a supplier
  async unenroll(supplierId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.unenroll — supplierId: ${supplierId}`);
    return this.nats.send('commerce', 'site.suppliers.unenroll', { supplierId });
  }

  // Returns an enrolled supplier with the site's enrollment picks
  async findById(supplierId: string): Promise<SiteSupplierResponseDto> {
    this.logger.log(`site.suppliers.findById — supplierId: ${supplierId}`);
    return this.nats.send('commerce', 'site.suppliers.findById', { supplierId });
  }

  // Returns an enrolled supplier's items for the data table
  async findItemsTable(supplierId: string, userId: string): Promise<SiteSupplierItemTableResponseDto> {
    this.logger.log(`site.suppliers.itemsTable — supplierId: ${supplierId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-site-supplier-${supplierId}-items`,
    );

    const { result, count } = await this.nats.send<{ result: SiteSupplierItemResponseDto[]; count: number }>(
      'commerce',
      'site.suppliers.itemsTable',
      { supplierId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns a single supplier item by ID
  async findItemById(supplierItemId: string): Promise<SiteSupplierItemResponseDto> {
    this.logger.log(`site.suppliers.findItemById — id: ${supplierItemId}`);
    return this.nats.send('commerce', 'site.suppliers.findItemById', { supplierItemId });
  }

  // Updates this site's terms for a supplier item (active, preferred, lead time, min order)
  async updateItemSite(rowId: string, dto: UpdateSupplierItemSiteDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.updateItemSite — id: ${rowId}`);
    return this.nats.send('commerce', 'site.suppliers.updateItemSite', { id: rowId, ...dto });
  }
}

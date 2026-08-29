import type { AddSiteSupplierItemPriceDto } from '@commerce/supplier-sites/dto/request/add-site-supplier-item-price.dto';
import type { EnrollSiteSupplierDto } from '@commerce/supplier-sites/dto/request/enroll-site-supplier.dto';
import type { UpdateSiteSupplierEnrollmentDto } from '@commerce/supplier-sites/dto/request/update-site-supplier-enrollment.dto';
import type { UpdateSiteSupplierItemPriceDto } from '@commerce/supplier-sites/dto/request/update-site-supplier-item-price.dto';
import type { SiteSupplierEnrollmentResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-enrollment-response.dto';
import type { SiteSupplierItemPriceResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-price-response.dto';
import type { SiteSupplierItemPriceTableResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-price-table-response.dto';
import type { SiteSupplierItemResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-response.dto';
import type { SiteSupplierItemTableResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-table-response.dto';
import type { SiteSupplierResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-response.dto';
import type { SiteSupplierTableResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { type CurrencyAmountDto } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class SiteSuppliersGatewayService {
  private readonly logger = new Logger(SiteSuppliersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns the site's enrolled suppliers for the data table
  async findForTable(userId: string): Promise<SiteSupplierTableResponseDto> {
    this.logger.log('site.suppliers.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-site-suppliers');

    const { result, count } = await this.nats.send<{ result: SiteSupplierResponseDto[]; count: number }>(
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

  // Returns the resolved unit price for a supplier-item pair at this site
  async findItemPrice(
    supplierId: string,
    inventoryItemId: string,
    uomId: string,
  ): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    this.logger.log('site.suppliers.findItemPrice');
    return this.nats.send('commerce', 'site.suppliers.findItemPrice', { supplierId, inventoryItemId, uomId });
  }

  // Returns the price timeline visible to this site for a supplier item
  async findItemPricesTable(supplierItemId: string, userId: string): Promise<SiteSupplierItemPriceTableResponseDto> {
    this.logger.log(`site.suppliers.itemPricesTable — supplierItemId: ${supplierItemId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-site-supplier-item-${supplierItemId}-prices`,
    );

    const { result, count } = await this.nats.send<{ result: SiteSupplierItemPriceResponseDto[]; count: number }>(
      'commerce',
      'site.suppliers.itemPricesTable',
      { supplierItemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Adds a site-specific price record to a supplier item's timeline
  async addItemPrice(
    supplierItemId: string,
    dto: AddSiteSupplierItemPriceDto,
  ): Promise<CreateResponseDto<SiteSupplierItemPriceResponseDto>> {
    this.logger.log(`site.suppliers.addItemPrice — supplierItemId: ${supplierItemId}, validFrom: ${dto.validFrom}`);
    return this.nats.send('commerce', 'site.suppliers.addItemPrice', { supplierItemId, ...dto });
  }

  // Updates a site-specific supplier item price record
  async updateItemPrice(
    supplierItemId: string,
    priceId: string,
    dto: UpdateSiteSupplierItemPriceDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.updateItemPrice — id: ${priceId}`);
    return this.nats.send('commerce', 'site.suppliers.updateItemPrice', { supplierItemId, priceId, ...dto });
  }

  // Deletes a site-specific supplier item price record
  async deleteItemPrice(supplierItemId: string, priceId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.deleteItemPrice — id: ${priceId}`);
    return this.nats.send('commerce', 'site.suppliers.deleteItemPrice', { supplierItemId, priceId });
  }
}

import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import type { SupplierItemPriceDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price.dto';
import type { SupplierItemPriceHistoryDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price-history.dto';
import type { AddSupplierItemPriceDto } from '@domain/supplier-item-prices/dto/request/add-supplier-item-price.dto';
import type { UpdateSupplierItemPriceDto } from '@domain/supplier-item-prices/dto/request/update-supplier-item-price.dto';
import { SupplierItemPricesDomainService } from '@domain/supplier-item-prices/services/supplier-item-prices.service';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import { Injectable } from '@nestjs/common';
import type { FilterCondition } from '@vritti/api-sdk/conditions';
import type { TableState } from '@vritti/api-sdk/data-table';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class LeSupplierSiteItemPricesService {
  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly supplierItemsService: SupplierItemsDomainService,
    private readonly pricesService: SupplierItemPricesDomainService,
    private readonly enrollmentsService: SupplierEnrollmentsDomainService,
  ) {}

  // Adds a validity-dated price at each given site — for the whole legal entity when the list is empty — first setting
  // the item up at the sites that do not carry it yet, as SAP's plant info record comes with its price
  async addPrice(dto: AddSupplierItemPriceDto, siteIds: string[]): Promise<CreateResponseDto<SupplierItemPriceDto[]>> {
    const missingSiteItems = await this.supplierItemsService.findMissingSiteItems(dto.supplierItemId, siteIds);
    return this.database.runInTransaction(async () => {
      await this.supplierItemsService.addSiteItems(missingSiteItems);
      return this.pricesService.addPrice(dto, siteIds);
    });
  }

  // Updates a price row's amount, scheme, or end date
  updatePrice(dto: UpdateSupplierItemPriceDto): Promise<SuccessResponseDto> {
    return this.pricesService.updatePrice(dto);
  }

  // Returns the paginated price timeline of a supplier item at the site in the table's context
  findPricesForTable(
    supplierItemId: string,
    state: TableState,
  ): Promise<{ result: SupplierItemPriceDto[]; count: number }> {
    return this.pricesService.findPricesForTable(supplierItemId, state);
  }

  // Returns a supplier item's price windows in one currency, grouped by site — when none are picked, every site the
  // supplier is enrolled at or has prices of its own
  findPriceHistory(supplierItemId: string, context: FilterCondition[]): Promise<SupplierItemPriceHistoryDto> {
    return this.pricesService.findPriceHistory(supplierItemId, context, (supplierId) =>
      this.enrollmentsService.findEnrolledSiteIds({ supplierId }),
    );
  }

  // Deletes a price row from a supplier item's timeline
  deletePrice(id: string): Promise<SuccessResponseDto> {
    return this.pricesService.deletePrice(id);
  }
}

import type { SupplierEnrollmentDto } from '@domain/supplier-enrollments/dto/entity/supplier-enrollment.dto';
import type { SupplierEnrollmentCountsDto } from '@domain/supplier-enrollments/dto/entity/supplier-enrollment-counts.dto';
import type { SupplierEnrollmentDetailDto } from '@domain/supplier-enrollments/dto/entity/supplier-enrollment-detail.dto';
import type { SupplierEnrollmentRowDto } from '@domain/supplier-enrollments/dto/entity/supplier-enrollment-row.dto';
import type { CreateSupplierEnrollmentDto } from '@domain/supplier-enrollments/dto/request/create-supplier-enrollment.dto';
import type { SetSupplierEnrollmentActiveDto } from '@domain/supplier-enrollments/dto/request/set-supplier-enrollment-active.dto';
import type { SupplierEnrollmentSelectQueryDto } from '@domain/supplier-enrollments/dto/request/supplier-enrollment-select-query.dto';
import type { UpdateSupplierEnrollmentDto } from '@domain/supplier-enrollments/dto/request/update-supplier-enrollment.dto';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { Injectable } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { SelectQueryResult } from '@vritti/api-sdk/select';
import { PurchasingRulesService } from '@/modules/site/purchasing-rules/services/purchasing-rules.service';

@Injectable()
export class SiteSuppliersService {
  constructor(
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly purchasingRulesService: PurchasingRulesService,
  ) {}

  // Enrolls a supplier at the caller's site
  create(dto: CreateSupplierEnrollmentDto): Promise<CreateResponseDto<SupplierEnrollmentDto>> {
    return this.supplierEnrollmentsService.create(dto);
  }

  // Updates a supplier's enrollment picks and flags at the caller's site
  update(dto: UpdateSupplierEnrollmentDto): Promise<SuccessResponseDto> {
    return this.supplierEnrollmentsService.update(dto);
  }

  // Activates or deactivates a supplier's own enrollment at the caller's site
  setActive(dto: SetSupplierEnrollmentActiveDto): Promise<SuccessResponseDto> {
    return this.supplierEnrollmentsService.setActive(dto);
  }

  // Returns a supplier's enrollment at the caller's site with its commercial identity, enrolled or not
  findById(legalEntityId: string, supplierId: string): Promise<SupplierEnrollmentDetailDto> {
    return this.supplierEnrollmentsService.findDetail(legalEntityId, supplierId);
  }

  // Returns every supplier of the legal entity with its enrollment at the caller's site
  findForTable(
    legalEntityId: string,
    state: TableState,
  ): Promise<{ result: SupplierEnrollmentRowDto[]; count: number }> {
    return this.supplierEnrollmentsService.findForSiteTable(legalEntityId, state);
  }

  // Counts a supplier's items, quotations and invoices at the caller's site, enrolled or not
  findCounts(legalEntityId: string, supplierId: string): Promise<SupplierEnrollmentCountsDto> {
    return this.supplierEnrollmentsService.findCounts(legalEntityId, supplierId);
  }

  // Returns supplier options for the site's pickers with each one's enrollment there, marking those set up for the
  // picker's items and keeping only them where asked or where the site's rules require it
  async findForSelect(
    legalEntityId: string,
    siteId: string,
    query: SupplierEnrollmentSelectQueryDto,
  ): Promise<SelectQueryResult> {
    const picker = await this.purchasingRulesService.findSupplierPicker(siteId, query);
    return this.supplierEnrollmentsService.findSuppliersForSelect(
      legalEntityId,
      { ...query, suppliedItemIds: picker.itemIds },
      { onlySupplying: picker.onlySupplying },
    );
  }

  // Removes a supplier's enrollment at the caller's site
  delete(supplierId: string): Promise<SuccessResponseDto> {
    return this.supplierEnrollmentsService.delete(supplierId);
  }
}

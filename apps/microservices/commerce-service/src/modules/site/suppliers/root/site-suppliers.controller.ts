import type { SupplierEnrollmentCountsDto } from '@domain/supplier-enrollments/dto/entity/supplier-enrollment-counts.dto';
import type { SupplierEnrollmentDetailDto } from '@domain/supplier-enrollments/dto/entity/supplier-enrollment-detail.dto';
import type { SupplierEnrollmentRowDto } from '@domain/supplier-enrollments/dto/entity/supplier-enrollment-row.dto';
import { CreateSupplierEnrollmentDto } from '@domain/supplier-enrollments/dto/request/create-supplier-enrollment.dto';
import { SetSupplierEnrollmentActiveDto } from '@domain/supplier-enrollments/dto/request/set-supplier-enrollment-active.dto';
import { SupplierEnrollmentSelectQueryDto } from '@domain/supplier-enrollments/dto/request/supplier-enrollment-select-query.dto';
import { UpdateSupplierEnrollmentDto } from '@domain/supplier-enrollments/dto/request/update-supplier-enrollment.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { SelectQueryResult } from '@vritti/api-sdk/select';
import { SiteSuppliersService } from './services/site-suppliers.service';

@Controller()
export class SiteSuppliersController {
  private readonly logger = new Logger(SiteSuppliersController.name);

  constructor(private readonly service: SiteSuppliersService) {}

  // Enrolls a supplier at the caller's site
  @MessagePattern({ cmd: 'site.suppliers.create' })
  create(@Payload() dto: CreateSupplierEnrollmentDto): Promise<CreateResponseDto<{ id: string }>> {
    this.logger.log(`site.suppliers.create — supplierId: ${dto.supplierId}`);
    return this.service.create(dto);
  }

  // Updates a supplier's enrollment picks and flags at the caller's site
  @MessagePattern({ cmd: 'site.suppliers.update' })
  update(@Payload() dto: UpdateSupplierEnrollmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.update — supplierId: ${dto.supplierId}`);
    return this.service.update(dto);
  }

  // Activates or deactivates a supplier's own enrollment at the caller's site
  @MessagePattern({ cmd: 'site.suppliers.setActive' })
  setActive(@Payload() dto: SetSupplierEnrollmentActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.setActive — supplierId: ${dto.supplierId}, isActive: ${dto.isActive}`);
    return this.service.setActive(dto);
  }

  // Returns a supplier's enrollment at the caller's site with its commercial identity, enrolled or not
  @MessagePattern({ cmd: 'site.suppliers.findById' })
  findById(
    @Payload() data: { supplierId: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SupplierEnrollmentDetailDto> {
    this.logger.log(`site.suppliers.findById — supplierId: ${data.supplierId}`);
    return this.service.findById(headers.legalEntityId, data.supplierId);
  }

  // Returns every supplier of the legal entity with its enrollment at the caller's site
  @MessagePattern({ cmd: 'site.suppliers.table' })
  table(
    @Payload() state: TableState,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<{ result: SupplierEnrollmentRowDto[]; count: number }> {
    this.logger.log('site.suppliers.table');
    return this.service.findForTable(headers.legalEntityId, state);
  }

  // Counts a supplier's items, quotations and invoices at the caller's site, one per tab of its page
  @MessagePattern({ cmd: 'site.suppliers.findCounts' })
  findCounts(
    @Payload() data: { supplierId: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SupplierEnrollmentCountsDto> {
    this.logger.log(`site.suppliers.findCounts — supplierId: ${data.supplierId}`);
    return this.service.findCounts(headers.legalEntityId, data.supplierId);
  }

  // Returns supplier options for a picker at the caller's site with each one's enrollment status there
  @MessagePattern({ cmd: 'site.suppliers.select' })
  select(
    @Payload() query: SupplierEnrollmentSelectQueryDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SelectQueryResult> {
    this.logger.log('site.suppliers.select');
    return this.service.findForSelect(headers.legalEntityId, headers.siteId, query);
  }

  // Removes a supplier's enrollment at the caller's site
  @MessagePattern({ cmd: 'site.suppliers.delete' })
  delete(@Payload() data: { supplierId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.delete — supplierId: ${data.supplierId}`);
    return this.service.delete(data.supplierId);
  }
}

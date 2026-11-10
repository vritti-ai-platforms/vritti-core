import type { SupplierEnrollmentDto } from '@domain/supplier-enrollments/dto/entity/supplier-enrollment.dto';
import type { SupplierEnrollmentDetailDto } from '@domain/supplier-enrollments/dto/entity/supplier-enrollment-detail.dto';
import type { SupplierEnrollmentRowDto } from '@domain/supplier-enrollments/dto/entity/supplier-enrollment-row.dto';
import { CreateSupplierEnrollmentDto } from '@domain/supplier-enrollments/dto/request/create-supplier-enrollment.dto';
import { SetSupplierEnrollmentActiveDto } from '@domain/supplier-enrollments/dto/request/set-supplier-enrollment-active.dto';
import { SupplierEnrollmentSelectQueryDto } from '@domain/supplier-enrollments/dto/request/supplier-enrollment-select-query.dto';
import { UpdateSupplierEnrollmentDto } from '@domain/supplier-enrollments/dto/request/update-supplier-enrollment.dto';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders, RpcSiteId } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { SelectQueryResult } from '@vritti/api-sdk/select';

@Controller()
export class SiteSuppliersController {
  private readonly logger = new Logger(SiteSuppliersController.name);

  constructor(private readonly service: SupplierEnrollmentsDomainService) {}

  // Returns every supplier of the legal entity with its enrollment at the caller's site
  @MessagePattern({ cmd: 'site.suppliers.table' })
  table(
    @Payload() state: TableState,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<{ result: SupplierEnrollmentRowDto[]; count: number }> {
    this.logger.log('site.suppliers.table');
    return this.service.findForSiteTable(headers.legalEntityId, headers.siteId, state);
  }

  // Returns a supplier's enrollment at the caller's site with its commercial identity, enrolled or not
  @MessagePattern({ cmd: 'site.suppliers.findById' })
  findById(
    @Payload() data: { supplierId: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SupplierEnrollmentDetailDto> {
    this.logger.log(`site.suppliers.findById — supplierId: ${data.supplierId}`);
    return this.service.findDetail(headers.legalEntityId, headers.siteId, data.supplierId);
  }

  // Enrolls a supplier at the caller's site
  @MessagePattern({ cmd: 'site.suppliers.create' })
  create(
    @Payload() dto: CreateSupplierEnrollmentDto,
    @RpcSiteId() siteId: string,
  ): Promise<CreateResponseDto<SupplierEnrollmentDto>> {
    this.logger.log(`site.suppliers.create — supplierId: ${dto.supplierId}`);
    return this.service.create({ ...dto, siteId });
  }

  // Updates a supplier's enrollment picks and flags at the caller's site
  @MessagePattern({ cmd: 'site.suppliers.update' })
  update(@Payload() dto: UpdateSupplierEnrollmentDto, @RpcSiteId() siteId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.update — supplierId: ${dto.supplierId}`);
    return this.service.update({ ...dto, siteId });
  }

  // Activates or deactivates a supplier's own enrollment at the caller's site
  @MessagePattern({ cmd: 'site.suppliers.setActive' })
  setActive(@Payload() dto: SetSupplierEnrollmentActiveDto, @RpcSiteId() siteId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.setActive — supplierId: ${dto.supplierId}, isActive: ${dto.isActive}`);
    return this.service.setActive({ ...dto, siteId });
  }

  // Removes a supplier's enrollment at the caller's site
  @MessagePattern({ cmd: 'site.suppliers.delete' })
  delete(@Payload() data: { supplierId: string }, @RpcSiteId() siteId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.delete — supplierId: ${data.supplierId}`);
    return this.service.delete(data.supplierId, siteId);
  }

  // Returns supplier options for a picker at the caller's site with each one's enrollment status there
  @MessagePattern({ cmd: 'site.suppliers.select' })
  select(
    @Payload() query: SupplierEnrollmentSelectQueryDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SelectQueryResult> {
    this.logger.log('site.suppliers.select');
    return this.service.findSuppliersForSelect(headers.legalEntityId, headers.siteId, query);
  }
}

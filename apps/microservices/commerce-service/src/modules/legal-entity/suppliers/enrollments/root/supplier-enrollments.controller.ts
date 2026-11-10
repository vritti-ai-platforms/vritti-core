import type { SupplierEnrollmentDto } from '@domain/supplier-enrollments/dto/entity/supplier-enrollment.dto';
import type { SupplierEnrollmentDetailDto } from '@domain/supplier-enrollments/dto/entity/supplier-enrollment-detail.dto';
import { CreateSupplierEnrollmentDto } from '@domain/supplier-enrollments/dto/request/create-supplier-enrollment.dto';
import { SetSupplierEnrollmentActiveDto } from '@domain/supplier-enrollments/dto/request/set-supplier-enrollment-active.dto';
import { SupplierEnrolledSitesQueryDto } from '@domain/supplier-enrollments/dto/request/supplier-enrolled-sites-query.dto';
import { UpdateSupplierEnrollmentDto } from '@domain/supplier-enrollments/dto/request/update-supplier-enrollment.dto';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SupplierEnrollmentsController {
  private readonly logger = new Logger(SupplierEnrollmentsController.name);

  constructor(private readonly service: SupplierEnrollmentsDomainService) {}

  // Returns every enrollment of a supplier for the LE Enrollments tab
  @MessagePattern({ cmd: 'le.suppliers.enrollments.findAll' })
  findAll(@Payload() data: { supplierId: string }): Promise<SupplierEnrollmentDto[]> {
    this.logger.log(`le.suppliers.enrollments.findAll — supplierId: ${data.supplierId}`);
    return this.service.findAllForSupplier(data.supplierId);
  }

  // Returns a supplier's enrollment at one of the LE's sites with its commercial identity, enrolled or not
  @MessagePattern({ cmd: 'le.suppliers.enrollments.findBySite' })
  findBySite(
    @Payload() data: { supplierId: string; siteId: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SupplierEnrollmentDetailDto> {
    this.logger.log(`le.suppliers.enrollments.findBySite — supplierId: ${data.supplierId}, siteId: ${data.siteId}`);
    return this.service.findDetail(headers.legalEntityId, data.siteId, data.supplierId);
  }

  // Enrolls a supplier at one of the LE's sites
  @MessagePattern({ cmd: 'le.suppliers.enrollments.create' })
  create(@Payload() dto: CreateSupplierEnrollmentDto): Promise<CreateResponseDto<SupplierEnrollmentDto>> {
    this.logger.log(`le.suppliers.enrollments.create — supplierId: ${dto.supplierId}, siteId: ${dto.siteId}`);
    return this.service.create(dto);
  }

  // Updates a supplier's enrollment picks and flags at one of the LE's sites
  @MessagePattern({ cmd: 'le.suppliers.enrollments.update' })
  update(@Payload() dto: UpdateSupplierEnrollmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.enrollments.update — supplierId: ${dto.supplierId}, siteId: ${dto.siteId}`);
    return this.service.update(dto);
  }

  // Activates or deactivates a supplier's own enrollment at one of the LE's sites
  @MessagePattern({ cmd: 'le.suppliers.enrollments.setActive' })
  setActive(@Payload() dto: SetSupplierEnrollmentActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.enrollments.setActive — supplierId: ${dto.supplierId}, siteId: ${dto.siteId}`);
    return this.service.setActive(dto);
  }

  // Removes a supplier's enrollment at one of the LE's sites
  @MessagePattern({ cmd: 'le.suppliers.enrollments.delete' })
  delete(@Payload() data: { supplierId: string; siteId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.enrollments.delete — supplierId: ${data.supplierId}, siteId: ${data.siteId}`);
    return this.service.delete(data.supplierId, data.siteId);
  }

  // Returns the sites a supplier, or any supplier of an inventory item, is enrolled at
  @MessagePattern({ cmd: 'le.suppliers.enrollments.siteIds' })
  findEnrolledSiteIds(@Payload() query: SupplierEnrolledSitesQueryDto): Promise<string[]> {
    this.logger.log(
      `le.suppliers.enrollments.siteIds — supplierId: ${query.supplierId}, inventoryItemId: ${query.inventoryItemId}, isActive: ${query.isActive}`,
    );
    return this.service.findEnrolledSiteIds(query);
  }
}

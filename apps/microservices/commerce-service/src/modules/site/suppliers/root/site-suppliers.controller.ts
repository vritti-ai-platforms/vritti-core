import type { SiteSupplierDto, SupplierSiteDto } from '@domain/supplier-sites/dto/entity/supplier-site.dto';
import { EnrollSupplierDto } from '@domain/supplier-sites/dto/request/enroll-supplier.dto';
import { UpdateSiteEnrollmentDto } from '@domain/supplier-sites/dto/request/update-site-enrollment.dto';
import { SupplierSitesDomainService } from '@domain/supplier-sites/services/supplier-sites.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { RpcSiteId } from '@vritti/api-sdk/nats';
import { SiteSuppliersService } from './services/site-suppliers.service';

@Controller()
export class SiteSuppliersController {
  private readonly logger = new Logger(SiteSuppliersController.name);

  constructor(
    private readonly service: SupplierSitesDomainService,
    private readonly siteService: SiteSuppliersService,
  ) {}

  // Returns the current site's enrolled suppliers
  @MessagePattern({ cmd: 'site.suppliers.table' })
  table(@Payload() state: TableViewState): Promise<{ result: SiteSupplierDto[]; count: number }> {
    this.logger.log('site.suppliers.table');
    return this.service.findForSiteTable(state);
  }

  // Enrolls a supplier for the caller's site
  @MessagePattern({ cmd: 'site.suppliers.enroll' })
  enroll(@Payload() dto: EnrollSupplierDto, @RpcSiteId() siteId: string): Promise<CreateResponseDto<SupplierSiteDto>> {
    this.logger.log(`site.suppliers.enroll — supplierId: ${dto.supplierId}`);
    return this.service.enroll(dto.supplierId, siteId, {
      partyTaxRegistrationId: dto.partyTaxRegistrationId ?? null,
      partyBankAccountId: dto.partyBankAccountId ?? null,
    });
  }

  // Updates the caller site's enrollment picks and active flag
  @MessagePattern({ cmd: 'site.suppliers.updateEnrollment' })
  updateEnrollment(@Payload() dto: UpdateSiteEnrollmentDto, @RpcSiteId() siteId: string): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`site.suppliers.updateEnrollment — id: ${id}`);
    return this.siteService.updateEnrollment(id, siteId, data);
  }

  // Removes the caller site's enrollment
  @MessagePattern({ cmd: 'site.suppliers.unenroll' })
  unenroll(@Payload() data: { id: string }, @RpcSiteId() siteId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.unenroll — id: ${data.id}`);
    return this.siteService.unenroll(data.id, siteId);
  }

  // Returns the caller site's view of a supplier (enrollment + commercial identity)
  @MessagePattern({ cmd: 'site.suppliers.findById' })
  findById(@Payload() data: { supplierId: string }, @RpcSiteId() siteId: string): Promise<SiteSupplierDto> {
    this.logger.log(`site.suppliers.findById — supplierId: ${data.supplierId}`);
    return this.service.findSiteSupplier(data.supplierId, siteId);
  }
}

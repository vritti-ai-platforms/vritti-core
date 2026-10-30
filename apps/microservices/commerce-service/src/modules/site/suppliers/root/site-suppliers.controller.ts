import type { SupplierSiteDto } from '@domain/supplier-sites/dto/entity/supplier-site.dto';
import { EnrollSupplierDto } from '@domain/supplier-sites/dto/request/enroll-supplier.dto';
import { UpdateSiteEnrollmentDto } from '@domain/supplier-sites/dto/request/update-site-enrollment.dto';
import { SupplierSitesDomainService } from '@domain/supplier-sites/services/supplier-sites.service';
import { SiteSupplierListRowDto } from '@domain/suppliers/dto/entity/site-supplier-list-row.dto';
import type { SupplierAtSiteDto } from '@domain/suppliers/dto/entity/supplier-at-site.dto';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders, RpcSiteId } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SiteSuppliersService } from './services/site-suppliers.service';

@Controller()
export class SiteSuppliersController {
  private readonly logger = new Logger(SiteSuppliersController.name);

  constructor(
    private readonly service: SupplierSitesDomainService,
    private readonly suppliersService: SuppliersDomainService,
    private readonly siteService: SiteSuppliersService,
  ) {}

  // Returns every supplier of the legal entity with the caller site's enrollment status
  @MessagePattern({ cmd: 'site.suppliers.table' })
  table(
    @Payload() state: TableViewState,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<{ result: SiteSupplierListRowDto[]; count: number }> {
    this.logger.log('site.suppliers.table');
    return this.suppliersService.findForSiteTable(headers.legalEntityId, headers.siteId, state);
  }

  // Enrolls a supplier for the caller's site
  @MessagePattern({ cmd: 'site.suppliers.enroll' })
  enroll(@Payload() dto: EnrollSupplierDto, @RpcSiteId() siteId: string): Promise<CreateResponseDto<SupplierSiteDto>> {
    this.logger.log(`site.suppliers.enroll — supplierId: ${dto.supplierId}`);
    return this.service.enroll(dto.supplierId, siteId, {
      paymentTermId: dto.paymentTermId,
      partyTaxRegistrationId: dto.partyTaxRegistrationId,
      partyBankAccountId: dto.partyBankAccountId ?? null,
      orderRelationshipId: dto.orderRelationshipId ?? null,
    });
  }

  // Updates the caller site's enrollment picks and active flag
  @MessagePattern({ cmd: 'site.suppliers.updateEnrollment' })
  updateEnrollment(@Payload() dto: UpdateSiteEnrollmentDto, @RpcSiteId() siteId: string): Promise<SuccessResponseDto> {
    const { supplierId, ...data } = dto;
    return this.siteService.updateEnrollment(supplierId, siteId, data);
  }

  // Removes the caller site's enrollment
  @MessagePattern({ cmd: 'site.suppliers.unenroll' })
  unenroll(@Payload() data: { supplierId: string }, @RpcSiteId() siteId: string): Promise<SuccessResponseDto> {
    return this.siteService.unenroll(data.supplierId, siteId);
  }

  // Returns the caller site's view of a supplier (enrollment + commercial identity)
  @MessagePattern({ cmd: 'site.suppliers.findById' })
  findById(
    @Payload() data: { supplierId: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SupplierAtSiteDto> {
    this.logger.log(`site.suppliers.findById — supplierId: ${data.supplierId}`);
    return this.suppliersService.findAtSite(headers.legalEntityId, headers.siteId, data.supplierId);
  }
}

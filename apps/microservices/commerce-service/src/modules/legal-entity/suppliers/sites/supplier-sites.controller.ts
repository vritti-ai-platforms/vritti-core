import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import type { SupplierSiteDto } from '@domain/supplier-sites/dto/entity/supplier-site.dto';
import { AddSupplierSiteDto } from '@domain/supplier-sites/dto/request/add-supplier-site.dto';
import { UpdateSupplierSiteDto } from '@domain/supplier-sites/dto/request/update-supplier-site.dto';
import { SupplierSitesDomainService } from '@domain/supplier-sites/services/supplier-sites.service';
import type { SiteSupplierItemDetailDto, SiteSupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import type { SupplierAtSiteDto } from '@domain/suppliers/dto/entity/supplier-at-site.dto';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SupplierSitesController {
  private readonly logger = new Logger(SupplierSitesController.name);

  constructor(
    private readonly service: SupplierSitesDomainService,
    private readonly suppliersService: SuppliersDomainService,
    private readonly supplierItemsService: SupplierItemsDomainService,
  ) {}

  // Returns every site enrollment of a supplier for the LE Sites tab
  @MessagePattern({ cmd: 'le.suppliers.enrollments' })
  enrollments(@Payload() data: { supplierId: string }): Promise<SupplierSiteDto[]> {
    this.logger.log(`suppliers.enrollments — supplierId: ${data.supplierId}`);
    return this.service.findAllForSupplier(data.supplierId);
  }

  // Returns a supplier as one of the LE's sites sees it: commercial identity plus that site's enrollment
  @MessagePattern({ cmd: 'le.suppliers.findAtSite' })
  findAtSite(
    @Payload() data: { supplierId: string; siteId: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SupplierAtSiteDto> {
    this.logger.log(`suppliers.findAtSite — supplierId: ${data.supplierId}, siteId: ${data.siteId}`);
    return this.suppliersService.findAtSite(headers.legalEntityId, data.siteId, data.supplierId);
  }

  // Returns a supplier's items carried by one of the LE's sites, with that site's terms and price in force
  @MessagePattern({ cmd: 'le.suppliers.siteItemsTable' })
  siteItemsTable(
    @Payload() data: { supplierId: string; siteId: string } & TableViewState,
  ): Promise<{ result: SiteSupplierItemDto[]; count: number }> {
    const { supplierId, siteId, ...state } = data;
    this.logger.log(`suppliers.siteItemsTable — supplierId: ${supplierId}, siteId: ${siteId}`);
    return this.supplierItemsService.findSiteItemsForTable(supplierId, siteId, state);
  }

  // Returns a supplier item as one of the LE's sites carries it
  @MessagePattern({ cmd: 'le.suppliers.findSiteItem' })
  findSiteItem(@Payload() data: { supplierItemId: string; siteId: string }): Promise<SiteSupplierItemDetailDto> {
    this.logger.log(`suppliers.findSiteItem — id: ${data.supplierItemId}, siteId: ${data.siteId}`);
    return this.supplierItemsService.findSiteItemDetail(data.supplierItemId, data.siteId);
  }

  // Enrolls a supplier for a site under one of its tax registrations, with optional branch-payee and contact picks
  @MessagePattern({ cmd: 'le.suppliers.addSite' })
  addSite(@Payload() dto: AddSupplierSiteDto): Promise<CreateResponseDto<SupplierSiteDto>> {
    this.logger.log(`suppliers.addSite — supplierId: ${dto.supplierId}, siteId: ${dto.siteId}`);
    return this.service.enroll(dto.supplierId, dto.siteId, {
      paymentTermId: dto.paymentTermId,
      partyTaxRegistrationId: dto.partyTaxRegistrationId,
      partyBankAccountId: dto.partyBankAccountId ?? null,
      orderRelationshipId: dto.orderRelationshipId ?? null,
    });
  }

  // Updates an enrollment's picks
  @MessagePattern({ cmd: 'le.suppliers.updateSite' })
  updateSite(@Payload() dto: UpdateSupplierSiteDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`suppliers.updateSite — id: ${id}`);
    return this.service.updateEnrollment(id, data);
  }

  // Removes a site enrollment
  @MessagePattern({ cmd: 'le.suppliers.removeSite' })
  removeSite(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.removeSite — id: ${data.id}`);
    return this.service.unenroll(data.id);
  }
}

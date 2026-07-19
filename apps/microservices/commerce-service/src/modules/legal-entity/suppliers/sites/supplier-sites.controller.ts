import type { SupplierSiteDto } from '@domain/supplier-sites/dto/entity/supplier-site.dto';
import { AddSupplierSiteDto } from '@domain/supplier-sites/dto/request/add-supplier-site.dto';
import { UpdateSupplierSiteDto } from '@domain/supplier-sites/dto/request/update-supplier-site.dto';
import { SupplierSitesDomainService } from '@domain/supplier-sites/services/supplier-sites.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class SupplierSitesController {
  private readonly logger = new Logger(SupplierSitesController.name);

  constructor(private readonly service: SupplierSitesDomainService) {}

  // Returns the paginated site enrollments of a supplier for the LE Sites tab
  @MessagePattern({ cmd: 'le.suppliers.sitesTable' })
  sitesTable(
    @Payload() data: { supplierId: string } & TableViewState,
  ): Promise<{ result: SupplierSiteDto[]; count: number }> {
    const { supplierId, ...state } = data;
    this.logger.log(`suppliers.sitesTable — supplierId: ${supplierId}`);
    return this.service.findForSupplierTable(supplierId, state);
  }

  // Enrolls a supplier for a site with optional origin-registration and branch-payee picks
  @MessagePattern({ cmd: 'le.suppliers.addSite' })
  addSite(@Payload() dto: AddSupplierSiteDto): Promise<CreateResponseDto<SupplierSiteDto>> {
    this.logger.log(`suppliers.addSite — supplierId: ${dto.supplierId}, siteId: ${dto.siteId}`);
    return this.service.enroll(dto.supplierId, dto.siteId, {
      partyTaxRegistrationId: dto.partyTaxRegistrationId ?? null,
      partyBankAccountId: dto.partyBankAccountId ?? null,
    });
  }

  // Updates an enrollment's picks and active flag
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

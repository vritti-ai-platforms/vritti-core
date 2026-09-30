import type { CatalogDto } from '@domain/catalogs/dto/entity/catalog.dto';
import { CreateCatalogDto } from '@domain/catalogs/dto/request/create-catalog.dto';
import { UpdateCatalogDto } from '@domain/catalogs/dto/request/update-catalog.dto';
import { CatalogListingsDomainService } from '@domain/catalogs/services/catalog-listings.service';
import { CatalogsDomainService } from '@domain/catalogs/services/catalogs.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk/select';

@Controller()
export class OrgCatalogsController {
  private readonly logger = new Logger(OrgCatalogsController.name);

  constructor(
    private readonly service: CatalogsDomainService,
    readonly _listingsService: CatalogListingsDomainService,
  ) {}

  // Returns paginated catalogs for the data table
  @MessagePattern({ cmd: 'org.catalogs.table' })
  findForTable(@Payload() state: TableViewState): Promise<{ result: CatalogDto[]; count: number }> {
    this.logger.log('catalogs.table');
    return this.service.findForTable(state);
  }

  // Returns catalog options for select dropdowns
  @MessagePattern({ cmd: 'org.catalogs.select' })
  findForSelect(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('catalogs.select');
    return this.service.findForSelect(query);
  }

  // Returns one catalog with its listing and channel counts
  @MessagePattern({ cmd: 'org.catalogs.findById' })
  findById(@Payload() data: { id: string }): Promise<CatalogDto> {
    this.logger.log(`catalogs.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'org.catalogs.create' })
  create(@Payload() dto: CreateCatalogDto): Promise<CreateResponseDto<CatalogDto>> {
    this.logger.log(`catalogs.create — name: ${dto.name}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'org.catalogs.update' })
  update(@Payload() dto: UpdateCatalogDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`catalogs.update — id: ${id}`);
    return this.service.update(id, data);
  }

  // Deletes a catalog; refused while it still lists anything
  @MessagePattern({ cmd: 'org.catalogs.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}

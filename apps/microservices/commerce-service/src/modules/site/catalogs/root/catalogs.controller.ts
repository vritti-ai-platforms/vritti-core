import type { CatalogDto } from '@domain/catalogs/dto/entity/catalog.dto';
import type { CatalogChannelDto } from '@domain/catalogs/dto/entity/catalog-channel.dto';
import { CreateCatalogDto } from '@domain/catalogs/dto/request/create-catalog.dto';
import { UpdateCatalogDto } from '@domain/catalogs/dto/request/update-catalog.dto';
import { CatalogListingsDomainService } from '@domain/catalogs/services/catalog-listings.service';
import { CatalogsDomainService } from '@domain/catalogs/services/catalogs.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';

@Controller()
export class SiteCatalogsController {
  private readonly logger = new Logger(SiteCatalogsController.name);

  constructor(
    private readonly service: CatalogsDomainService,
    readonly _listingsService: CatalogListingsDomainService,
  ) {}

  // Returns paginated catalogs for the data table
  @MessagePattern({ cmd: 'site.catalogs.table' })
  findForTable(@Payload() state: TableViewState): Promise<{ result: CatalogDto[]; count: number }> {
    this.logger.log('catalogs.table');
    return this.service.findForTable(state);
  }

  // Returns catalog options for select dropdowns
  @MessagePattern({ cmd: 'site.catalogs.select' })
  findForSelect(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('catalogs.select');
    return this.service.findForSelect(query);
  }

  // Returns one catalog with its listing and channel counts
  // Every channel selling one catalog — the read-only tab on the catalog detail
  @MessagePattern({ cmd: 'site.catalogs.channels' })
  channels(@Payload() data: { catalogId: string }): Promise<CatalogChannelDto[]> {
    this.logger.log(`catalogs.channels — catalogId: ${data.catalogId}`);
    return this.service.findChannels(data.catalogId);
  }

  @MessagePattern({ cmd: 'site.catalogs.findById' })
  findById(@Payload() data: { id: string }): Promise<CatalogDto> {
    this.logger.log(`catalogs.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'site.catalogs.create' })
  create(@Payload() dto: CreateCatalogDto): Promise<CreateResponseDto<CatalogDto>> {
    this.logger.log(`catalogs.create — name: ${dto.name}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'site.catalogs.update' })
  update(@Payload() dto: UpdateCatalogDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`catalogs.update — id: ${id}`);
    return this.service.update(id, data);
  }

  // Deletes a catalog; refused while it still lists anything
  @MessagePattern({ cmd: 'site.catalogs.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}

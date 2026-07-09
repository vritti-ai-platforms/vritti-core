import { CatalogDto } from '@domain/catalogs/dto/entity/catalog.dto';
import { CatalogsService } from '@domain/catalogs/services/catalogs.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';
import type { CreateCatalogDto } from '../dto/request/create-catalog.dto';
import type { UpdateCatalogDto } from '../dto/request/update-catalog.dto';

@Controller()
export class CatalogsController {
  private readonly logger = new Logger(CatalogsController.name);

  constructor(private readonly service: CatalogsService) {}

  // Returns paginated catalogs for the data table
  @MessagePattern({ cmd: 'catalogs.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: CatalogDto[]; count: number }> {
    this.logger.log('catalogs.table');
    return this.service.findForTable(state);
  }

  // Returns paginated catalog options for select dropdowns
  @MessagePattern({ cmd: 'catalogs.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('catalogs.select');
    return this.service.findForSelect(data);
  }

  // Creates a catalog
  @MessagePattern({ cmd: 'catalogs.create' })
  async create(@Payload() dto: CreateCatalogDto): Promise<CreateResponseDto<CatalogDto>> {
    this.logger.log(`catalogs.create — name: ${dto.name}`);
    return this.service.create(dto);
  }

  // Returns a single catalog by ID
  @MessagePattern({ cmd: 'catalogs.findById' })
  async findById(@Payload() data: { id: string }): Promise<CatalogDto> {
    this.logger.log(`catalogs.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Updates a catalog
  @MessagePattern({ cmd: 'catalogs.update' })
  async update(@Payload() data: { id: string } & UpdateCatalogDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = data;
    this.logger.log(`catalogs.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a catalog
  @MessagePattern({ cmd: 'catalogs.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }

  // Clones a catalog into a new catalog with no channel assignments
  @MessagePattern({ cmd: 'catalogs.clone' })
  async clone(@Payload() data: { sourceCatalogId: string }): Promise<CreateResponseDto<CatalogDto>> {
    this.logger.log(`catalogs.clone — source: ${data.sourceCatalogId}`);
    return this.service.clone(data.sourceCatalogId);
  }
}

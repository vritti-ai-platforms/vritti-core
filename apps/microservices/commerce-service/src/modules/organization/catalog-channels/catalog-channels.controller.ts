import type { CatalogChannelDto, ResolvedCatalogDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import {
  CreateCatalogChannelDto,
  ResolveCatalogChannelDto,
  UpdateCatalogChannelDto,
} from '@domain/catalog-channels/dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class OrgCatalogChannelsController {
  private readonly logger = new Logger(OrgCatalogChannelsController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  // Returns paginated channel bindings for the data table
  @MessagePattern({ cmd: 'org.catalogChannels.table' })
  findForTable(@Payload() state: TableViewState): Promise<{ result: CatalogChannelDto[]; count: number }> {
    this.logger.log('catalogChannels.table');
    return this.service.findForTable(state);
  }

  // Every channel selling one catalog — the read-only tab on the catalog detail
  @MessagePattern({ cmd: 'org.catalogChannels.byCatalog' })
  findByCatalog(@Payload() data: { catalogId: string }): Promise<CatalogChannelDto[]> {
    this.logger.log(`catalogChannels.byCatalog — catalogId: ${data.catalogId}`);
    return this.service.findByCatalog(data.catalogId);
  }

  @MessagePattern({ cmd: 'org.catalogChannels.create' })
  create(@Payload() dto: CreateCatalogChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    this.logger.log(`catalogChannels.create — type: ${dto.type}, catalogId: ${dto.catalogId}`);
    return this.service.create(dto);
  }

  // Points an existing channel at a different catalog; scope and target are fixed once created
  @MessagePattern({ cmd: 'org.catalogChannels.repoint' })
  repoint(@Payload() dto: UpdateCatalogChannelDto): Promise<SuccessResponseDto> {
    this.logger.log(`catalogChannels.repoint — id: ${dto.id}, catalogId: ${dto.catalogId}`);
    return this.service.repoint(dto);
  }

  @MessagePattern({ cmd: 'org.catalogChannels.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogChannels.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }

  // Which catalog serves this channel — the caller's type comes from its API surface, not the payload
  @MessagePattern({ cmd: 'org.catalogChannels.resolve' })
  resolve(@Payload() dto: ResolveCatalogChannelDto): Promise<ResolvedCatalogDto> {
    this.logger.log(`catalogChannels.resolve — type: ${dto.type}`);
    return this.service.resolve(dto);
  }
}

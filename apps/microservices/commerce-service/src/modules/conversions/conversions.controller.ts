import type { ConversionDetailDto, ConversionDto } from '@domain/conversions/dto/entity/conversion.dto';
import { ConversionsService } from '@domain/conversions/services/conversions.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition, SearchState, SortCondition } from '@vritti/api-sdk';
import type { CreateConversionDto } from './dto/request/create-conversion.dto';

@Controller()
export class ConversionsController {
  private readonly logger = new Logger(ConversionsController.name);

  constructor(private readonly service: ConversionsService) {}

  @MessagePattern({ cmd: 'conversions.table' })
  async table(@Payload() data: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: ConversionDto[]; count: number }> {
    this.logger.log('conversions.table');
    return this.service.findForTable({
      filters: data.filters ?? [],
      sort: data.sort ?? [],
      search: data.search ?? null,
      pagination: data.pagination ?? { limit: 20, offset: 0 },
    });
  }

  @MessagePattern({ cmd: 'conversions.create' })
  async create(@Payload() dto: CreateConversionDto): Promise<ConversionDetailDto> {
    this.logger.log('conversions.create');
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'conversions.findById' })
  async findById(@Payload() data: { id: string }): Promise<ConversionDetailDto> {
    this.logger.log(`conversions.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'conversions.complete' })
  async complete(@Payload() data: { id: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`conversions.complete — id: ${data.id}`);
    return this.service.complete(data.id);
  }
}

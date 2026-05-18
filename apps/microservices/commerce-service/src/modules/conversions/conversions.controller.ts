import type { ConversionDetailDto, ConversionDto } from '@domain/conversions/dto/entity/conversion.dto';
import { ConversionsService } from '@domain/conversions/services/conversions.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk';
import type { CreateConversionDto } from './dto/request/create-conversion.dto';
import { ConversionsRootService } from './services/conversions-root.service';

@Controller()
export class ConversionsController {
  private readonly logger = new Logger(ConversionsController.name);

  constructor(
    private readonly service: ConversionsService,
    private readonly rootService: ConversionsRootService,
  ) {}

  // Returns paginated conversions for the data table
  @MessagePattern({ cmd: 'conversions.table' })
  async table(
    @Payload() state: TableViewState,
  ): Promise<{ result: ConversionDto[]; count: number }> {
    this.logger.log('conversions.table');
    return this.service.findForTable(state);
  }

  // Creates a new conversion
  @MessagePattern({ cmd: 'conversions.create' })
  async create(@Payload() dto: CreateConversionDto): Promise<ConversionDetailDto> {
    this.logger.log('conversions.create');
    return this.service.create(dto);
  }

  // Returns conversion detail with inputs and outputs
  @MessagePattern({ cmd: 'conversions.findById' })
  async findById(@Payload() data: { id: string }): Promise<ConversionDetailDto> {
    this.logger.log(`conversions.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Completes a conversion, deducting inputs and creating output batches
  @MessagePattern({ cmd: 'conversions.complete' })
  async complete(@Payload() data: { id: string; locationId: string; inputBatchIds?: Record<string, string> }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`conversions.complete — id: ${data.id}`);
    return this.rootService.complete(data.id, data.locationId, data.inputBatchIds);
  }
}

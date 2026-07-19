import type { PosTerminalDto } from '@domain/pos-terminals/dto/entity/pos-terminal.dto';
import { CreatePosTerminalDto } from '@domain/pos-terminals/dto/request/create-pos-terminal.dto';
import { UpdatePosTerminalPayloadDto } from '@domain/pos-terminals/dto/request/update-pos-terminal-payload.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';
import { PosTerminalsService } from './services/pos-terminals.service';

@Controller()
export class PosTerminalsController {
  private readonly logger = new Logger(PosTerminalsController.name);

  constructor(private readonly service: PosTerminalsService) {}

  // Returns paginated POS terminals for the data table
  @MessagePattern({ cmd: 'site.posTerminals.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: PosTerminalDto[]; count: number }> {
    this.logger.log('posTerminals.table');
    return this.service.findForTable(state);
  }

  // Returns POS-role storage location options for select dropdowns
  @MessagePattern({ cmd: 'site.posTerminals.locationsSelect' })
  async locationsSelect(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('posTerminals.locationsSelect');
    return this.service.findLocationsForSelect(data);
  }

  // Returns a single POS terminal by ID
  @MessagePattern({ cmd: 'site.posTerminals.findById' })
  async findById(@Payload() data: { id: string }): Promise<PosTerminalDto> {
    this.logger.log(`posTerminals.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Creates a new POS terminal
  @MessagePattern({ cmd: 'site.posTerminals.create' })
  async create(@Payload() dto: CreatePosTerminalDto): Promise<CreateResponseDto<PosTerminalDto>> {
    this.logger.log(`posTerminals.create — name: ${dto.name}, code: ${dto.code}`);
    return this.service.create(dto);
  }

  // Updates an existing POS terminal
  @MessagePattern({ cmd: 'site.posTerminals.update' })
  async update(@Payload() data: UpdatePosTerminalPayloadDto): Promise<SuccessResponseDto> {
    this.logger.log(`posTerminals.update — id: ${data.id}`);
    return this.service.update(data);
  }

  // Deletes a POS terminal
  @MessagePattern({ cmd: 'site.posTerminals.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`posTerminals.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}

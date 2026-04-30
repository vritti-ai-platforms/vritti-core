import type { PosTerminalDto } from '@domain/pos-terminals/dto/entity/pos-terminal.dto';
import { PosTerminalsService } from '@domain/pos-terminals/services/pos-terminals.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk';
import type { CreatePosTerminalDto } from './dto/request/create-pos-terminal.dto';
import type { UpdatePosTerminalDto } from './dto/request/update-pos-terminal.dto';

@Controller()
export class PosTerminalsController {
  private readonly logger = new Logger(PosTerminalsController.name);

  constructor(private readonly posTerminalsService: PosTerminalsService) {}

  // Returns paginated POS terminals for the data table
  @MessagePattern({ cmd: 'posTerminals.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: PosTerminalDto[]; count: number }> {
    this.logger.log('posTerminals.table');
    return this.posTerminalsService.findForTable(state);
  }

  // Returns paginated POS terminal options for select dropdowns
  @MessagePattern({ cmd: 'posTerminals.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('posTerminals.select');
    return this.posTerminalsService.findForSelect(data);
  }

  // Returns POS-role storage location options for select dropdowns
  @MessagePattern({ cmd: 'posTerminals.storageLocationsSelect' })
  async storageLocationsSelect(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('posTerminals.storageLocationsSelect');
    return this.posTerminalsService.findPosStorageLocationsForSelect(data);
  }

  // Returns a single POS terminal by ID
  @MessagePattern({ cmd: 'posTerminals.findById' })
  async findById(@Payload() data: { id: string }): Promise<PosTerminalDto> {
    this.logger.log(`posTerminals.findById — id: ${data.id}`);
    return this.posTerminalsService.findById(data.id);
  }

  // Creates a new POS terminal
  @MessagePattern({ cmd: 'posTerminals.create' })
  async create(@Payload() dto: CreatePosTerminalDto): Promise<CreateResponseDto<PosTerminalDto>> {
    this.logger.log(`posTerminals.create — name: ${dto.name}, code: ${dto.code}`);
    return this.posTerminalsService.create(dto);
  }

  // Updates an existing POS terminal
  @MessagePattern({ cmd: 'posTerminals.update' })
  async update(@Payload() data: { id: string } & UpdatePosTerminalDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    this.logger.log(`posTerminals.update — id: ${id}`);
    return this.posTerminalsService.update(id, updateData);
  }

  // Deletes a POS terminal
  @MessagePattern({ cmd: 'posTerminals.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`posTerminals.delete — id: ${data.id}`);
    return this.posTerminalsService.delete(data.id);
  }
}

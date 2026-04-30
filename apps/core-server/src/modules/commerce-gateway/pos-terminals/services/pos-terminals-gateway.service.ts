import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  DataTableStateService,
  NatsClientService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import type { CreatePosTerminalDto } from '../dto/request/create-pos-terminal.dto';
import type { UpdatePosTerminalDto } from '../dto/request/update-pos-terminal.dto';
import type { PosTerminalResponseDto } from '../dto/response/pos-terminal-response.dto';
import type { PosTerminalTableResponseDto } from '../dto/response/pos-terminal-table-response.dto';

@Injectable()
export class PosTerminalsGatewayService {
  private readonly logger = new Logger(PosTerminalsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated POS terminals for the data table
  async findForTable(userId: string): Promise<PosTerminalTableResponseDto> {
    this.logger.log('posTerminals.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-pos-terminals');

    const { result, count } = await this.nats.send<{ result: PosTerminalResponseDto[]; count: number }>(
      'commerce',
      'posTerminals.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns POS terminal options for select dropdowns
  select(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('posTerminals.select');
    return this.nats.send('commerce', 'posTerminals.select', query);
  }

  // Returns POS-role storage location options for select dropdowns
  selectPosStorageLocations(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('posTerminals.storageLocationsSelect');
    return this.nats.send('commerce', 'posTerminals.storageLocationsSelect', query);
  }

  // Returns a single POS terminal by ID
  findById(id: string): Promise<PosTerminalResponseDto> {
    this.logger.log(`posTerminals.findById — id: ${id}`);
    return this.nats.send('commerce', 'posTerminals.findById', { id });
  }

  // Creates a new POS terminal
  create(dto: CreatePosTerminalDto): Promise<CreateResponseDto<PosTerminalResponseDto>> {
    this.logger.log(`posTerminals.create — name: ${dto.name}, code: ${dto.code}`);
    return this.nats.send('commerce', 'posTerminals.create', dto);
  }

  // Updates an existing POS terminal
  update(id: string, dto: UpdatePosTerminalDto): Promise<SuccessResponseDto> {
    this.logger.log(`posTerminals.update — id: ${id}`);
    return this.nats.send('commerce', 'posTerminals.update', { id, ...dto });
  }

  // Deletes a POS terminal
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`posTerminals.delete — id: ${id}`);
    return this.nats.send('commerce', 'posTerminals.delete', { id });
  }
}

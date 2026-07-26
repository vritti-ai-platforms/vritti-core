import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreatePosTerminalDto } from '@commerce/pos-terminals/dto/request/create-pos-terminal.dto';
import type { UpdatePosTerminalDto } from '@commerce/pos-terminals/dto/request/update-pos-terminal.dto';
import type { PosTerminalResponseDto } from '@commerce/pos-terminals/dto/response/pos-terminal-response.dto';
import type { PosTerminalTableResponseDto } from '@commerce/pos-terminals/dto/response/pos-terminal-table-response.dto';

@Injectable()
export class PosTerminalsGatewayService {
  private readonly logger = new Logger(PosTerminalsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated POS terminals for the data table
  async findForTable(userId: string): Promise<PosTerminalTableResponseDto> {
    this.logger.log('site.posTerminals.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'commerce-site-pos-terminals',
    );

    const { result, count } = await this.nats.send<{ result: PosTerminalResponseDto[]; count: number }>(
      'commerce',
      'site.posTerminals.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns POS-role storage location options for select dropdowns
  selectPosLocations(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('posTerminals.locationsSelect');
    return this.nats.send('commerce', 'site.posTerminals.locationsSelect', query);
  }

  // Returns a single POS terminal by ID
  findById(id: string): Promise<PosTerminalResponseDto> {
    this.logger.log(`posTerminals.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.posTerminals.findById', { id });
  }

  // Creates a new POS terminal
  create(dto: CreatePosTerminalDto): Promise<CreateResponseDto<PosTerminalResponseDto>> {
    this.logger.log(`posTerminals.create — name: ${dto.name}, code: ${dto.code}`);
    return this.nats.send('commerce', 'site.posTerminals.create', dto);
  }

  // Updates an existing POS terminal
  update(id: string, dto: UpdatePosTerminalDto): Promise<SuccessResponseDto> {
    this.logger.log(`posTerminals.update — id: ${id}`);
    return this.nats.send('commerce', 'site.posTerminals.update', { id, ...dto });
  }

  // Deletes a POS terminal
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`posTerminals.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.posTerminals.delete', { id });
  }
}

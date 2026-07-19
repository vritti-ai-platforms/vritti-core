import { LocationsDomainRepository } from '@domain/locations/repositories/locations.repository';
import type { PosTerminalDto } from '@domain/pos-terminals/dto/entity/pos-terminal.dto';
import type { CreatePosTerminalDto } from '@domain/pos-terminals/dto/request/create-pos-terminal.dto';
import type { UpdatePosTerminalPayloadDto } from '@domain/pos-terminals/dto/request/update-pos-terminal-payload.dto';
import { PosTerminalsDomainService } from '@domain/pos-terminals/services/pos-terminals.service';
import { Injectable } from '@nestjs/common';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { LocationRoleValues } from '@/db/schema';

@Injectable()
export class PosTerminalsService {
  constructor(
    private readonly posTerminalsService: PosTerminalsDomainService,
    private readonly locationsRepository: LocationsDomainRepository,
  ) {}

  // Returns paginated POS terminals for the data table
  findForTable(state: TableViewState): Promise<{ result: PosTerminalDto[]; count: number }> {
    return this.posTerminalsService.findForTable(state);
  }

  // Returns POS-role storage location options for select dropdowns
  findLocationsForSelect(data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.locationsRepository.findForSelect({
      value: data.valueKey || 'id',
      label: data.labelKey || 'name',
      description: data.descriptionKey,
      additionalKeys: data.additionalKeys,
      groupIdKey: data.groupIdKey,
      search: data.search,
      limit: data.limit,
      offset: data.offset,
      values: data.values,
      excludeIds: data.excludeIds,
      where: { locationRole: LocationRoleValues.RESERVED_STORAGE },
      orderByKey: data.orderByKey || 'name',
      orderDirection: data.orderDirection || 'asc',
    });
  }

  // Returns a single POS terminal by ID
  findById(id: string): Promise<PosTerminalDto> {
    return this.posTerminalsService.findById(id);
  }

  // Creates a new POS terminal after resolving its storage location
  async create(dto: CreatePosTerminalDto): Promise<CreateResponseDto<PosTerminalDto>> {
    const location = await this.locationsRepository.findById(dto.locationId);
    if (!location) throw new NotFoundException('Storage location not found.');
    return this.posTerminalsService.create(dto, location);
  }

  // Updates an existing POS terminal, resolving a new storage location when supplied
  async update(data: UpdatePosTerminalPayloadDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    let location: { id: string; locationRole: string; isActive: boolean } | undefined;
    if (updateData.locationId) {
      const loc = await this.locationsRepository.findById(updateData.locationId);
      if (!loc) throw new NotFoundException('Storage location not found.');
      location = loc;
    }
    return this.posTerminalsService.update(id, updateData, location);
  }

  // Deletes a POS terminal
  delete(id: string): Promise<SuccessResponseDto> {
    return this.posTerminalsService.delete(id);
  }
}

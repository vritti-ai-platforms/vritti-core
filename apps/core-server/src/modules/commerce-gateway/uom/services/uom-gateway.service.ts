import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService, SelectOptionsQueryDto, type SelectQueryResult, type SuccessResponseDto } from '@vritti/api-sdk';
import type { CreateUomDto } from '../dto/request/create-uom.dto';
import type { UpdateUomDto } from '../dto/request/update-uom.dto';
import type { UomResponseDto } from '../dto/response/uom-response.dto';

@Injectable()
export class UomGatewayService {
  private readonly logger = new Logger(UomGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns base units, optionally filtered by search
  async findBaseUnits(search?: string): Promise<UomResponseDto[]> {
    this.logger.log('uom.base');
    return this.nats.send('commerce', 'uom.base', { search });
  }

  // Returns derived units for a given base unit
  async findDerivedUnits(baseUnitId: string): Promise<UomResponseDto[]> {
    this.logger.log(`uom.derived — baseUnitId: ${baseUnitId}`);
    return this.nats.send('commerce', 'uom.derived', { baseUnitId });
  }

  // Returns paginated UOM options for select dropdowns
  async select(params: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('uom.select');
    return this.nats.send('commerce', 'uom.select', params);
  }

  // Creates a new UOM
  async create(dto: CreateUomDto): Promise<UomResponseDto> {
    this.logger.log(`uom.create — name: ${dto.name}, symbol: ${dto.symbol}`);
    return this.nats.send('commerce', 'uom.create', dto);
  }

  // Updates a UOM by ID
  async update(id: string, dto: UpdateUomDto): Promise<SuccessResponseDto> {
    this.logger.log(`uom.update — id: ${id}`);
    return this.nats.send('commerce', 'uom.update', { id, ...dto });
  }

  // Deletes a UOM by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`uom.delete — id: ${id}`);
    return this.nats.send('commerce', 'uom.delete', { id });
  }
}

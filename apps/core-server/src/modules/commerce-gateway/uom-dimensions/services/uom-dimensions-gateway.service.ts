import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, NatsClientService, SelectOptionsQueryDto, type SelectQueryResult, type SuccessResponseDto } from '@vritti/api-sdk';
import type { CreateUomDimensionDto } from '../dto/request/create-uom-dimension.dto';
import type { UpdateUomDimensionDto } from '../dto/request/update-uom-dimension.dto';
import type { UomDimensionResponseDto } from '../dto/response/uom-dimension-response.dto';

@Injectable()
export class UomDimensionsGatewayService {
  private readonly logger = new Logger(UomDimensionsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns dimensions, optionally filtered by search
  async list(search?: string): Promise<UomDimensionResponseDto[]> {
    this.logger.log('uom-dimensions.list');
    return this.nats.send('commerce', 'uom-dimensions.list', { search });
  }

  // Returns paginated dimension options for select dropdowns
  async findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('uom-dimensions.select');
    return this.nats.send('commerce', 'uom-dimensions.select', query);
  }

  // Returns a dimension by ID
  async findById(id: string): Promise<UomDimensionResponseDto> {
    this.logger.log(`uom-dimensions.findById — id: ${id}`);
    return this.nats.send('commerce', 'uom-dimensions.findById', { id });
  }

  // Creates a new dimension
  async create(dto: CreateUomDimensionDto): Promise<CreateResponseDto<UomDimensionResponseDto>> {
    this.logger.log(`uom-dimensions.create — code: ${dto.code}`);
    return this.nats.send('commerce', 'uom-dimensions.create', dto);
  }

  // Updates a dimension by ID
  async update(id: string, dto: UpdateUomDimensionDto): Promise<SuccessResponseDto> {
    this.logger.log(`uom-dimensions.update — id: ${id}`);
    return this.nats.send('commerce', 'uom-dimensions.update', { id, ...dto });
  }

  // Deletes a dimension by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`uom-dimensions.delete — id: ${id}`);
    return this.nats.send('commerce', 'uom-dimensions.delete', { id });
  }
}

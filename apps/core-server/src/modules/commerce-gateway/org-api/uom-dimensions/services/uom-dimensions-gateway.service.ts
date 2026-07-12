import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateUomDimensionDto } from '../dto/request/create-uom-dimension.dto';
import type { UpdateUomDimensionDto } from '../dto/request/update-uom-dimension.dto';
import type { UomDimensionCountResponseDto } from '../dto/response/uom-dimension-count-response.dto';
import type { UomDimensionResponseDto } from '../dto/response/uom-dimension-response.dto';

@Injectable()
export class UomDimensionsGatewayService {
  private readonly logger = new Logger(UomDimensionsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns total UOM dimension count
  async count(): Promise<UomDimensionCountResponseDto> {
    this.logger.log('uom-dimensions.count');
    return this.nats.send('commerce', 'org.uom-dimensions.count', {});
  }

  // Returns dimensions, optionally filtered by search
  async list(search?: string): Promise<UomDimensionResponseDto[]> {
    this.logger.log('uom-dimensions.list');
    return this.nats.send('commerce', 'org.uom-dimensions.list', { search });
  }

  // Returns a dimension by ID
  async findById(id: string): Promise<UomDimensionResponseDto> {
    this.logger.log(`uom-dimensions.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.uom-dimensions.findById', { id });
  }

  // Creates a new dimension
  async create(dto: CreateUomDimensionDto): Promise<CreateResponseDto<UomDimensionResponseDto>> {
    this.logger.log(`uom-dimensions.create — code: ${dto.code}`);
    return this.nats.send('commerce', 'org.uom-dimensions.create', dto);
  }

  // Updates a dimension by ID
  async update(id: string, dto: UpdateUomDimensionDto): Promise<SuccessResponseDto> {
    this.logger.log(`uom-dimensions.update — id: ${id}`);
    return this.nats.send('commerce', 'org.uom-dimensions.update', { id, ...dto });
  }

  // Deletes a dimension by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`uom-dimensions.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.uom-dimensions.delete', { id });
  }
}

import type { UomDimensionDto } from '@domain/uom-dimensions/dto/entity/uom-dimension.dto';
import { UomDimensionsService } from '@domain/uom-dimensions/services/uom-dimensions.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateResponseDto,
  type SuccessResponseDto,
} from '@vritti/api-sdk/database';
import type { CreateUomDimensionDto } from './dto/request/create-uom-dimension.dto';
import type { UpdateUomDimensionDto } from './dto/request/update-uom-dimension.dto';

@Controller()
export class UomDimensionsController {
  private readonly logger = new Logger(UomDimensionsController.name);

  constructor(private readonly service: UomDimensionsService) {}

  // Returns total UOM dimension count
  @MessagePattern({ cmd: 'org.uom.dimensions.count' })
  async count(): Promise<{ count: number }> {
    this.logger.log('uom.dimensions.count');
    return this.service.count();
  }

  // Returns all UOM dimensions, optionally filtered by search
  @MessagePattern({ cmd: 'org.uom.dimensions.list' })
  async list(@Payload() data: { search?: string }): Promise<UomDimensionDto[]> {
    this.logger.log('uom.dimensions.list');
    return this.service.list(data.search);
  }

  // Finds a UOM dimension by ID
  @MessagePattern({ cmd: 'org.uom.dimensions.findById' })
  async findById(@Payload() data: { id: string }): Promise<UomDimensionDto> {
    this.logger.log(`uom.dimensions.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Creates a new UOM dimension
  @MessagePattern({ cmd: 'org.uom.dimensions.create' })
  async create(@Payload() dto: CreateUomDimensionDto): Promise<CreateResponseDto<UomDimensionDto>> {
    this.logger.log(`uom.dimensions.create — code: ${dto.code}, name: ${dto.name}`);
    return this.service.create(dto);
  }

  // Updates a UOM dimension by ID
  @MessagePattern({ cmd: 'org.uom.dimensions.update' })
  async update(@Payload() data: { id: string } & UpdateUomDimensionDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    this.logger.log(`uom.dimensions.update — id: ${id}`);
    return this.service.update(id, updateData);
  }

  // Deletes a UOM dimension by ID
  @MessagePattern({ cmd: 'org.uom.dimensions.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`uom.dimensions.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}

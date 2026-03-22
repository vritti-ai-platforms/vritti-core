import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk';
import type { StationDto } from '../dto/entity/station.dto';
import type { CreateStationDto } from '../dto/request/create-station.dto';
import type { UpdateStationDto } from '../dto/request/update-station.dto';
import { StationService } from '../services/station.service';

@Controller()
export class StationController {
  constructor(private readonly stationService: StationService) {}

  // Lists all active stations for an org+bu
  @MessagePattern('commerce.stations.findAll')
  findAll(@Payload() data: { organizationId: string; businessUnitId: string }): Promise<StationDto[]> {
    return this.stationService.findAll(data.organizationId, data.businessUnitId);
  }

  // Returns a single station by ID
  @MessagePattern('commerce.stations.findById')
  findById(@Payload() data: { id: string }): Promise<StationDto> {
    return this.stationService.findById(data.id);
  }

  // Creates a new station
  @MessagePattern('commerce.stations.create')
  create(@Payload() dto: CreateStationDto): Promise<StationDto> {
    return this.stationService.create(dto);
  }

  // Updates an existing station
  @MessagePattern('commerce.stations.update')
  update(@Payload() data: { id: string } & UpdateStationDto): Promise<SuccessResponseDto> {
    const { id, ...dto } = data;
    return this.stationService.update(id, dto);
  }

  // Deletes a station
  @MessagePattern('commerce.stations.delete')
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    return this.stationService.delete(data.id);
  }
}

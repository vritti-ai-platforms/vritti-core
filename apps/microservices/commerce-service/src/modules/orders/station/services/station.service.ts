import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException, SuccessResponseDto } from '@vritti/api-sdk';
import { StationDto } from '../dto/entity/station.dto';
import type { CreateStationDto } from '../dto/request/create-station.dto';
import type { UpdateStationDto } from '../dto/request/update-station.dto';
import { StationRepository } from '../repositories/station.repository';

@Injectable()
export class StationService {
  private readonly logger = new Logger(StationService.name);

  constructor(private readonly stationRepository: StationRepository) {}

  // Creates a new station
  async create(dto: CreateStationDto): Promise<StationDto> {
    const station = await this.stationRepository.create({
      organizationId: dto.organizationId,
      businessUnitId: dto.businessUnitId,
      name: dto.name,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });

    this.logger.log(`Created station "${dto.name}" (${station.id})`);
    return StationDto.from(station);
  }

  // Returns all active stations for an org+bu
  async findAll(orgId: string, buId: string): Promise<StationDto[]> {
    const stations = await this.stationRepository.findByOrgAndBu(orgId, buId);
    return stations.map(StationDto.from);
  }

  // Returns a single station by ID
  async findById(id: string): Promise<StationDto> {
    const station = await this.stationRepository.findById(id);
    if (!station) throw new NotFoundException('Station not found.');
    return StationDto.from(station);
  }

  // Updates a station's fields
  async update(id: string, dto: UpdateStationDto): Promise<SuccessResponseDto> {
    const station = await this.stationRepository.findById(id);
    if (!station) throw new NotFoundException('Station not found.');

    await this.stationRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      updatedAt: new Date(),
    });

    this.logger.log(`Updated station ${id}`);
    return { success: true, message: 'Station updated successfully.' };
  }

  // Deletes a station after checking no products reference it
  async delete(id: string): Promise<SuccessResponseDto> {
    const station = await this.stationRepository.findById(id);
    if (!station) throw new NotFoundException('Station not found.');

    const productCount = await this.stationRepository.countProductReferences(id);
    if (productCount > 0) {
      throw new BadRequestException({
        label: 'Cannot Delete',
        detail: `This station has ${productCount} product(s) referencing it. Remove or reassign them first.`,
      });
    }

    await this.stationRepository.delete(id);

    this.logger.log(`Deleted station "${station.name}" (${id})`);
    return { success: true, message: 'Station deleted successfully.' };
  }
}

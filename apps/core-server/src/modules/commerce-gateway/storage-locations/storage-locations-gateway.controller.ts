import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type CreateResponseDto,
  RequireSession,
  SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateStorageLocationDto } from './dto/request/create-storage-location.dto';
import { UpdateStorageLocationDto } from './dto/request/update-storage-location.dto';
import type { StorageLocationResponseDto } from './dto/response/storage-location-response.dto';
import type { LocationStockResponseDto } from './dto/response/location-stock-response.dto';
import { StorageLocationsGatewayService } from './services/storage-locations-gateway.service';

@ApiTags('Commerce - Storage Locations')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('storage-locations')
export class StorageLocationsGatewayController {
  private readonly logger = new Logger(StorageLocationsGatewayController.name);

  constructor(private readonly storageLocationsGatewayService: StorageLocationsGatewayService) {}

  // Returns all storage locations
  @Get()
  findAll(): Promise<StorageLocationResponseDto[]> {
    this.logger.log('GET /commerce-api/storage-locations');
    return this.storageLocationsGatewayService.findAll();
  }

  // Returns paginated location options for select dropdowns
  @Get('select')
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/storage-locations/select');
    return this.storageLocationsGatewayService.select(query);
  }

  // Returns a single storage location by ID
  @Get(':id')
  findById(@Param('id') id: string): Promise<StorageLocationResponseDto> {
    this.logger.log(`GET /commerce-api/storage-locations/${id}`);
    return this.storageLocationsGatewayService.findById(id);
  }

  // Returns stock levels at a location
  @Get(':id/levels')
  findLevels(@Param('id') id: string): Promise<LocationStockResponseDto[]> {
    this.logger.log(`GET /commerce-api/storage-locations/${id}/levels`);
    return this.storageLocationsGatewayService.findLevels(id);
  }

  // Creates a new storage location
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateStorageLocationDto): Promise<CreateResponseDto<StorageLocationResponseDto>> {
    this.logger.log('POST /commerce-api/storage-locations');
    return this.storageLocationsGatewayService.create(dto);
  }

  // Updates an storage location by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStorageLocationDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/storage-locations/${id}`);
    return this.storageLocationsGatewayService.update(id, dto);
  }

  // Deletes an storage location by ID
  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/storage-locations/${id}`);
    return this.storageLocationsGatewayService.delete(id);
  }
}

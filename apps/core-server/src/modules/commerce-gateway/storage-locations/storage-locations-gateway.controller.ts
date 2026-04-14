import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type CreateResponseDto,
  RequireSession,
  SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  UserId,
} from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateStorageLocationDto } from './dto/request/create-storage-location.dto';
import { ReorderStorageLocationsDto } from './dto/request/reorder-storage-locations.dto';
import { UpdateStorageLocationDto } from './dto/request/update-storage-location.dto';
import type { StorageLocationChildrenTableResponseDto } from './dto/response/storage-location-children-table-response.dto';
import type { StorageLocationCountResponseDto } from './dto/response/storage-location-count-response.dto';
import type { StorageLocationResponseDto } from './dto/response/storage-location-response.dto';
import type { StorageLocationTreeResponseDto } from './dto/response/storage-location-tree-response.dto';
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

  // Returns total storage location count
  @Get('count')
  count(): Promise<StorageLocationCountResponseDto> {
    this.logger.log('GET /commerce-api/storage-locations/count');
    return this.storageLocationsGatewayService.count();
  }

  // Returns storage locations as a tree hierarchy for TreeView
  @Get('tree')
  findTree(@Query('search') search?: string): Promise<StorageLocationTreeResponseDto[]> {
    this.logger.log('GET /commerce-api/storage-locations/tree');
    return this.storageLocationsGatewayService.findTree(search);
  }

  // Returns paginated child locations for a given parent location
  @Get(':parentId/children/table')
  childrenTable(
    @Param('parentId', new ParseUUIDPipe()) parentId: string,
    @UserId() userId: string,
  ): Promise<StorageLocationChildrenTableResponseDto> {
    this.logger.log(`GET /commerce-api/storage-locations/${parentId}/children/table`);
    return this.storageLocationsGatewayService.findChildrenForTable(userId, parentId);
  }

  // Returns paginated location options for select dropdowns
  @Get('select')
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/storage-locations/select');
    return this.storageLocationsGatewayService.select(query);
  }

  // Reorders siblings under a parent location
  @Post('reorder')
  reorder(@Body() dto: ReorderStorageLocationsDto): Promise<SuccessResponseDto> {
    this.logger.log('POST /commerce-api/storage-locations/reorder');
    return this.storageLocationsGatewayService.reorder(dto);
  }

  // Returns a single storage location by ID
  @Get(':id')
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<StorageLocationResponseDto> {
    this.logger.log(`GET /commerce-api/storage-locations/${id}`);
    return this.storageLocationsGatewayService.findById(id);
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
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateStorageLocationDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/storage-locations/${id}`);
    return this.storageLocationsGatewayService.update(id, dto);
  }

  // Deletes an storage location by ID
  @Delete(':id')
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/storage-locations/${id}`);
    return this.storageLocationsGatewayService.delete(id);
  }
}

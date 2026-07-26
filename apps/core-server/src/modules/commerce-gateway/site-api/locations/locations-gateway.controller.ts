import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { SITE_LOCATIONS } from '@vritti/commerce-permissions/locations';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { ApiGetLocationItemQuants, ApiGetLocationItemsTable } from './docs/locations-gateway.docs';
import { CreateLocationDto } from '@commerce/locations/dto/request/create-location.dto';
import { ReorderLocationsDto } from '@commerce/locations/dto/request/reorder-locations.dto';
import { UpdateLocationDto } from '@commerce/locations/dto/request/update-location.dto';
import type { LocationChildrenTableResponseDto } from '@commerce/locations/dto/response/location-children-table-response.dto';
import type { LocationCountResponseDto } from '@commerce/locations/dto/response/location-count-response.dto';
import type { LocationItemQuantResponseDto } from '@commerce/locations/dto/response/location-item-quant-response.dto';
import type { LocationItemTableResponseDto } from '@commerce/locations/dto/response/location-item-table-response.dto';
import type { LocationResponseDto } from '@commerce/locations/dto/response/location-response.dto';
import type { LocationTreeResponseDto } from '@commerce/locations/dto/response/location-tree-response.dto';
import { LocationsGatewayService } from './services/locations-gateway.service';

@ApiTags('Commerce - Storage Locations')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(SITE_LOCATIONS.featureCode)
@Controller('locations')
export class LocationsGatewayController {
  private readonly logger = new Logger(LocationsGatewayController.name);

  constructor(private readonly locationsGatewayService: LocationsGatewayService) {}

  // Returns total storage location count
  @Get('count')
  count(): Promise<LocationCountResponseDto> {
    this.logger.log('GET /commerce-api/locations/count');
    return this.locationsGatewayService.count();
  }

  // Returns storage locations as a tree hierarchy for TreeView
  @Get('tree')
  @RequirePermission(SITE_LOCATIONS.view)
  findTree(@Query('search') search?: string): Promise<LocationTreeResponseDto[]> {
    this.logger.log('GET /commerce-api/locations/tree');
    return this.locationsGatewayService.findTree(search);
  }

  // Returns paginated child locations for a given parent location
  @Get(':parentId/children/table')
  @RequirePermission(SITE_LOCATIONS.view)
  childrenTable(
    @Param('parentId', new ParseUUIDPipe()) parentId: string,
    @UserId() userId: string,
  ): Promise<LocationChildrenTableResponseDto> {
    this.logger.log(`GET /commerce-api/locations/${parentId}/children/table`);
    return this.locationsGatewayService.findChildrenForTable(userId, parentId);
  }

  // Reorders siblings under a parent location
  @Post('reorder')
  @RequirePermission(SITE_LOCATIONS.edit)
  reorder(@Body() dto: ReorderLocationsDto): Promise<SuccessResponseDto> {
    this.logger.log('POST /commerce-api/locations/reorder');
    return this.locationsGatewayService.reorder(dto);
  }

  // Returns a location's stocked items (grouped, non-zero) as a data table
  @Get(':locationId/items/table')
  @RequirePermission(SITE_LOCATIONS.quants.view)
  @ApiGetLocationItemsTable()
  getItemsTable(
    @Param('locationId', new ParseUUIDPipe()) locationId: string,
    @UserId() userId: string,
  ): Promise<LocationItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/locations/${locationId}/items/table`);
    return this.locationsGatewayService.findItemsForTable(userId, locationId);
  }

  // Returns the per-quant breakdown for a single item within a location
  @Get(':locationId/items/:itemId/quants')
  @RequirePermission(SITE_LOCATIONS.quants.view)
  @ApiGetLocationItemQuants()
  getItemQuants(
    @Param('locationId', new ParseUUIDPipe()) locationId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<LocationItemQuantResponseDto[]> {
    this.logger.log(`GET /commerce-api/locations/${locationId}/items/${itemId}/quants`);
    return this.locationsGatewayService.findItemQuants(locationId, itemId);
  }

  // Returns a single storage location by ID
  @Get(':id')
  @RequirePermission(SITE_LOCATIONS.view)
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<LocationResponseDto> {
    this.logger.log(`GET /commerce-api/locations/${id}`);
    return this.locationsGatewayService.findById(id);
  }

  // Creates a new storage location
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_LOCATIONS.add)
  async create(@Body() dto: CreateLocationDto): Promise<CreateResponseDto<LocationResponseDto>> {
    this.logger.log('POST /commerce-api/locations');
    return this.locationsGatewayService.create(dto);
  }

  // Updates an storage location by ID
  @Patch(':id')
  @RequirePermission(SITE_LOCATIONS.edit)
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateLocationDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/locations/${id}`);
    return this.locationsGatewayService.update(id, dto);
  }

  // Deletes an storage location by ID
  @Delete(':id')
  @RequirePermission(SITE_LOCATIONS.delete)
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/locations/${id}`);
    return this.locationsGatewayService.delete(id);
  }
}

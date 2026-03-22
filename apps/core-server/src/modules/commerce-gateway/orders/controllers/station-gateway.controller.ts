import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { UserId } from '@vritti/api-sdk';
import { UserService } from '../../../user/services/user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type Observable, firstValueFrom } from 'rxjs';
import { CreateStationDto } from '../dto/request/create-station.dto';
import { UpdateStationDto } from '../dto/request/update-station.dto';
import { StationGatewayService } from '../services/station-gateway.service';

@ApiTags('Commerce — Stations')
@ApiBearerAuth()
@Controller('stations')
export class StationGatewayController {
  private readonly logger = new Logger(StationGatewayController.name);

  constructor(private readonly stationGatewayService: StationGatewayService,
    private readonly userService: UserService,
  ) {}

  // Lists all stations for an org+bu
  @Get()
  async findAll(
    @UserId() userId: string,
    @Query('businessUnitId') businessUnitId: string,
  ): Promise<unknown> {
    this.logger.log('GET /commerce-api/stations');
    const user = await this.userService.findByIdOrThrow(userId);
    return firstValueFrom(this.stationGatewayService.findAll(user.organizationId, businessUnitId));
  }

  // Returns a single station by ID
  @Get(':id')
  findById(@Param('id') id: string): Observable<unknown> {
    this.logger.log(`GET /commerce-api/stations/${id}`);
    return this.stationGatewayService.findById(id);
  }

  // Creates a new station
  @Post()
  async create(@UserId() userId: string, @Body() dto: CreateStationDto): Promise<unknown> {
    this.logger.log('POST /commerce-api/stations');
    const user = await this.userService.findByIdOrThrow(userId);
    return firstValueFrom(this.stationGatewayService.create({ ...dto, organizationId: user.organizationId }));
  }

  // Updates an existing station
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStationDto): Observable<unknown> {
    this.logger.log(`PATCH /commerce-api/stations/${id}`);
    return this.stationGatewayService.update(id, dto);
  }

  // Deletes a station
  @Delete(':id')
  delete(@Param('id') id: string): Observable<unknown> {
    this.logger.log(`DELETE /commerce-api/stations/${id}`);
    return this.stationGatewayService.delete(id);
  }
}

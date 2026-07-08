import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf } from '@vritti/api-sdk/auth';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';
import { OrgScopeInterceptor } from '@/security/interceptors/org-scope.interceptor';
import {
  ApiCreateBusinessUnit,
  ApiDeleteBusinessUnit,
  ApiGetBusinessUnit,
  ApiListBusinessUnits,
  ApiSetBuLocks,
  ApiUpdateBusinessUnit,
} from '../docs/business-unit.docs';
import { BusinessUnitDto } from '../dto/entity/business-unit.dto';
import { CreateBusinessUnitInternalDto } from '../dto/request/create-business-unit-internal.dto';
import { SetBuLocksInternalDto } from '../dto/request/set-bu-locks-internal.dto';
import { UpdateBusinessUnitInternalDto } from '../dto/request/update-business-unit-internal.dto';
import { BusinessUnitApiService } from '../services/business-unit-api.service';

@ApiTags('Business Units')
@Controller('business-units/internal')
@Public()
@SkipCsrf()
@UseGuards(CloudSignatureGuard)
@UseInterceptors(OrgScopeInterceptor)
export class BusinessUnitController {
  private readonly logger = new Logger(BusinessUnitController.name);

  constructor(private readonly businessUnitApiService: BusinessUnitApiService) {}

  // Creates a new business unit for an organization
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateBusinessUnit()
  async create(@Body() dto: CreateBusinessUnitInternalDto): Promise<BusinessUnitDto> {
    this.logger.log(`POST /api/business-units/internal — "${dto.name}" for org ${dto.orgId}`);
    return this.businessUnitApiService.create(dto.orgId, dto);
  }

  // Lists all business units for an organization
  @Get()
  @ApiListBusinessUnits()
  async list(@Query('orgId') orgId: string): Promise<BusinessUnitDto[]> {
    this.logger.log(`GET /api/business-units/internal?orgId=${orgId}`);
    return this.businessUnitApiService.findByOrg(orgId);
  }

  // Returns a business unit and its subtree
  @Get(':id')
  @ApiGetBusinessUnit()
  async getById(@Param('id') id: string): Promise<BusinessUnitDto[]> {
    this.logger.log(`GET /api/business-units/internal/${id}`);
    return this.businessUnitApiService.findSubtree(id);
  }

  // Lists role assignments for a business unit
  @Get(':id/role-assignments')
  async listRoleAssignments(@Param('id') id: string) {
    this.logger.log(`GET /api/business-units/internal/${id}/role-assignments`);
    return this.businessUnitApiService.findRoleAssignments(id);
  }

  // Replaces the business unit's feature lock deny-list (null = inherit the full plan)
  @Put(':id/locks')
  @ApiSetBuLocks()
  async setLocks(@Param('id') id: string, @Body() dto: SetBuLocksInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /api/business-units/internal/${id}/locks`);
    return this.businessUnitApiService.setFeatureLocks(id, dto);
  }

  // Updates a business unit
  @Patch(':id')
  @ApiUpdateBusinessUnit()
  async update(@Param('id') id: string, @Body() dto: UpdateBusinessUnitInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /api/business-units/internal/${id}`);
    return this.businessUnitApiService.update(id, dto);
  }

  // Deletes a business unit
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteBusinessUnit()
  async remove(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /api/business-units/internal/${id}`);
    return this.businessUnitApiService.remove(id);
  }
}

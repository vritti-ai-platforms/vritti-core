import { LeTaxRegistrationDto } from '@domain/legal-entity/dto/entity/le-tax-registration.dto';
import { LegalEntityDto } from '@domain/legal-entity/dto/entity/legal-entity.dto';
import { CreateLeTaxRegistrationInternalDto } from '@domain/legal-entity/dto/request/create-le-tax-registration-internal.dto';
import { CreateLegalEntityInternalDto } from '@domain/legal-entity/dto/request/create-legal-entity-internal.dto';
import { UpdateLegalEntityInternalDto } from '@domain/legal-entity/dto/request/update-legal-entity-internal.dto';
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf } from '@vritti/api-sdk/auth';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';
import { OrgScopeInterceptor } from '@/security/interceptors/org-scope.interceptor';
import { SetFeatureLocksInternalDto } from '../dto/request/set-feature-locks-internal.dto';
import type { FeatureLocksResponseDto } from '../dto/response/feature-locks-response.dto';
import { StructureApiService } from '../root/services/structure-api.service';
import {
  ApiAddLeTaxRegistration,
  ApiCreateLegalEntity,
  ApiDeleteLegalEntity,
  ApiDeleteLeTaxRegistration,
  ApiGetLegalEntityLocks,
  ApiListLegalEntityRoleAssignments,
  ApiSetLegalEntityLocks,
  ApiUpdateLegalEntity,
} from './docs/legal-entity.docs';

@ApiTags('Legal Entities')
@Controller('legal-entities/internal')
@Public()
@SkipCsrf()
@UseGuards(CloudSignatureGuard)
@UseInterceptors(OrgScopeInterceptor)
export class LegalEntityController {
  private readonly logger = new Logger(LegalEntityController.name);

  constructor(private readonly structureApiService: StructureApiService) {}

  // Creates a new legal entity for an organization
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateLegalEntity()
  async create(@Body() dto: CreateLegalEntityInternalDto): Promise<LegalEntityDto> {
    this.logger.log(`POST /legal-entities/internal — "${dto.name}" for org ${dto.orgId}`);
    return this.structureApiService.createLegalEntity(dto);
  }

  // Updates a legal entity
  @Patch(':id')
  @ApiUpdateLegalEntity()
  async update(@Param('id') id: string, @Body() dto: UpdateLegalEntityInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /legal-entities/internal/${id}`);
    return this.structureApiService.updateLegalEntity(id, dto);
  }

  // Lists role assignments targeting a legal entity
  @Get(':id/role-assignments')
  @ApiListLegalEntityRoleAssignments()
  async listRoleAssignments(@Param('id') id: string) {
    this.logger.log(`GET /legal-entities/internal/${id}/role-assignments`);
    return this.structureApiService.findLegalEntityRoleAssignments(id);
  }

  // Returns the legal entity's feature lock deny-list
  @Get(':id/locks')
  @ApiGetLegalEntityLocks()
  async getLocks(@Param('id') id: string): Promise<FeatureLocksResponseDto> {
    this.logger.log(`GET /legal-entities/internal/${id}/locks`);
    return this.structureApiService.getLegalEntityLocks(id);
  }

  // Replaces the legal entity's feature lock deny-list (null = inherit the full plan)
  @Put(':id/locks')
  @ApiSetLegalEntityLocks()
  async setLocks(@Param('id') id: string, @Body() dto: SetFeatureLocksInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /legal-entities/internal/${id}/locks`);
    return this.structureApiService.setLegalEntityLocks(id, dto);
  }

  // Adds a tax registration to a legal entity
  @Post(':id/registrations')
  @HttpCode(HttpStatus.CREATED)
  @ApiAddLeTaxRegistration()
  async addRegistration(
    @Param('id') id: string,
    @Body() dto: CreateLeTaxRegistrationInternalDto,
  ): Promise<LeTaxRegistrationDto> {
    this.logger.log(`POST /legal-entities/internal/${id}/registrations`);
    return this.structureApiService.addRegistration(id, dto);
  }

  // Deletes a legal entity
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteLegalEntity()
  async remove(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /legal-entities/internal/${id}`);
    return this.structureApiService.deleteLegalEntity(id);
  }

  // Deletes a tax registration from a legal entity
  @Delete(':id/registrations/:regId')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteLeTaxRegistration()
  async removeRegistration(@Param('id') id: string, @Param('regId') regId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /legal-entities/internal/${id}/registrations/${regId}`);
    return this.structureApiService.deleteRegistration(id, regId);
  }
}

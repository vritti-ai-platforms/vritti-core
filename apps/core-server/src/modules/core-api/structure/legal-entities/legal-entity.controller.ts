import { LeTaxRegistrationDto } from '@domain/legal-entity/dto/entity/le-tax-registration.dto';
import { LegalEntityDto } from '@domain/legal-entity/dto/entity/legal-entity.dto';
import { CreateLeTaxRegistrationInternalDto } from '@domain/legal-entity/dto/request/create-le-tax-registration-internal.dto';
import { CreateLegalEntityInternalDto } from '@domain/legal-entity/dto/request/create-legal-entity-internal.dto';
import { ReorderLegalEntitiesInternalDto } from '@domain/legal-entity/dto/request/reorder-legal-entities-internal.dto';
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
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf } from '@vritti/api-sdk/auth';
import type { SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';
import { OrgScopeInterceptor } from '@/security/interceptors/org-scope.interceptor';
import { OrgStructureSelectQueryDto } from '../dto/request/org-structure-select-query.dto';
import { SetFeatureLocksInternalDto } from '../dto/request/set-feature-locks-internal.dto';
import type { FeatureLocksResponseDto } from '../dto/response/feature-locks-response.dto';
import {
  ApiAddLeTaxRegistration,
  ApiCreateLegalEntity,
  ApiDeleteLegalEntity,
  ApiDeleteLeTaxRegistration,
  ApiGetLegalEntityLocks,
  ApiListLegalEntityRoleAssignments,
  ApiReorderLegalEntities,
  ApiSelectLegalEntities,
  ApiSetLegalEntityLocks,
  ApiUpdateLegalEntity,
} from './docs/legal-entity.docs';
import { LegalEntityService } from './services/legal-entity-api.service';

@ApiTags('Legal Entities')
@Controller('legal-entities/internal')
@Public()
@SkipCsrf()
@UseGuards(CloudSignatureGuard)
@UseInterceptors(OrgScopeInterceptor)
export class LegalEntityController {
  private readonly logger = new Logger(LegalEntityController.name);

  constructor(private readonly legalEntityApiService: LegalEntityService) {}

  // Creates a new legal entity for an organization
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateLegalEntity()
  async create(@Body() dto: CreateLegalEntityInternalDto): Promise<LegalEntityDto> {
    this.logger.log(`POST /legal-entities/internal — "${dto.name}" for org ${dto.orgId}`);
    return this.legalEntityApiService.create(dto);
  }

  // Returns legal entities as select options with subtree exclusion
  @Get('select')
  @ApiSelectLegalEntities()
  async findForSelect(@Query() query: OrgStructureSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /legal-entities/internal/select');
    return this.legalEntityApiService.findForSelect(query);
  }

  // Reorders a batch of sibling legal entities
  @Patch('reorder')
  @ApiReorderLegalEntities()
  async reorder(@Body() dto: ReorderLegalEntitiesInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `PATCH /legal-entities/internal/reorder — ${dto.ids.length} entit${dto.ids.length === 1 ? 'y' : 'ies'} for org ${dto.orgId}`,
    );
    return this.legalEntityApiService.reorder(dto.orgId, dto.ids);
  }

  // Updates a legal entity
  @Patch(':id')
  @ApiUpdateLegalEntity()
  async update(@Param('id') id: string, @Body() dto: UpdateLegalEntityInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /legal-entities/internal/${id}`);
    return this.legalEntityApiService.update(id, dto);
  }

  // Lists role assignments targeting a legal entity
  @Get(':id/role-assignments')
  @ApiListLegalEntityRoleAssignments()
  async listRoleAssignments(@Param('id') id: string) {
    this.logger.log(`GET /legal-entities/internal/${id}/role-assignments`);
    return this.legalEntityApiService.findRoleAssignments(id);
  }

  // Returns the legal entity's feature lock deny-list
  @Get(':id/locks')
  @ApiGetLegalEntityLocks()
  async getLocks(@Param('id') id: string): Promise<FeatureLocksResponseDto> {
    this.logger.log(`GET /legal-entities/internal/${id}/locks`);
    return this.legalEntityApiService.getFeatureLocks(id);
  }

  // Replaces the legal entity's feature lock deny-list
  @Put(':id/locks')
  @ApiSetLegalEntityLocks()
  async setLocks(@Param('id') id: string, @Body() dto: SetFeatureLocksInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /legal-entities/internal/${id}/locks`);
    return this.legalEntityApiService.setFeatureLocks(id, dto);
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
    return this.legalEntityApiService.addRegistration(id, dto);
  }

  // Deletes a legal entity
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteLegalEntity()
  async remove(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /legal-entities/internal/${id}`);
    return this.legalEntityApiService.remove(id);
  }

  // Deletes a tax registration from a legal entity
  @Delete(':id/registrations/:regId')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteLeTaxRegistration()
  async removeRegistration(@Param('id') id: string, @Param('regId') regId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /legal-entities/internal/${id}/registrations/${regId}`);
    return this.legalEntityApiService.deleteRegistration(id, regId);
  }
}

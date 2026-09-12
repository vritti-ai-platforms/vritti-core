import { LegalEntityDto } from '@domain/legal-entity/dto/entity/legal-entity.dto';
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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { OrgId } from '@/security/decorators/org-id.decorator';
import { OrgStructureSelectQueryDto } from '../dto/request/org-structure-select-query.dto';
import { SetFeatureLocksInternalDto } from '../dto/request/set-feature-locks-internal.dto';
import type { FeatureLocksResponseDto } from '../dto/response/feature-locks-response.dto';
import {
  ApiCreateLegalEntity,
  ApiDeleteLegalEntity,
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
@Require(AuthType.Cloud)
export class LegalEntityController {
  private readonly logger = new Logger(LegalEntityController.name);

  constructor(private readonly legalEntityApiService: LegalEntityService) {}

  // Creates a new legal entity for an organization
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateLegalEntity()
  async create(@OrgId() orgId: string, @Body() dto: CreateLegalEntityInternalDto): Promise<LegalEntityDto> {
    this.logger.log(`POST /legal-entities/internal — "${dto.name}" for org ${orgId}`);
    return this.legalEntityApiService.create(orgId, dto);
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
  async reorder(@OrgId() orgId: string, @Body() dto: ReorderLegalEntitiesInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `PATCH /legal-entities/internal/reorder — ${pluralize('entity', dto.ids.length, true)} for org ${orgId}`,
    );
    return this.legalEntityApiService.reorder(orgId, dto.ids);
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

  // Deletes a legal entity
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteLegalEntity()
  async remove(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /legal-entities/internal/${id}`);
    return this.legalEntityApiService.remove(id);
  }
}

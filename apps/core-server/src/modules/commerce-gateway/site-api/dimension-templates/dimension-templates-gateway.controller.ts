import {
  ApiCreateDimensionTemplate,
  ApiDeleteDimensionTemplate,
  ApiListDimensionTemplates,
  ApiSetDimensionTemplateActive,
  ApiUpdateDimensionTemplate,
  ApiUpsertDimensionTemplateValues,
} from '@commerce/dimension-templates/docs/dimension-templates-gateway.docs';
import { CreateDimensionTemplateDto } from '@commerce/dimension-templates/dto/request/create-dimension-template.dto';
import { DimensionTemplatesQueryDto } from '@commerce/dimension-templates/dto/request/dimension-templates-query.dto';
import { SetDimensionTemplateActiveDto } from '@commerce/dimension-templates/dto/request/set-dimension-template-active.dto';
import { UpdateDimensionTemplateDto } from '@commerce/dimension-templates/dto/request/update-dimension-template.dto';
import { UpsertDimensionTemplateValuesDto } from '@commerce/dimension-templates/dto/request/upsert-dimension-template-values.dto';
import type { DimensionTemplateResponseDto } from '@commerce/dimension-templates/dto/response/dimension-template-response.dto';
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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { SITE_DIMENSION_TEMPLATES } from '@vritti/commerce-permissions/dimension-templates';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import { SiteDimensionTemplatesGatewayService } from './services/dimension-templates-gateway.service';

@ApiTags('Commerce - Dimension Templates (Site)')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_DIMENSION_TEMPLATES.featureCode)
@Controller('site/dimension-templates')
export class SiteDimensionTemplatesGatewayController {
  private readonly logger = new Logger(SiteDimensionTemplatesGatewayController.name);

  constructor(private readonly service: SiteDimensionTemplatesGatewayService) {}

  // Returns every dimension template this workspace can reach
  @Get()
  @RequirePermission(SITE_DIMENSION_TEMPLATES.view)
  @ApiListDimensionTemplates()
  list(@OrgId() orgId: string, @Query() query: DimensionTemplatesQueryDto): Promise<DimensionTemplateResponseDto[]> {
    this.logger.log('GET /commerce-api/site/dimension-templates');
    return this.service.list(orgId, query.search);
  }

  // Creates a dimension template owned by this workspace
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_DIMENSION_TEMPLATES.add)
  @ApiCreateDimensionTemplate()
  create(@Body() dto: CreateDimensionTemplateDto): Promise<CreateResponseDto<DimensionTemplateResponseDto>> {
    this.logger.log(`POST /commerce-api/site/dimension-templates`);
    return this.service.create(dto);
  }

  // Updates a dimension template by ID
  @Patch(':id')
  @RequirePermission(SITE_DIMENSION_TEMPLATES.edit)
  @ApiUpdateDimensionTemplate()
  update(@Param('id') id: string, @Body() dto: UpdateDimensionTemplateDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/dimension-templates/${id}`);
    return this.service.update(id, dto);
  }

  // Activates or deactivates a dimension template
  @Patch(':id/active')
  @RequirePermission(SITE_DIMENSION_TEMPLATES.toggle)
  @ApiSetDimensionTemplateActive()
  setActive(@Param('id') id: string, @Body() dto: SetDimensionTemplateActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/dimension-templates/${id}/active`);
    return this.service.setActive(id, dto.isActive);
  }

  // Deletes a dimension template by ID
  @Delete(':id')
  @RequirePermission(SITE_DIMENSION_TEMPLATES.delete)
  @ApiDeleteDimensionTemplate()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/dimension-templates/${id}`);
    return this.service.delete(id);
  }

  // Replaces a template's values with the set supplied
  @Put(':id/values')
  @RequirePermission(SITE_DIMENSION_TEMPLATES.values.upsert)
  @ApiUpsertDimensionTemplateValues()
  upsertValues(@Param('id') id: string, @Body() dto: UpsertDimensionTemplateValuesDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /commerce-api/site/dimension-templates/${id}/values`);
    return this.service.upsertValues(id, dto.values);
  }
}

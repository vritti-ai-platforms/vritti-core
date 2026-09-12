import {
  ApiCreateOfferingDimensionTemplate,
  ApiDeleteOfferingDimensionTemplate,
  ApiGetOfferingDimensionTemplate,
  ApiListOfferingDimensionTemplates,
  ApiSetOfferingDimensionTemplateActive,
  ApiUpdateOfferingDimensionTemplate,
  ApiUpsertOfferingDimensionTemplateValues,
} from '@commerce/offering-dimension-templates/docs/offering-dimension-templates-gateway.docs';
import { CreateOfferingDimensionTemplateDto } from '@commerce/offering-dimension-templates/dto/request/create-offering-dimension-template.dto';
import { OfferingDimensionTemplatesQueryDto } from '@commerce/offering-dimension-templates/dto/request/offering-dimension-templates-query.dto';
import { SetOfferingDimensionTemplateActiveDto } from '@commerce/offering-dimension-templates/dto/request/set-offering-dimension-template-active.dto';
import { UpdateOfferingDimensionTemplateDto } from '@commerce/offering-dimension-templates/dto/request/update-offering-dimension-template.dto';
import { UpsertOfferingDimensionTemplateValuesDto } from '@commerce/offering-dimension-templates/dto/request/upsert-offering-dimension-template-values.dto';
import type { OfferingDimensionTemplateResponseDto } from '@commerce/offering-dimension-templates/dto/response/offering-dimension-template-response.dto';
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
import { ORG_OFFERING_DIMENSION_TEMPLATES } from '@vritti/commerce-permissions/offering-dimension-templates';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgOfferingDimensionTemplatesGatewayService } from './services/offering-dimension-templates-gateway.service';

@ApiTags('Commerce - Dimension Templates (Org)')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_OFFERING_DIMENSION_TEMPLATES.featureCode)
@Controller('org/dimension-templates')
export class OrgOfferingDimensionTemplatesGatewayController {
  private readonly logger = new Logger(OrgOfferingDimensionTemplatesGatewayController.name);

  constructor(private readonly service: OrgOfferingDimensionTemplatesGatewayService) {}

  // Returns every dimension template this workspace can reach
  @Get()
  @RequirePermission(ORG_OFFERING_DIMENSION_TEMPLATES.view)
  @ApiListOfferingDimensionTemplates()
  list(@Query() query: OfferingDimensionTemplatesQueryDto): Promise<OfferingDimensionTemplateResponseDto[]> {
    this.logger.log('GET /commerce-api/org/dimension-templates');
    return this.service.list(query.search);
  }

  // Creates a dimension template owned by this workspace
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_OFFERING_DIMENSION_TEMPLATES.add)
  @ApiCreateOfferingDimensionTemplate()
  create(
    @Body() dto: CreateOfferingDimensionTemplateDto,
  ): Promise<CreateResponseDto<OfferingDimensionTemplateResponseDto>> {
    this.logger.log(`POST /commerce-api/org/dimension-templates`);
    return this.service.create(dto);
  }

  // Returns a single dimension template with its values
  @Get(':id')
  @RequirePermission(ORG_OFFERING_DIMENSION_TEMPLATES.view)
  @ApiGetOfferingDimensionTemplate()
  findById(@Param('id') id: string): Promise<OfferingDimensionTemplateResponseDto> {
    this.logger.log(`GET /commerce-api/org/dimension-templates/${id}`);
    return this.service.findById(id);
  }

  // Updates a dimension template by ID
  @Patch(':id')
  @RequirePermission(ORG_OFFERING_DIMENSION_TEMPLATES.edit)
  @ApiUpdateOfferingDimensionTemplate()
  update(@Param('id') id: string, @Body() dto: UpdateOfferingDimensionTemplateDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/dimension-templates/${id}`);
    return this.service.update(id, dto);
  }

  // Activates or deactivates a dimension template
  @Patch(':id/active')
  @RequirePermission(ORG_OFFERING_DIMENSION_TEMPLATES.toggle)
  @ApiSetOfferingDimensionTemplateActive()
  setActive(@Param('id') id: string, @Body() dto: SetOfferingDimensionTemplateActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/dimension-templates/${id}/active`);
    return this.service.setActive(id, dto.isActive);
  }

  // Deletes a dimension template by ID
  @Delete(':id')
  @RequirePermission(ORG_OFFERING_DIMENSION_TEMPLATES.delete)
  @ApiDeleteOfferingDimensionTemplate()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/org/dimension-templates/${id}`);
    return this.service.delete(id);
  }

  // Replaces a template's values with the set supplied
  @Put(':id/values')
  @RequirePermission(ORG_OFFERING_DIMENSION_TEMPLATES.values.upsert)
  @ApiUpsertOfferingDimensionTemplateValues()
  upsertValues(
    @Param('id') id: string,
    @Body() dto: UpsertOfferingDimensionTemplateValuesDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /commerce-api/org/dimension-templates/${id}/values`);
    return this.service.upsertValues(id, dto.values);
  }
}

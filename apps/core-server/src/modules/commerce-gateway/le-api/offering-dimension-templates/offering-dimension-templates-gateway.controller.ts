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
import { LE_OFFERING_DIMENSION_TEMPLATES } from '@vritti/commerce-permissions/offering-dimension-templates';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { LeOfferingDimensionTemplatesGatewayService } from './services/offering-dimension-templates-gateway.service';

@ApiTags('Commerce - Dimension Templates (LE)')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_OFFERING_DIMENSION_TEMPLATES.featureCode)
@Controller('le/dimension-templates')
export class LeOfferingDimensionTemplatesGatewayController {
  private readonly logger = new Logger(LeOfferingDimensionTemplatesGatewayController.name);

  constructor(private readonly service: LeOfferingDimensionTemplatesGatewayService) {}

  // Returns every dimension template this workspace can reach
  @Get()
  @RequirePermission(LE_OFFERING_DIMENSION_TEMPLATES.view)
  @ApiListOfferingDimensionTemplates()
  list(@Query() query: OfferingDimensionTemplatesQueryDto): Promise<OfferingDimensionTemplateResponseDto[]> {
    this.logger.log('GET /commerce-api/le/dimension-templates');
    return this.service.list(query.search);
  }

  // Creates a dimension template owned by this workspace
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_OFFERING_DIMENSION_TEMPLATES.add)
  @ApiCreateOfferingDimensionTemplate()
  create(
    @Body() dto: CreateOfferingDimensionTemplateDto,
  ): Promise<CreateResponseDto<OfferingDimensionTemplateResponseDto>> {
    this.logger.log(`POST /commerce-api/le/dimension-templates`);
    return this.service.create(dto);
  }

  // Returns a single dimension template with its values
  @Get(':id')
  @RequirePermission(LE_OFFERING_DIMENSION_TEMPLATES.view)
  @ApiGetOfferingDimensionTemplate()
  findById(@Param('id') id: string): Promise<OfferingDimensionTemplateResponseDto> {
    this.logger.log(`GET /commerce-api/le/dimension-templates/${id}`);
    return this.service.findById(id);
  }

  // Updates a dimension template by ID
  @Patch(':id')
  @RequirePermission(LE_OFFERING_DIMENSION_TEMPLATES.edit)
  @ApiUpdateOfferingDimensionTemplate()
  update(@Param('id') id: string, @Body() dto: UpdateOfferingDimensionTemplateDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/dimension-templates/${id}`);
    return this.service.update(id, dto);
  }

  // Activates or deactivates a dimension template
  @Patch(':id/active')
  @RequirePermission(LE_OFFERING_DIMENSION_TEMPLATES.toggle)
  @ApiSetOfferingDimensionTemplateActive()
  setActive(@Param('id') id: string, @Body() dto: SetOfferingDimensionTemplateActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/dimension-templates/${id}/active`);
    return this.service.setActive(id, dto.isActive);
  }

  // Deletes a dimension template by ID
  @Delete(':id')
  @RequirePermission(LE_OFFERING_DIMENSION_TEMPLATES.delete)
  @ApiDeleteOfferingDimensionTemplate()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/dimension-templates/${id}`);
    return this.service.delete(id);
  }

  // Replaces a template's values with the set supplied
  @Put(':id/values')
  @RequirePermission(LE_OFFERING_DIMENSION_TEMPLATES.values.upsert)
  @ApiUpsertOfferingDimensionTemplateValues()
  upsertValues(
    @Param('id') id: string,
    @Body() dto: UpsertOfferingDimensionTemplateValuesDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /commerce-api/le/dimension-templates/${id}/values`);
    return this.service.upsertValues(id, dto.values);
  }
}

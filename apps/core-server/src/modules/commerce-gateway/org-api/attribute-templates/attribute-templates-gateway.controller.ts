import {
  ApiCreateAttributeTemplate,
  ApiDeleteAttributeTemplate,
  ApiListAttributeTemplates,
  ApiSetAttributeTemplateActive,
  ApiUpdateAttributeTemplate,
  ApiUpsertAttributeTemplateValues,
} from '@commerce/attribute-templates/docs/attribute-templates-gateway.docs';
import { AttributeTemplatesQueryDto } from '@commerce/attribute-templates/dto/request/attribute-templates-query.dto';
import { CreateAttributeTemplateDto } from '@commerce/attribute-templates/dto/request/create-attribute-template.dto';
import { SetAttributeTemplateActiveDto } from '@commerce/attribute-templates/dto/request/set-attribute-template-active.dto';
import { UpdateAttributeTemplateDto } from '@commerce/attribute-templates/dto/request/update-attribute-template.dto';
import { UpsertAttributeTemplateValuesDto } from '@commerce/attribute-templates/dto/request/upsert-attribute-template-values.dto';
import type { AttributeTemplateResponseDto } from '@commerce/attribute-templates/dto/response/attribute-template-response.dto';
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
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { ORG_ATTRIBUTE_TEMPLATES } from '@vritti/commerce-permissions/attribute-templates';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import { OrgAttributeTemplatesGatewayService } from './services/attribute-templates-gateway.service';

@ApiTags('Commerce - Attribute Templates (Org)')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_ATTRIBUTE_TEMPLATES.featureCode)
@Controller('org/attribute-templates')
export class OrgAttributeTemplatesGatewayController {
  private readonly logger = new Logger(OrgAttributeTemplatesGatewayController.name);

  constructor(private readonly service: OrgAttributeTemplatesGatewayService) {}

  // Returns every attribute template this workspace can reach
  @Get()
  @RequirePermission(ORG_ATTRIBUTE_TEMPLATES.view)
  @ApiListAttributeTemplates()
  list(@OrgId() orgId: string, @Query() query: AttributeTemplatesQueryDto): Promise<AttributeTemplateResponseDto[]> {
    this.logger.log('GET /commerce-api/org/attribute-templates');
    return this.service.list(orgId, query.search);
  }

  // Creates an attribute template owned by this workspace
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_ATTRIBUTE_TEMPLATES.add)
  @ApiCreateAttributeTemplate()
  create(@Body() dto: CreateAttributeTemplateDto): Promise<CreateResponseDto<AttributeTemplateResponseDto>> {
    this.logger.log(`POST /commerce-api/org/attribute-templates`);
    return this.service.create(dto);
  }

  // Updates an attribute template by ID
  @Patch(':id')
  @RequirePermission(ORG_ATTRIBUTE_TEMPLATES.edit)
  @ApiUpdateAttributeTemplate()
  update(@Param('id') id: string, @Body() dto: UpdateAttributeTemplateDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/attribute-templates/${id}`);
    return this.service.update(id, dto);
  }

  // Activates or deactivates an attribute template
  @Patch(':id/active')
  @RequirePermission(ORG_ATTRIBUTE_TEMPLATES.toggle)
  @ApiSetAttributeTemplateActive()
  setActive(@Param('id') id: string, @Body() dto: SetAttributeTemplateActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/attribute-templates/${id}/active`);
    return this.service.setActive(id, dto.isActive);
  }

  // Deletes an attribute template by ID
  @Delete(':id')
  @RequirePermission(ORG_ATTRIBUTE_TEMPLATES.delete)
  @ApiDeleteAttributeTemplate()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/org/attribute-templates/${id}`);
    return this.service.delete(id);
  }

  // Replaces a template's values with the set supplied
  @Put(':id/values')
  @RequirePermission(ORG_ATTRIBUTE_TEMPLATES.values.upsert)
  @ApiUpsertAttributeTemplateValues()
  upsertValues(@Param('id') id: string, @Body() dto: UpsertAttributeTemplateValuesDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /commerce-api/org/attribute-templates/${id}/values`);
    return this.service.upsertValues(id, dto.values);
  }
}

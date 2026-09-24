import {
  ApiAddBomLine,
  ApiAddSuggestedComponent,
  ApiBulkSetOfferingStatus,
  ApiBulkSetVariantsStatus,
  ApiClearVariantFulfilment,
  ApiClearVariantTaxClass,
  ApiCreateOffering,
  ApiCreateOfferingDimension,
  ApiCreateOfferingDimensionFromTemplate,
  ApiCreateOfferingVariant,
  ApiDeleteBomLine,
  ApiDeleteOffering,
  ApiDeleteOfferingDimension,
  ApiDeleteOfferingVariant,
  ApiGenerateOfferingVariants,
  ApiGetOffering,
  ApiGetOfferingVariant,
  ApiListOfferingDimensions,
  ApiOfferingsTable,
  ApiOfferingVariantsTable,
  ApiPreviewOfferingVariantCombinations,
  ApiReorderOfferingDimensions,
  ApiSetOfferingFulfilment,
  ApiSetOfferingStatus,
  ApiSetOfferingTaxClass,
  ApiSetVariantFulfilment,
  ApiSetVariantTaxClass,
  ApiUpdateBomLine,
  ApiUpdateOffering,
  ApiUpdateOfferingDimension,
  ApiUpdateOfferingVariant,
  ApiUpsertOfferingDimensionValues,
} from '@commerce/offerings/docs/offerings-gateway.docs';
import { AddBomLineDto, UpdateBomLineDto } from '@commerce/offerings/dto/request/bom-line.dto';
import { BulkSetOfferingStatusDto } from '@commerce/offerings/dto/request/bulk-set-offering-status.dto';
import { BulkSetVariantsStatusDto } from '@commerce/offerings/dto/request/bulk-set-variants-status.dto';
import { CreateOfferingDto } from '@commerce/offerings/dto/request/create-offering.dto';
import { CreateOfferingDimensionDto } from '@commerce/offerings/dto/request/create-offering-dimension.dto';
import { CreateOfferingDimensionFromTemplateDto } from '@commerce/offerings/dto/request/create-offering-dimension-from-template.dto';
import { CreateVariantDto } from '@commerce/offerings/dto/request/create-variant.dto';
import { GenerateVariantsDto } from '@commerce/offerings/dto/request/generate-variants.dto';
import { ReorderOfferingDimensionsDto } from '@commerce/offerings/dto/request/reorder-offering-dimensions.dto';
import { SetFulfilmentDto } from '@commerce/offerings/dto/request/set-fulfilment.dto';
import { SetOfferingStatusDto } from '@commerce/offerings/dto/request/set-offering-status.dto';
import { SetTaxClassDto } from '@commerce/offerings/dto/request/set-tax-class.dto';
import { UpdateOfferingDto } from '@commerce/offerings/dto/request/update-offering.dto';
import { UpdateOfferingDimensionDto } from '@commerce/offerings/dto/request/update-offering-dimension.dto';
import { UpdateVariantDto } from '@commerce/offerings/dto/request/update-variant.dto';
import { UpsertOfferingDimensionValuesDto } from '@commerce/offerings/dto/request/upsert-offering-dimension-values.dto';
import type { OfferingDimensionResponseDto } from '@commerce/offerings/dto/response/offering-dimension-response.dto';
import type { OfferingResponseDto } from '@commerce/offerings/dto/response/offering-response.dto';
import type { OfferingTableResponseDto } from '@commerce/offerings/dto/response/offering-table-response.dto';
import type { OfferingVariantResponseDto } from '@commerce/offerings/dto/response/offering-variant-response.dto';
import type { OfferingVariantTableResponseDto } from '@commerce/offerings/dto/response/offering-variant-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { SITE_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import { PreviewCombinationsDto } from '../../domain/offerings/dto/request/preview-combinations.dto';
import { VariantCombinationsResponseDto } from '../../domain/offerings/dto/response/variant-combinations-response.dto';
import { SiteOfferingsGatewayService } from './services/offerings-gateway.service';

@ApiTags('Commerce - Offerings (Site)')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_OFFERINGS.featureCode)
@Controller('site/offerings')
export class SiteOfferingsGatewayController {
  private readonly logger = new Logger(SiteOfferingsGatewayController.name);

  constructor(private readonly service: SiteOfferingsGatewayService) {}

  // Returns paginated offerings for the data table
  @Get('table')
  @RequirePermission(SITE_OFFERINGS.view)
  @ApiOfferingsTable()
  getTable(@OrgId() orgId: string, @UserId() userId: string): Promise<OfferingTableResponseDto> {
    this.logger.log('GET /commerce-api/site/offerings/table');
    return this.service.findForTable(orgId, userId);
  }

  // Creates an offering owned by this workspace
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_OFFERINGS.add)
  @ApiCreateOffering()
  create(@Body() dto: CreateOfferingDto): Promise<CreateResponseDto<OfferingResponseDto>> {
    this.logger.log('POST /commerce-api/site/offerings');
    return this.service.create(dto);
  }

  // Returns an offering's dimensions, in SKU segment order
  @Get(':id/dimensions')
  @RequirePermission(SITE_OFFERINGS.dimensions.view)
  @ApiListOfferingDimensions()
  listDimensions(@Param('id') id: string): Promise<OfferingDimensionResponseDto[]> {
    this.logger.log(`GET /commerce-api/site/offerings/${id}/dimensions`);
    return this.service.listDimensions(id);
  }

  // Appends a dimension seeded from a template — code, name and values are copied server-side
  @Post(':id/dimensions')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_OFFERINGS.dimensions.add)
  @ApiCreateOfferingDimension()
  createDimension(
    @Param('id') id: string,
    @Body() dto: CreateOfferingDimensionDto,
  ): Promise<CreateResponseDto<OfferingDimensionResponseDto>> {
    this.logger.log(`POST /commerce-api/site/offerings/${id}/dimensions`);
    return this.service.createDimension(id, dto);
  }

  // Appends a dimension seeded from a template; code, name and values are copied server-side
  @Post(':id/dimensions/from-template')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_OFFERINGS.dimensions.addFromTemplate)
  @ApiCreateOfferingDimensionFromTemplate()
  createDimensionFromTemplate(
    @Param('id') id: string,
    @Body() dto: CreateOfferingDimensionFromTemplateDto,
  ): Promise<CreateResponseDto<OfferingDimensionResponseDto>> {
    this.logger.log(`POST /commerce-api/site/offerings/${id}/dimensions/from-template`);
    return this.service.createDimensionFromTemplate(id, dto);
  }

  // Replaces a dimension's value set
  @Put('dimensions/:dimensionId/values')
  @RequirePermission(SITE_OFFERINGS.dimensions.edit)
  @ApiUpsertOfferingDimensionValues()
  upsertDimensionValues(
    @Param('dimensionId') dimensionId: string,
    @Body() dto: UpsertOfferingDimensionValuesDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /commerce-api/site/offerings/dimensions/${dimensionId}/values`);
    return this.service.upsertDimensionValues(dimensionId, dto);
  }
  // Reorders the axes. Stored SKUs are never recomputed, so this only affects variants created after it
  @Put(':id/dimensions/order')
  @RequirePermission(SITE_OFFERINGS.dimensions.edit)
  @ApiReorderOfferingDimensions()
  reorderDimensions(@Param('id') id: string, @Body() dto: ReorderOfferingDimensionsDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /commerce-api/site/offerings/${id}/dimensions/order`);
    return this.service.reorderDimensions(id, dto.dimensionIds);
  }

  // Removes a dimension; refused while variants use its values
  // Renames a dimension; its code is fixed because every derived SKU carries it
  @Patch('dimensions/:dimensionId')
  @RequirePermission(SITE_OFFERINGS.dimensions.edit)
  @ApiUpdateOfferingDimension()
  updateDimension(
    @Param('dimensionId') dimensionId: string,
    @Body() dto: UpdateOfferingDimensionDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/offerings/dimensions/${dimensionId}`);
    return this.service.updateDimension(dimensionId, dto);
  }

  @Delete('dimensions/:dimensionId')
  @RequirePermission(SITE_OFFERINGS.dimensions.delete)
  @ApiDeleteOfferingDimension()
  deleteDimension(@Param('dimensionId') dimensionId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/offerings/dimensions/${dimensionId}`);
    return this.service.deleteDimension(dimensionId);
  }

  // Returns paginated variants of one offering for the data table
  @Get(':id/variants/table')
  @RequirePermission(SITE_OFFERINGS.variants.view)
  @ApiOfferingVariantsTable()
  getVariantsTable(@Param('id') id: string, @UserId() userId: string): Promise<OfferingVariantTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/offerings/${id}/variants/table`);
    return this.service.findVariantsForTable(userId, id);
  }

  // Every combination the selected values produce, flagged with the ones that already exist
  @Post(':id/variants/combinations')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(SITE_OFFERINGS.variants.add)
  @ApiPreviewOfferingVariantCombinations()
  previewVariantCombinations(
    @Param('id') id: string,
    @Body() dto: PreviewCombinationsDto,
  ): Promise<VariantCombinationsResponseDto> {
    this.logger.log(`POST /commerce-api/site/offerings/${id}/variants/combinations`);
    return this.service.previewVariantCombinations(id, dto);
  }

  // Creates every selected combination that does not exist yet
  @Post(':id/variants/generate')
  @RequirePermission(SITE_OFFERINGS.variants.add)
  @ApiGenerateOfferingVariants()
  generateVariants(@Param('id') id: string, @Body() dto: GenerateVariantsDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/offerings/${id}/variants/generate`);
    return this.service.generateVariants(id, dto);
  }

  // Adds a single variant from one explicit combination
  @Post(':id/variants')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_OFFERINGS.variants.add)
  @ApiCreateOfferingVariant()
  createVariant(
    @Param('id') id: string,
    @Body() dto: CreateVariantDto,
  ): Promise<CreateResponseDto<OfferingVariantResponseDto>> {
    this.logger.log(`POST /commerce-api/site/offerings/${id}/variants`);
    return this.service.createVariant(id, dto);
  }

  // Updates a variant; activation is gated on its bill of materials
  // One variant with its values and bill of materials
  @Get('variants/:variantId')
  @RequirePermission(SITE_OFFERINGS.variants.view)
  @ApiGetOfferingVariant()
  getVariant(@Param('variantId') variantId: string): Promise<OfferingVariantResponseDto> {
    this.logger.log(`GET /commerce-api/site/offerings/variants/${variantId}`);
    return this.service.findVariantById(variantId);
  }

  @Patch('variants/:variantId')
  @RequirePermission(SITE_OFFERINGS.variants.edit)
  @ApiUpdateOfferingVariant()
  updateVariant(@Param('variantId') variantId: string, @Body() dto: UpdateVariantDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/offerings/variants/${variantId}`);
    return this.service.updateVariant(variantId, dto);
  }

  // Replaces a variant's bill of materials as a set
  // Its own route rather than a field on update: setting it cascades to every variant that has not
  // pinned its own, and the response reports how many kept an override
  @Patch(':id/fulfilment')
  @RequirePermission(SITE_OFFERINGS.edit)
  @ApiSetOfferingFulfilment()
  setFulfilment(@Param('id') id: string, @Body() dto: SetFulfilmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/offerings/${id}/fulfilment`);
    return this.service.setFulfilment(id, dto);
  }

  @Patch('variants/:variantId/fulfilment')
  @RequirePermission(SITE_OFFERINGS.variants.edit)
  @ApiSetVariantFulfilment()
  setVariantFulfilment(
    @Param('variantId') variantId: string,
    @Body() dto: SetFulfilmentDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/offerings/variants/${variantId}/fulfilment`);
    return this.service.setVariantFulfilment(variantId, dto);
  }

  @Delete('variants/:variantId/fulfilment')
  @RequirePermission(SITE_OFFERINGS.variants.edit)
  @ApiClearVariantFulfilment()
  clearVariantFulfilment(@Param('variantId') variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/offerings/variants/${variantId}/fulfilment`);
    return this.service.clearVariantFulfilment(variantId);
  }

  @Patch(':id/tax-class')
  @RequirePermission(SITE_OFFERINGS.edit)
  @ApiSetOfferingTaxClass()
  setTaxClass(@Param('id') id: string, @Body() dto: SetTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/offerings/${id}/tax-class`);
    return this.service.setTaxClass(id, dto);
  }

  @Patch('variants/:variantId/tax-class')
  @RequirePermission(SITE_OFFERINGS.variants.edit)
  @ApiSetVariantTaxClass()
  setVariantTaxClass(@Param('variantId') variantId: string, @Body() dto: SetTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/offerings/variants/${variantId}/tax-class`);
    return this.service.setVariantTaxClass(variantId, dto);
  }

  @Delete('variants/:variantId/tax-class')
  @RequirePermission(SITE_OFFERINGS.variants.edit)
  @ApiClearVariantTaxClass()
  clearVariantTaxClass(@Param('variantId') variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/offerings/variants/${variantId}/tax-class`);
    return this.service.clearVariantTaxClass(variantId);
  }

  @Post('variants/:variantId/bom/lines')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_OFFERINGS.variants.bom.add)
  @ApiAddBomLine()
  addBomLine(@Param('variantId') variantId: string, @Body() dto: AddBomLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/offerings/variants/${variantId}/bom/lines`);
    return this.service.addBomLine(variantId, dto);
  }

  @Patch('variants/:variantId/bom/lines/:lineId')
  @RequirePermission(SITE_OFFERINGS.variants.bom.edit)
  @ApiUpdateBomLine()
  updateBomLine(@Param('lineId') lineId: string, @Body() dto: UpdateBomLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/offerings/variants/bom/lines/${lineId}`);
    return this.service.updateBomLine(lineId, dto);
  }

  @Delete('variants/:variantId/bom/lines/:lineId')
  @RequirePermission(SITE_OFFERINGS.variants.bom.delete)
  @ApiDeleteBomLine()
  deleteBomLine(@Param('lineId') lineId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/offerings/variants/bom/lines/${lineId}`);
    return this.service.deleteBomLine(lineId);
  }

  // Its own grant: the caller names no item, so this can be given to someone who may not edit the
  // bill of materials freely
  @Post('variants/:variantId/bom/suggested')
  @RequirePermission(SITE_OFFERINGS.variants.bom.addFromSuggestion)
  @ApiAddSuggestedComponent()
  addSuggestedComponent(@Param('variantId') variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/offerings/variants/${variantId}/bom/suggested`);
    return this.service.addSuggestedComponent(variantId);
  }

  // Deletes a variant
  @Delete('variants/:variantId')
  @RequirePermission(SITE_OFFERINGS.variants.delete)
  @ApiDeleteOfferingVariant()
  deleteVariant(@Param('variantId') variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/offerings/variants/${variantId}`);
    return this.service.deleteVariant(variantId);
  }

  // Bulk-activates or deactivates offerings; declared before :id so "active" is not captured as an offering id
  @Patch('status')
  @RequirePermission(SITE_OFFERINGS.toggle)
  @ApiBulkSetOfferingStatus()
  bulkSetStatus(@Body() dto: BulkSetOfferingStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/offerings/status — ${dto.ids.length} selected`);
    return this.service.bulkSetStatus(dto);
  }

  // Bulk-activates or deactivates variants of one offering
  @Patch(':id/variants/status')
  @RequirePermission(SITE_OFFERINGS.variants.edit)
  @ApiBulkSetVariantsStatus()
  bulkSetVariantsStatus(@Param('id') id: string, @Body() dto: BulkSetVariantsStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/offerings/${id}/variants/status — ${dto.ids.length} selected`);
    return this.service.bulkSetVariantsStatus(id, dto);
  }

  // Returns one offering with its dimension and variant counts
  @Get(':id')
  @RequirePermission(SITE_OFFERINGS.view)
  @ApiGetOffering()
  findById(@OrgId() orgId: string, @Param('id') id: string): Promise<OfferingResponseDto> {
    this.logger.log(`GET /commerce-api/site/offerings/${id}`);
    return this.service.findById(orgId, id);
  }

  // Updates an offering this workspace owns
  @Patch(':id')
  @RequirePermission(SITE_OFFERINGS.edit)
  @ApiUpdateOffering()
  update(@Param('id') id: string, @Body() dto: UpdateOfferingDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/offerings/${id}`);
    return this.service.update(id, dto);
  }

  // Activates or deactivates an offering
  @Patch(':id/status')
  @RequirePermission(SITE_OFFERINGS.toggle)
  @ApiSetOfferingStatus()
  setStatus(@Param('id') id: string, @Body() dto: SetOfferingStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/offerings/${id}/status`);
    return this.service.setStatus(id, dto.isActive);
  }

  // Deletes an offering; refused while it has variants
  @Delete(':id')
  @RequirePermission(SITE_OFFERINGS.delete)
  @ApiDeleteOffering()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/offerings/${id}`);
    return this.service.delete(id);
  }
}

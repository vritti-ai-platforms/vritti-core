import {
  ApiAddBomLine,
  ApiAddSuggestedComponent,
  ApiBulkClearVariantsTaxClass,
  ApiBulkSetOfferingStatus,
  ApiBulkSetVariantsAttribute,
  ApiBulkSetVariantsStatus,
  ApiBulkSetVariantsTaxClass,
  ApiClearVariantFulfilment,
  ApiClearVariantTaxClass,
  ApiCreateOffering,
  ApiCreateOfferingAttribute,
  ApiCreateOfferingAttributeWithValuesAndTemplate,
  ApiCreateOfferingDimension,
  ApiCreateOfferingDimensionWithValuesAndTemplate,
  ApiCreateOfferingVariant,
  ApiDeleteBomLine,
  ApiDeleteOffering,
  ApiDeleteOfferingAttribute,
  ApiDeleteOfferingDimension,
  ApiDeleteOfferingVariant,
  ApiExportOfferings,
  ApiExportOfferingVariants,
  ApiGenerateOfferingVariants,
  ApiGetOffering,
  ApiGetOfferingVariant,
  ApiListOfferingAttributes,
  ApiListOfferingDimensions,
  ApiOfferingsTable,
  ApiOfferingVariantsTable,
  ApiPreviewOfferingVariantCombinations,
  ApiReorderOfferingAttributes,
  ApiReorderOfferingDimensions,
  ApiSetOfferingFulfilment,
  ApiSetOfferingStatus,
  ApiSetOfferingTaxClass,
  ApiSetVariantAttributes,
  ApiSetVariantFulfilment,
  ApiSetVariantTaxClass,
  ApiUpdateBomLine,
  ApiUpdateOffering,
  ApiUpdateOfferingAttribute,
  ApiUpdateOfferingDimension,
  ApiUpdateOfferingVariant,
  ApiUpsertOfferingAttributeValues,
  ApiUpsertOfferingDimensionValues,
  ApiVariantBom,
} from '@commerce/offerings/docs/offerings-gateway.docs';
import { AddBomLineDto, UpdateBomLineDto } from '@commerce/offerings/dto/request/bom-line.dto';
import { BulkClearVariantsTaxClassDto } from '@commerce/offerings/dto/request/bulk-clear-variants-tax-class.dto';
import { BulkSetOfferingStatusDto } from '@commerce/offerings/dto/request/bulk-set-offering-status.dto';
import { BulkSetVariantsAttributeDto } from '@commerce/offerings/dto/request/bulk-set-variants-attribute.dto';
import { BulkSetVariantsStatusDto } from '@commerce/offerings/dto/request/bulk-set-variants-status.dto';
import { BulkSetVariantsTaxClassDto } from '@commerce/offerings/dto/request/bulk-set-variants-tax-class.dto';
import { CreateOfferingDto } from '@commerce/offerings/dto/request/create-offering.dto';
import { CreateOfferingAttributeDto } from '@commerce/offerings/dto/request/create-offering-attribute.dto';
import { CreateOfferingAttributeWithValuesAndTemplateDto } from '@commerce/offerings/dto/request/create-offering-attribute-with-values-and-template.dto';
import { CreateOfferingDimensionDto } from '@commerce/offerings/dto/request/create-offering-dimension.dto';
import { CreateOfferingDimensionWithValuesAndTemplateDto } from '@commerce/offerings/dto/request/create-offering-dimension-with-values-and-template.dto';
import { CreateVariantDto } from '@commerce/offerings/dto/request/create-variant.dto';
import { GenerateVariantsDto } from '@commerce/offerings/dto/request/generate-variants.dto';
import { ReorderOfferingAttributesDto } from '@commerce/offerings/dto/request/reorder-offering-attributes.dto';
import { ReorderOfferingDimensionsDto } from '@commerce/offerings/dto/request/reorder-offering-dimensions.dto';
import { SetFulfilmentDto } from '@commerce/offerings/dto/request/set-fulfilment.dto';
import { SetOfferingStatusDto } from '@commerce/offerings/dto/request/set-offering-status.dto';
import { SetTaxClassDto } from '@commerce/offerings/dto/request/set-tax-class.dto';
import { SetVariantAttributesDto } from '@commerce/offerings/dto/request/set-variant-attributes.dto';
import { UpdateOfferingDto } from '@commerce/offerings/dto/request/update-offering.dto';
import { UpdateOfferingAttributeDto } from '@commerce/offerings/dto/request/update-offering-attribute.dto';
import { UpdateOfferingDimensionDto } from '@commerce/offerings/dto/request/update-offering-dimension.dto';
import { UpdateVariantDto } from '@commerce/offerings/dto/request/update-variant.dto';
import { UpsertOfferingAttributeValuesDto } from '@commerce/offerings/dto/request/upsert-offering-attribute-values.dto';
import { UpsertOfferingDimensionValuesDto } from '@commerce/offerings/dto/request/upsert-offering-dimension-values.dto';
import type { OfferingAttributeResponseDto } from '@commerce/offerings/dto/response/offering-attribute-response.dto';
import type { OfferingDimensionResponseDto } from '@commerce/offerings/dto/response/offering-dimension-response.dto';
import type { OfferingResponseDto } from '@commerce/offerings/dto/response/offering-response.dto';
import type { OfferingTableResponseDto } from '@commerce/offerings/dto/response/offering-table-response.dto';
import type { OfferingVariantResponseDto } from '@commerce/offerings/dto/response/offering-variant-response.dto';
import type { OfferingVariantTableResponseDto } from '@commerce/offerings/dto/response/offering-variant-table-response.dto';
import type { VariantBomResponseDto } from '@commerce/offerings/dto/response/variant-bom-response.dto';
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
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { buildExportBuffer, type ExportFormat, getExportExt, getExportMimeType } from '@vritti/api-sdk/xlsx';
import { SITE_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import type { FastifyReply } from 'fastify';
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

  // Appends a dimension together with the values the caller chose
  @Post(':id/dimensions/with-values-and-template')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_OFFERINGS.dimensions.addFromTemplate)
  @ApiCreateOfferingDimensionWithValuesAndTemplate()
  createDimensionWithValuesAndTemplate(
    @Param('id') id: string,
    @Body() dto: CreateOfferingDimensionWithValuesAndTemplateDto,
  ): Promise<CreateResponseDto<OfferingDimensionResponseDto>> {
    this.logger.log(`POST /commerce-api/site/offerings/${id}/dimensions/with-values-and-template`);
    return this.service.createDimensionWithValuesAndTemplate(id, dto);
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

  // Returns an offering's attributes
  @Get(':id/attributes')
  @RequirePermission(SITE_OFFERINGS.attributes.view)
  @ApiListOfferingAttributes()
  listAttributes(@Param('id') id: string): Promise<OfferingAttributeResponseDto[]> {
    this.logger.log(`GET /commerce-api/site/offerings/${id}/attributes`);
    return this.service.listAttributes(id);
  }

  // Appends an attribute defined inline; its values are set separately
  @Post(':id/attributes')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_OFFERINGS.attributes.add)
  @ApiCreateOfferingAttribute()
  createAttribute(
    @Param('id') id: string,
    @Body() dto: CreateOfferingAttributeDto,
  ): Promise<CreateResponseDto<OfferingAttributeResponseDto>> {
    this.logger.log(`POST /commerce-api/site/offerings/${id}/attributes`);
    return this.service.createAttribute(id, dto);
  }

  // Appends an attribute together with the values the caller chose
  @Post(':id/attributes/with-values-and-template')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_OFFERINGS.attributes.addFromTemplate)
  @ApiCreateOfferingAttributeWithValuesAndTemplate()
  createAttributeWithValuesAndTemplate(
    @Param('id') id: string,
    @Body() dto: CreateOfferingAttributeWithValuesAndTemplateDto,
  ): Promise<CreateResponseDto<OfferingAttributeResponseDto>> {
    this.logger.log(`POST /commerce-api/site/offerings/${id}/attributes/with-values-and-template`);
    return this.service.createAttributeWithValuesAndTemplate(id, dto);
  }

  // Replaces an attribute's value set
  @Put('attributes/:attributeId/values')
  @RequirePermission(SITE_OFFERINGS.attributes.edit)
  @ApiUpsertOfferingAttributeValues()
  upsertAttributeValues(
    @Param('attributeId') attributeId: string,
    @Body() dto: UpsertOfferingAttributeValuesDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /commerce-api/site/offerings/attributes/${attributeId}/values`);
    return this.service.upsertAttributeValues(attributeId, dto);
  }
  // Reorders the groups — the order a storefront renders its filters in
  @Put(':id/attributes/order')
  @RequirePermission(SITE_OFFERINGS.attributes.edit)
  @ApiReorderOfferingAttributes()
  reorderAttributes(@Param('id') id: string, @Body() dto: ReorderOfferingAttributesDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /commerce-api/site/offerings/${id}/attributes/order`);
    return this.service.reorderAttributes(id, dto.attributeIds);
  }

  // Renames an attribute; its code is fixed because a storefront filters on it
  @Patch('attributes/:attributeId')
  @RequirePermission(SITE_OFFERINGS.attributes.edit)
  @ApiUpdateOfferingAttribute()
  updateAttribute(
    @Param('attributeId') attributeId: string,
    @Body() dto: UpdateOfferingAttributeDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/offerings/attributes/${attributeId}`);
    return this.service.updateAttribute(attributeId, dto);
  }

  @Delete('attributes/:attributeId')
  @RequirePermission(SITE_OFFERINGS.attributes.delete)
  @ApiDeleteOfferingAttribute()
  deleteAttribute(@Param('attributeId') attributeId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/offerings/attributes/${attributeId}`);
    return this.service.deleteAttribute(attributeId);
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

  @Put('variants/:variantId/attributes')
  @RequirePermission(SITE_OFFERINGS.variants.setAttributes)
  @ApiSetVariantAttributes()
  setVariantAttributes(
    @Param('variantId') variantId: string,
    @Body() dto: SetVariantAttributesDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /commerce-api/site/offerings/variants/${variantId}/attributes`);
    return this.service.setVariantAttributes(variantId, dto);
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

  @Get('variants/:variantId/bom/lines')
  @RequirePermission(SITE_OFFERINGS.variants.bom.view)
  @ApiVariantBom()
  findVariantBom(@Param('variantId') variantId: string): Promise<VariantBomResponseDto> {
    this.logger.log(`GET /commerce-api/site/offerings/variants/${variantId}/bom/lines`);
    return this.service.findVariantBom(variantId);
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

  // Streams every reachable offering as a file
  @Get('export/:format')
  @RequirePermission(SITE_OFFERINGS.export)
  @ApiExportOfferings()
  async exportOfferings(@Param('format') format: ExportFormat, @Res() reply: FastifyReply): Promise<void> {
    this.logger.log(`GET /commerce-api/site/offerings/export/${format}`);
    const rows = await this.service.exportOfferingRows();
    this.sendExport(reply, rows, format, 'offerings');
  }

  // Streams one offering's variants as a file
  @Get(':id/variants/export/:format')
  @RequirePermission(SITE_OFFERINGS.variants.export)
  @ApiExportOfferingVariants()
  async exportOfferingVariants(
    @Param('id') id: string,
    @Param('format') format: ExportFormat,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    this.logger.log(`GET /commerce-api/site/offerings/${id}/variants/export/${format}`);
    const rows = await this.service.exportVariantRows(id);
    this.sendExport(reply, rows, format, 'offering-variants');
  }

  // Drops the tax class override on many variants of one offering
  @Delete(':id/variants/tax-class')
  @RequirePermission(SITE_OFFERINGS.variants.edit)
  @ApiBulkClearVariantsTaxClass()
  bulkClearVariantsTaxClass(
    @Param('id') id: string,
    @Body() dto: BulkClearVariantsTaxClassDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/offerings/${id}/variants/tax-class — ${dto.ids.length} selected`);
    return this.service.bulkClearVariantsTaxClass(id, dto);
  }

  // Overrides the tax class on many variants of one offering
  @Patch(':id/variants/tax-class')
  @RequirePermission(SITE_OFFERINGS.variants.edit)
  @ApiBulkSetVariantsTaxClass()
  bulkSetVariantsTaxClass(
    @Param('id') id: string,
    @Body() dto: BulkSetVariantsTaxClassDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/offerings/${id}/variants/tax-class — ${dto.ids.length} selected`);
    return this.service.bulkSetVariantsTaxClass(id, dto);
  }

  // Sets one attribute across many variants of one offering, leaving their other attributes alone
  @Put(':id/variants/attributes')
  @RequirePermission(SITE_OFFERINGS.variants.setAttributes)
  @ApiBulkSetVariantsAttribute()
  bulkSetVariantsAttribute(
    @Param('id') id: string,
    @Body() dto: BulkSetVariantsAttributeDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /commerce-api/site/offerings/${id}/variants/attributes — ${dto.ids.length} selected`);
    return this.service.bulkSetVariantsAttribute(id, dto);
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

  // Builds the workbook and streams it — shared by both export routes
  private sendExport(
    reply: FastifyReply,
    rows: Record<string, unknown>[],
    format: ExportFormat,
    filename: string,
  ): void {
    const buffer = buildExportBuffer(rows, format);
    reply.header('Content-Type', getExportMimeType(format));
    reply.header('Content-Disposition', `attachment; filename="${filename}.${getExportExt(format)}"`);
    reply.header('Content-Length', buffer.length);
    reply.send(buffer);
  }
}

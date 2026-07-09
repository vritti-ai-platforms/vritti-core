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
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import {
  type CreateResponseDto,
  SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { SessionTypeValues } from '@/db/schema';
import { BuId } from '@/security/decorators';
import {
  ApiAssignCatalogChannel,
  ApiCloneCatalog,
  ApiCreateCatalog,
  ApiCreateCatalogModifierGroup,
  ApiCreateCatalogModifierOption,
  ApiCreateCatalogOffering,
  ApiCreateCatalogOfferingVariant,
  ApiCreateCatalogVariantOption,
  ApiDeleteCatalog,
  ApiDeleteCatalogModifierGroup,
  ApiDeleteCatalogModifierOption,
  ApiDeleteCatalogOffering,
  ApiDeleteCatalogOfferingVariant,
  ApiDeleteCatalogVariantOption,
  ApiGetCatalog,
  ApiGetCatalogModifierGroup,
  ApiGetCatalogOffering,
  ApiGetCatalogOfferingsTable,
  ApiGetCatalogsTable,
  ApiListCatalogChannels,
  ApiListCatalogModifierGroups,
  ApiListCatalogOfferingModifiers,
  ApiListCatalogOfferingVariants,
  ApiListCatalogVariantOptions,
  ApiSaveCatalogOfferingModifiers,
  ApiUnassignCatalogChannel,
  ApiUpdateCatalog,
  ApiUpdateCatalogModifierGroup,
  ApiUpdateCatalogModifierOption,
  ApiUpdateCatalogOffering,
  ApiUpdateCatalogOfferingVariant,
  ApiUpdateCatalogVariantOption,
} from './docs/catalogs-gateway.docs';
import { AssignCatalogChannelDto } from './dto/request/assign-catalog-channel.dto';
import { CreateCatalogDto } from './dto/request/create-catalog.dto';
import { CreateModifierGroupDto } from './dto/request/create-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/request/create-modifier-option.dto';
import { CreateOfferingDto } from './dto/request/create-offering.dto';
import { CreateVariantDto } from './dto/request/create-variant.dto';
import { CreateVariantOptionDto } from './dto/request/create-variant-option.dto';
import { SaveOfferingModifiersDto } from './dto/request/save-offering-modifiers.dto';
import { UpdateCatalogDto } from './dto/request/update-catalog.dto';
import { UpdateModifierGroupDto } from './dto/request/update-modifier-group.dto';
import { UpdateModifierOptionDto } from './dto/request/update-modifier-option.dto';
import { UpdateOfferingDto } from './dto/request/update-offering.dto';
import { UpdateVariantDto } from './dto/request/update-variant.dto';
import { UpdateVariantOptionDto } from './dto/request/update-variant-option.dto';
import type { CatalogChannelResponseDto } from './dto/response/catalog-channel-response.dto';
import type { CatalogResponseDto } from './dto/response/catalog-response.dto';
import type { CatalogTableResponseDto } from './dto/response/catalog-table-response.dto';
import type { ModifierGroupResponseDto, ModifierOptionResponseDto } from './dto/response/modifier-group-response.dto';
import type {
  OfferingDetailResponseDto,
  OfferingVariantResponseDto,
} from './dto/response/offering-detail-response.dto';
import type { OfferingModifierGroupResponseDto } from './dto/response/offering-modifier-group-response.dto';
import type { OfferingResponseDto } from './dto/response/offering-response.dto';
import type { OfferingsTableResponseDto } from './dto/response/offerings-table-response.dto';
import type { VariantOptionResponseDto } from './dto/response/variant-option-response.dto';
import { CatalogsGatewayService } from './services/catalogs-gateway.service';

@ApiTags('Commerce - Catalogs')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('catalogs')
export class CatalogsGatewayController {
  private readonly logger = new Logger(CatalogsGatewayController.name);

  constructor(private readonly service: CatalogsGatewayService) {}

  // Returns the catalogs data table
  @Get('table')
  @ApiGetCatalogsTable()
  getTable(@UserId() userId: string): Promise<CatalogTableResponseDto> {
    this.logger.log('GET /commerce-api/catalogs/table');
    return this.service.findForTable(userId);
  }

  // Creates a catalog
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateCatalog()
  create(@Body() dto: CreateCatalogDto, @BuId() buId: string): Promise<CreateResponseDto<CatalogResponseDto>> {
    this.logger.log('POST /commerce-api/catalogs');
    return this.service.create(dto, buId);
  }

  // Returns a catalog by ID
  @Get(':id')
  @ApiGetCatalog()
  findById(@Param('id') id: string): Promise<CatalogResponseDto> {
    this.logger.log(`GET /commerce-api/catalogs/${id}`);
    return this.service.findById(id);
  }

  // Updates a catalog by ID
  @Patch(':id')
  @ApiUpdateCatalog()
  update(@Param('id') id: string, @Body() dto: UpdateCatalogDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/catalogs/${id}`);
    return this.service.update(id, dto);
  }

  // Deletes a catalog by ID
  @Delete(':id')
  @ApiDeleteCatalog()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/catalogs/${id}`);
    return this.service.delete(id);
  }

  // Clones a catalog into a new catalog with no channel assignments
  @Post(':id/clone')
  @HttpCode(HttpStatus.CREATED)
  @ApiCloneCatalog()
  clone(@Param('id') id: string): Promise<CreateResponseDto<CatalogResponseDto>> {
    this.logger.log(`POST /commerce-api/catalogs/${id}/clone`);
    return this.service.clone(id);
  }

  // Lists a catalog's channel assignments
  @Get(':id/channels')
  @ApiListCatalogChannels()
  listChannels(@Param('id') id: string): Promise<CatalogChannelResponseDto[]> {
    this.logger.log(`GET /commerce-api/catalogs/${id}/channels`);
    return this.service.listChannels(id);
  }

  // Assigns a (business unit, channel) pair to a catalog
  @Post(':id/channels')
  @HttpCode(HttpStatus.CREATED)
  @ApiAssignCatalogChannel()
  assignChannel(@Param('id') id: string, @Body() dto: AssignCatalogChannelDto): Promise<CatalogChannelResponseDto> {
    this.logger.log(`POST /commerce-api/catalogs/${id}/channels`);
    return this.service.assignChannel(id, dto);
  }

  // Removes a catalog-channel assignment
  @Delete(':id/channels/:assignmentId')
  @ApiUnassignCatalogChannel()
  unassignChannel(@Param('assignmentId') assignmentId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/catalogs/:id/channels/${assignmentId}`);
    return this.service.unassignChannel(assignmentId);
  }

  // Returns the offerings table for a catalog
  @Get(':id/offerings')
  @ApiGetCatalogOfferingsTable()
  getOfferingsTable(@Param('id') id: string, @UserId() userId: string): Promise<OfferingsTableResponseDto> {
    this.logger.log(`GET /commerce-api/catalogs/${id}/offerings`);
    return this.service.findOfferingsForTable(id, userId);
  }

  // Creates an offering under a catalog
  @Post(':id/offerings')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateCatalogOffering()
  createOffering(
    @Param('id') id: string,
    @Body() dto: CreateOfferingDto,
  ): Promise<CreateResponseDto<OfferingResponseDto>> {
    this.logger.log(`POST /commerce-api/catalogs/${id}/offerings`);
    return this.service.createOffering(id, dto);
  }

  // Returns an offering with full details
  @Get(':id/offerings/:offeringId')
  @ApiGetCatalogOffering()
  findOfferingById(@Param('offeringId') offeringId: string): Promise<OfferingDetailResponseDto> {
    this.logger.log(`GET /commerce-api/catalogs/:id/offerings/${offeringId}`);
    return this.service.findOfferingById(offeringId);
  }

  // Updates an offering by ID
  @Patch(':id/offerings/:offeringId')
  @ApiUpdateCatalogOffering()
  updateOffering(@Param('offeringId') offeringId: string, @Body() dto: UpdateOfferingDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/catalogs/:id/offerings/${offeringId}`);
    return this.service.updateOffering(offeringId, dto);
  }

  // Deletes an offering by ID
  @Delete(':id/offerings/:offeringId')
  @ApiDeleteCatalogOffering()
  deleteOffering(@Param('offeringId') offeringId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/catalogs/:id/offerings/${offeringId}`);
    return this.service.deleteOffering(offeringId);
  }

  // Creates a single variant for an offering
  @Post(':id/offerings/:offeringId/variants')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateCatalogOfferingVariant()
  createOfferingVariant(
    @Param('offeringId') offeringId: string,
    @Body() dto: CreateVariantDto,
  ): Promise<OfferingVariantResponseDto> {
    this.logger.log(`POST /commerce-api/catalogs/:id/offerings/${offeringId}/variants`);
    return this.service.createOfferingVariant(offeringId, dto);
  }

  // Lists variants for an offering
  @Get(':id/offerings/:offeringId/variants')
  @ApiListCatalogOfferingVariants()
  listOfferingVariants(@Param('offeringId') offeringId: string): Promise<OfferingVariantResponseDto[]> {
    this.logger.log(`GET /commerce-api/catalogs/:id/offerings/${offeringId}/variants`);
    return this.service.listOfferingVariants(offeringId);
  }

  // Updates a variant
  @Patch(':id/offerings/:offeringId/variants/:variantId')
  @ApiUpdateCatalogOfferingVariant()
  updateOfferingVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<OfferingVariantResponseDto> {
    this.logger.log(`PATCH /commerce-api/catalogs/:id/offerings/:offeringId/variants/${variantId}`);
    return this.service.updateOfferingVariant(variantId, dto);
  }

  // Deletes a variant
  @Delete(':id/offerings/:offeringId/variants/:variantId')
  @ApiDeleteCatalogOfferingVariant()
  deleteOfferingVariant(@Param('variantId') variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/catalogs/:id/offerings/:offeringId/variants/${variantId}`);
    return this.service.deleteOfferingVariant(variantId);
  }

  // Lists modifier groups assigned to an offering
  @Get(':id/offerings/:offeringId/modifiers')
  @ApiListCatalogOfferingModifiers()
  listOfferingModifiers(@Param('offeringId') offeringId: string): Promise<OfferingModifierGroupResponseDto[]> {
    this.logger.log(`GET /commerce-api/catalogs/:id/offerings/${offeringId}/modifiers`);
    return this.service.listOfferingModifiers(offeringId);
  }

  // Saves modifier group assignments for an offering
  @Put(':id/offerings/:offeringId/modifiers')
  @ApiSaveCatalogOfferingModifiers()
  saveOfferingModifiers(
    @Param('offeringId') offeringId: string,
    @Body() dto: SaveOfferingModifiersDto,
  ): Promise<OfferingModifierGroupResponseDto[]> {
    this.logger.log(`PUT /commerce-api/catalogs/:id/offerings/${offeringId}/modifiers`);
    return this.service.saveOfferingModifiers(offeringId, dto);
  }

  // Lists variant options for a catalog
  @Get(':id/variant-options')
  @ApiListCatalogVariantOptions()
  listVariantOptions(@Param('id') id: string): Promise<VariantOptionResponseDto[]> {
    this.logger.log(`GET /commerce-api/catalogs/${id}/variant-options`);
    return this.service.listVariantOptions(id);
  }

  // Returns variant option select options for a catalog
  @Get(':id/variant-options/select')
  selectVariantOptions(@Param('id') id: string, @Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`GET /commerce-api/catalogs/${id}/variant-options/select`);
    return this.service.selectVariantOptions(id, query);
  }

  // Creates a variant option under a catalog
  @Post(':id/variant-options')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateCatalogVariantOption()
  createVariantOption(@Param('id') id: string, @Body() dto: CreateVariantOptionDto): Promise<VariantOptionResponseDto> {
    this.logger.log(`POST /commerce-api/catalogs/${id}/variant-options`);
    return this.service.createVariantOption(id, dto);
  }

  // Updates a variant option
  @Patch(':id/variant-options/:optionId')
  @ApiUpdateCatalogVariantOption()
  updateVariantOption(
    @Param('optionId') optionId: string,
    @Body() dto: UpdateVariantOptionDto,
  ): Promise<VariantOptionResponseDto> {
    this.logger.log(`PATCH /commerce-api/catalogs/:id/variant-options/${optionId}`);
    return this.service.updateVariantOption(optionId, dto);
  }

  // Deletes a variant option
  @Delete(':id/variant-options/:optionId')
  @ApiDeleteCatalogVariantOption()
  deleteVariantOption(@Param('optionId') optionId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/catalogs/:id/variant-options/${optionId}`);
    return this.service.deleteVariantOption(optionId);
  }

  // Lists modifier groups for a catalog
  @Get(':id/modifiers')
  @ApiListCatalogModifierGroups()
  listModifierGroups(@Param('id') id: string): Promise<ModifierGroupResponseDto[]> {
    this.logger.log(`GET /commerce-api/catalogs/${id}/modifiers`);
    return this.service.listModifierGroups(id);
  }

  // Returns modifier group select options for a catalog
  @Get(':id/modifiers/select')
  selectModifierGroups(@Param('id') id: string, @Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`GET /commerce-api/catalogs/${id}/modifiers/select`);
    return this.service.selectModifierGroups(id, query);
  }

  // Creates a modifier group under a catalog
  @Post(':id/modifiers')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateCatalogModifierGroup()
  createModifierGroup(@Param('id') id: string, @Body() dto: CreateModifierGroupDto): Promise<ModifierGroupResponseDto> {
    this.logger.log(`POST /commerce-api/catalogs/${id}/modifiers`);
    return this.service.createModifierGroup(id, dto);
  }

  // Returns a modifier group with options
  @Get(':id/modifiers/:groupId')
  @ApiGetCatalogModifierGroup()
  getModifierGroup(@Param('groupId') groupId: string): Promise<ModifierGroupResponseDto> {
    this.logger.log(`GET /commerce-api/catalogs/:id/modifiers/${groupId}`);
    return this.service.getModifierGroup(groupId);
  }

  // Updates a modifier group
  @Patch(':id/modifiers/:groupId')
  @ApiUpdateCatalogModifierGroup()
  updateModifierGroup(
    @Param('groupId') groupId: string,
    @Body() dto: UpdateModifierGroupDto,
  ): Promise<ModifierGroupResponseDto> {
    this.logger.log(`PATCH /commerce-api/catalogs/:id/modifiers/${groupId}`);
    return this.service.updateModifierGroup(groupId, dto);
  }

  // Deletes a modifier group
  @Delete(':id/modifiers/:groupId')
  @ApiDeleteCatalogModifierGroup()
  deleteModifierGroup(@Param('groupId') groupId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/catalogs/:id/modifiers/${groupId}`);
    return this.service.deleteModifierGroup(groupId);
  }

  // Creates an option in a modifier group
  @Post(':id/modifiers/:groupId/options')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateCatalogModifierOption()
  createModifierOption(
    @Param('groupId') groupId: string,
    @Body() dto: CreateModifierOptionDto,
  ): Promise<ModifierOptionResponseDto> {
    this.logger.log(`POST /commerce-api/catalogs/:id/modifiers/${groupId}/options`);
    return this.service.createModifierOption(groupId, dto);
  }

  // Updates an option in a modifier group
  @Patch(':id/modifiers/:groupId/options/:optionId')
  @ApiUpdateCatalogModifierOption()
  updateModifierOption(
    @Param('optionId') optionId: string,
    @Body() dto: UpdateModifierOptionDto,
  ): Promise<ModifierOptionResponseDto> {
    this.logger.log(`PATCH /commerce-api/catalogs/:id/modifiers/:groupId/options/${optionId}`);
    return this.service.updateModifierOption(optionId, dto);
  }

  // Deletes an option from a modifier group
  @Delete(':id/modifiers/:groupId/options/:optionId')
  @ApiDeleteCatalogModifierOption()
  deleteModifierOption(@Param('optionId') optionId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/catalogs/:id/modifiers/:groupId/options/${optionId}`);
    return this.service.deleteModifierOption(optionId);
  }
}

import { CreateTaxClassDto } from '@commerce/tax-classes/dto/request/create-tax-class.dto';
import { SetTaxClassActiveDto } from '@commerce/tax-classes/dto/request/set-tax-class-active.dto';
import { UpdateTaxClassDto } from '@commerce/tax-classes/dto/request/update-tax-class.dto';
import type { TaxClassResponseDto } from '@commerce/tax-classes/dto/response/tax-class-response.dto';
import type { TaxClassTableResponseDto } from '@commerce/tax-classes/dto/response/tax-class-table-response.dto';
import { CreateTaxClassGroupOnClassDto } from '@commerce/tax-groups/dto/request/create-tax-class-group-on-class.dto';
import { UpdateTaxClassGroupOnClassDto } from '@commerce/tax-groups/dto/request/update-tax-class-group-on-class.dto';
import type { TaxClassGroupResponseDto } from '@commerce/tax-groups/dto/response/tax-class-group-response.dto';
import type { TaxClassGroupTableResponseDto } from '@commerce/tax-groups/dto/response/tax-class-group-table-response.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { ORG_TAX_CLASSES } from '@vritti/commerce-permissions/tax-classes';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import {
  ApiCreateTaxClassGroup,
  ApiDeleteTaxClassGroup,
  ApiFindForTableTaxClasses,
  ApiFindForTableTaxClassGroups,
  ApiUpdateTaxClassGroup,
} from './docs/tax-classes-gateway.docs';
import { TaxClassesGatewayService } from './services/tax-classes-gateway.service';

@ApiTags('Commerce - Tax Classes')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_TAX_CLASSES.featureCode)
@Controller('tax-classes')
export class TaxClassesGatewayController {
  private readonly logger = new Logger(TaxClassesGatewayController.name);

  constructor(private readonly service: TaxClassesGatewayService) {}

  // Returns paginated tax classes with the tax groups they map to in the saved table context's country and on its day
  @Get('table')
  @RequirePermission(ORG_TAX_CLASSES.view)
  @ApiFindForTableTaxClasses()
  getTable(@UserId() userId: string): Promise<TaxClassTableResponseDto> {
    this.logger.log('GET /commerce-api/tax-classes/table');
    return this.service.findForTable(userId);
  }

  // Creates a new tax class
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_TAX_CLASSES.add)
  create(@Body() dto: CreateTaxClassDto): Promise<CreateResponseDto<TaxClassResponseDto>> {
    this.logger.log('POST /commerce-api/tax-classes');
    return this.service.create(dto);
  }

  // Returns a tax class by ID
  @Get(':id')
  @RequirePermission(ORG_TAX_CLASSES.view)
  findById(@Param('id') id: string): Promise<TaxClassResponseDto> {
    this.logger.log(`GET /commerce-api/tax-classes/${id}`);
    return this.service.findById(id);
  }

  // Updates a tax class by ID
  @Patch(':id')
  @RequirePermission(ORG_TAX_CLASSES.edit)
  update(@Param('id') id: string, @Body() dto: UpdateTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/tax-classes/${id}`);
    return this.service.update(id, dto);
  }

  // Activates or deactivates a tax class
  @Patch(':id/active')
  @RequirePermission(ORG_TAX_CLASSES.toggle)
  setActive(@Param('id') id: string, @Body() dto: SetTaxClassActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/tax-classes/${id}/active`);
    return this.service.setActive(id, dto.isActive);
  }

  // Deletes a tax class by ID
  @Delete(':id')
  @RequirePermission(ORG_TAX_CLASSES.delete)
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/tax-classes/${id}`);
    return this.service.delete(id);
  }

  // Returns a class's paginated group mappings, narrowed to the country in the saved table context
  @Get(':taxClassId/groups/table')
  @RequirePermission(ORG_TAX_CLASSES.groups.view)
  @ApiFindForTableTaxClassGroups()
  findGroupsForTable(
    @UserId() userId: string,
    @Param('taxClassId', new ParseUUIDPipe()) taxClassId: string,
  ): Promise<TaxClassGroupTableResponseDto> {
    this.logger.log(`GET /commerce-api/tax-classes/${taxClassId}/groups/table`);
    return this.service.findGroupsForTable(userId, taxClassId);
  }

  // Maps a class to a tax group in the group's country
  @Post(':taxClassId/groups')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_TAX_CLASSES.groups.add)
  @ApiCreateTaxClassGroup()
  createGroup(
    @Param('taxClassId', new ParseUUIDPipe()) taxClassId: string,
    @Body() dto: CreateTaxClassGroupOnClassDto,
  ): Promise<CreateResponseDto<TaxClassGroupResponseDto>> {
    this.logger.log(`POST /commerce-api/tax-classes/${taxClassId}/groups`);
    return this.service.createGroup(taxClassId, dto);
  }

  // Updates a group mapping of a class
  @Patch(':taxClassId/groups/:mappingId')
  @RequirePermission(ORG_TAX_CLASSES.groups.edit)
  @ApiUpdateTaxClassGroup()
  updateGroup(
    @Param('taxClassId', new ParseUUIDPipe()) taxClassId: string,
    @Param('mappingId', new ParseUUIDPipe()) mappingId: string,
    @Body() dto: UpdateTaxClassGroupOnClassDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/tax-classes/${taxClassId}/groups/${mappingId}`);
    return this.service.updateGroup(taxClassId, mappingId, dto);
  }

  // Removes a group mapping of a class
  @Delete(':taxClassId/groups/:mappingId')
  @RequirePermission(ORG_TAX_CLASSES.groups.delete)
  @ApiDeleteTaxClassGroup()
  deleteGroup(
    @Param('taxClassId', new ParseUUIDPipe()) taxClassId: string,
    @Param('mappingId', new ParseUUIDPipe()) mappingId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/tax-classes/${taxClassId}/groups/${mappingId}`);
    return this.service.deleteGroup(taxClassId, mappingId);
  }
}

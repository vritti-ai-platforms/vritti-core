import { CreateTaxClassGroupDto } from '@commerce/tax-groups/dto/request/create-tax-class-group.dto';
import { CreateTaxGroupDto } from '@commerce/tax-groups/dto/request/create-tax-group.dto';
import { CreateTaxGroupRateDto } from '@commerce/tax-groups/dto/request/create-tax-group-rate.dto';
import { SetTaxGroupActiveDto } from '@commerce/tax-groups/dto/request/set-tax-group-active.dto';
import { TaxGroupRateTableQueryDto } from '@commerce/tax-groups/dto/request/tax-group-rate-table-query.dto';
import { UpdateTaxClassGroupDto } from '@commerce/tax-groups/dto/request/update-tax-class-group.dto';
import { UpdateTaxGroupDto } from '@commerce/tax-groups/dto/request/update-tax-group.dto';
import { UpdateTaxGroupRateDto } from '@commerce/tax-groups/dto/request/update-tax-group-rate.dto';
import type { TaxClassGroupResponseDto } from '@commerce/tax-groups/dto/response/tax-class-group-response.dto';
import type { TaxClassGroupTableResponseDto } from '@commerce/tax-groups/dto/response/tax-class-group-table-response.dto';
import type { TaxGroupRateResponseDto } from '@commerce/tax-groups/dto/response/tax-group-rate-response.dto';
import type { TaxGroupRateTableResponseDto } from '@commerce/tax-groups/dto/response/tax-group-rate-table-response.dto';
import type { TaxGroupResponseDto } from '@commerce/tax-groups/dto/response/tax-group-response.dto';
import type { TaxGroupTableResponseDto } from '@commerce/tax-groups/dto/response/tax-group-table-response.dto';
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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { ORG_TAX_GROUPS } from '@vritti/commerce-permissions/tax-groups';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import {
  ApiCreateTaxGroup,
  ApiCreateTaxGroupClass,
  ApiCreateTaxGroupRate,
  ApiDeleteTaxGroup,
  ApiDeleteTaxGroupClass,
  ApiDeleteTaxGroupRate,
  ApiFindForTableTaxGroupClasses,
  ApiFindForTableTaxGroupRates,
  ApiFindForTableTaxGroups,
  ApiGetTaxGroup,
  ApiSetTaxGroupActive,
  ApiUpdateTaxGroup,
  ApiUpdateTaxGroupClass,
  ApiUpdateTaxGroupRate,
} from './docs/tax-groups-gateway.docs';
import { TaxGroupsGatewayService } from './services/tax-groups-gateway.service';

@ApiTags('Commerce - Tax Groups')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_TAX_GROUPS.featureCode)
@Controller('tax-groups')
export class TaxGroupsGatewayController {
  private readonly logger = new Logger(TaxGroupsGatewayController.name);

  constructor(private readonly service: TaxGroupsGatewayService) {}

  // Returns paginated tax groups for the data table, narrowed to the country in the saved table context
  @Get('table')
  @RequirePermission(ORG_TAX_GROUPS.view)
  @ApiFindForTableTaxGroups()
  findForTable(@UserId() userId: string): Promise<TaxGroupTableResponseDto> {
    this.logger.log('GET /commerce-api/tax-groups/table');
    return this.service.findForTable(userId);
  }

  // Creates a tax group for one country
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_TAX_GROUPS.add)
  @ApiCreateTaxGroup()
  create(@Body() dto: CreateTaxGroupDto): Promise<CreateResponseDto<TaxGroupResponseDto>> {
    this.logger.log('POST /commerce-api/tax-groups');
    return this.service.create(dto);
  }

  // Returns a tax group by ID
  @Get(':id')
  @RequirePermission(ORG_TAX_GROUPS.view)
  @ApiGetTaxGroup()
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<TaxGroupResponseDto> {
    this.logger.log(`GET /commerce-api/tax-groups/${id}`);
    return this.service.findById(id);
  }

  // Updates a tax group by ID; its country is fixed
  @Patch(':id')
  @RequirePermission(ORG_TAX_GROUPS.edit)
  @ApiUpdateTaxGroup()
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateTaxGroupDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/tax-groups/${id}`);
    return this.service.update(id, dto);
  }

  // Activates or deactivates a tax group; it stays active while a class mapping in force or still to come names it
  @Patch(':id/active')
  @RequirePermission(ORG_TAX_GROUPS.toggle)
  @ApiSetTaxGroupActive()
  setActive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetTaxGroupActiveDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/tax-groups/${id}/active`);
    return this.service.setActive(id, dto.isActive);
  }

  // Deletes a tax group and its rates unless tax classes are mapped to it
  @Delete(':id')
  @RequirePermission(ORG_TAX_GROUPS.delete)
  @ApiDeleteTaxGroup()
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/tax-groups/${id}`);
    return this.service.delete(id);
  }

  // Returns a group's paginated rates for the data table, optionally only those charged in a state on a day
  @Get(':id/rates/table')
  @RequirePermission(ORG_TAX_GROUPS.rates.view)
  @ApiFindForTableTaxGroupRates()
  findRatesForTable(
    @UserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: TaxGroupRateTableQueryDto,
  ): Promise<TaxGroupRateTableResponseDto> {
    this.logger.log(
      `GET /commerce-api/tax-groups/${id}/rates/table?jurisdiction=${query.jurisdiction ?? ''}&asOf=${query.asOf ?? ''}`,
    );
    return this.service.findRatesForTable(userId, id, query);
  }

  // Adds a dated rate to a group
  @Post(':id/rates')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_TAX_GROUPS.rates.add)
  @ApiCreateTaxGroupRate()
  createRate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateTaxGroupRateDto,
  ): Promise<CreateResponseDto<TaxGroupRateResponseDto>> {
    this.logger.log(`POST /commerce-api/tax-groups/${id}/rates`);
    return this.service.createRate(id, dto);
  }

  // Updates a rate of a group
  @Patch(':id/rates/:rateId')
  @RequirePermission(ORG_TAX_GROUPS.rates.edit)
  @ApiUpdateTaxGroupRate()
  updateRate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('rateId', new ParseUUIDPipe()) rateId: string,
    @Body() dto: UpdateTaxGroupRateDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/tax-groups/${id}/rates/${rateId}`);
    return this.service.updateRate(id, rateId, dto);
  }

  // Removes a rate from a group
  @Delete(':id/rates/:rateId')
  @RequirePermission(ORG_TAX_GROUPS.rates.delete)
  @ApiDeleteTaxGroupRate()
  deleteRate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('rateId', new ParseUUIDPipe()) rateId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/tax-groups/${id}/rates/${rateId}`);
    return this.service.deleteRate(id, rateId);
  }

  // Returns a group's paginated class mappings for the data table
  @Get(':id/classes/table')
  @RequirePermission(ORG_TAX_GROUPS.classes.view)
  @ApiFindForTableTaxGroupClasses()
  findClassesForTable(
    @UserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TaxClassGroupTableResponseDto> {
    this.logger.log(`GET /commerce-api/tax-groups/${id}/classes/table`);
    return this.service.findClassesForTable(userId, id);
  }

  // Maps a tax class to a group in the group's country
  @Post(':id/classes')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_TAX_GROUPS.classes.add)
  @ApiCreateTaxGroupClass()
  createClass(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateTaxClassGroupDto,
  ): Promise<CreateResponseDto<TaxClassGroupResponseDto>> {
    this.logger.log(`POST /commerce-api/tax-groups/${id}/classes`);
    return this.service.createClass(id, dto);
  }

  // Updates a class mapping of a group
  @Patch(':id/classes/:mappingId')
  @RequirePermission(ORG_TAX_GROUPS.classes.edit)
  @ApiUpdateTaxGroupClass()
  updateClass(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('mappingId', new ParseUUIDPipe()) mappingId: string,
    @Body() dto: UpdateTaxClassGroupDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/tax-groups/${id}/classes/${mappingId}`);
    return this.service.updateClass(id, mappingId, dto);
  }

  // Removes a class mapping from a group
  @Delete(':id/classes/:mappingId')
  @RequirePermission(ORG_TAX_GROUPS.classes.delete)
  @ApiDeleteTaxGroupClass()
  deleteClass(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('mappingId', new ParseUUIDPipe()) mappingId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/tax-groups/${id}/classes/${mappingId}`);
    return this.service.deleteClass(id, mappingId);
  }
}

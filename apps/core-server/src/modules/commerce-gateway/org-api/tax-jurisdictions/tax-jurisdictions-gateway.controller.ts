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
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_TAX_JURISDICTIONS } from '@vritti/commerce-permissions/tax-jurisdictions';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { CreateTaxJurisdictionDto } from './dto/request/create-tax-jurisdiction.dto';
import { TaxJurisdictionTreeQueryDto } from './dto/request/tax-jurisdiction-tree-query.dto';
import { UpdateTaxJurisdictionDto } from './dto/request/update-tax-jurisdiction.dto';
import type { TaxJurisdictionChildrenTableResponseDto } from './dto/response/tax-jurisdiction-children-table-response.dto';
import type { TaxJurisdictionCountResponseDto } from './dto/response/tax-jurisdiction-count-response.dto';
import type { TaxJurisdictionResponseDto } from './dto/response/tax-jurisdiction-response.dto';
import type { TaxJurisdictionTreeResponseDto } from './dto/response/tax-jurisdiction-tree-response.dto';
import { TaxJurisdictionsGatewayService } from './services/tax-jurisdictions-gateway.service';

@ApiTags('Commerce - Tax Jurisdictions')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(ORG_TAX_JURISDICTIONS.featureCode)
@Controller('tax-jurisdictions')
export class TaxJurisdictionsGatewayController {
  private readonly logger = new Logger(TaxJurisdictionsGatewayController.name);

  constructor(private readonly service: TaxJurisdictionsGatewayService) {}

  // Returns total tax jurisdiction count
  @Get('count')
  @RequirePermission(ORG_TAX_JURISDICTIONS.view)
  count(): Promise<TaxJurisdictionCountResponseDto> {
    this.logger.log('GET /commerce-api/tax-jurisdictions/count');
    return this.service.count();
  }

  // Returns tax jurisdictions as a tree hierarchy for TreeView
  @Get('tree')
  @RequirePermission(ORG_TAX_JURISDICTIONS.view)
  findTree(@Query() query: TaxJurisdictionTreeQueryDto): Promise<TaxJurisdictionTreeResponseDto[]> {
    this.logger.log('GET /commerce-api/tax-jurisdictions/tree');
    return this.service.findTree(query.search);
  }

  // Returns paginated child jurisdictions for a given parent jurisdiction
  @Get(':parentId/children/table')
  @RequirePermission(ORG_TAX_JURISDICTIONS.view)
  childrenTable(
    @Param('parentId', new ParseUUIDPipe()) parentId: string,
    @UserId() userId: string,
  ): Promise<TaxJurisdictionChildrenTableResponseDto> {
    this.logger.log(`GET /commerce-api/tax-jurisdictions/${parentId}/children/table`);
    return this.service.findChildrenForTable(userId, parentId);
  }

  // Creates a new tax jurisdiction
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTaxJurisdictionDto): Promise<CreateResponseDto<TaxJurisdictionResponseDto>> {
    this.logger.log('POST /commerce-api/tax-jurisdictions');
    return this.service.create(dto);
  }

  // Returns a tax jurisdiction by ID
  @Get(':id')
  @RequirePermission(ORG_TAX_JURISDICTIONS.view)
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<TaxJurisdictionResponseDto> {
    this.logger.log(`GET /commerce-api/tax-jurisdictions/${id}`);
    return this.service.findById(id);
  }

  // Updates a tax jurisdiction by ID
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTaxJurisdictionDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/tax-jurisdictions/${id}`);
    return this.service.update(id, dto);
  }

  // Deletes a tax jurisdiction by ID
  @Delete(':id')
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/tax-jurisdictions/${id}`);
    return this.service.delete(id);
  }
}

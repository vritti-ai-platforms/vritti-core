import { CreateCostCategoryDto } from '@commerce/cost-categories/dto/request/create-cost-category.dto';
import { UpdateCostCategoryDto } from '@commerce/cost-categories/dto/request/update-cost-category.dto';
import type { CostCategoryResponseDto } from '@commerce/cost-categories/dto/response/cost-category-response.dto';
import type { CostCategoryTableResponseDto } from '@commerce/cost-categories/dto/response/cost-category-table-response.dto';
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
import { ORG_COST_CATEGORIES } from '@vritti/commerce-permissions/cost-categories';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import {
  ApiActivateCostCategory,
  ApiCreateCostCategory,
  ApiDeactivateCostCategory,
  ApiDeleteCostCategory,
  ApiFindCostCategoryById,
  ApiFindForTableCostCategories,
  ApiUpdateCostCategory,
} from './docs/cost-categories-gateway.docs';
import { CostCategoriesGatewayService } from './services/cost-categories-gateway.service';

@ApiTags('Commerce - Cost Categories')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_COST_CATEGORIES.featureCode)
@Controller('org/cost-categories')
export class CostCategoriesGatewayController {
  private readonly logger = new Logger(CostCategoriesGatewayController.name);

  constructor(private readonly service: CostCategoriesGatewayService) {}

  // Creates a new cost category
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_COST_CATEGORIES.add)
  @ApiCreateCostCategory()
  create(@Body() dto: CreateCostCategoryDto): Promise<CreateResponseDto<CostCategoryResponseDto>> {
    this.logger.log('POST /commerce-api/org/cost-categories');
    return this.service.create(dto);
  }

  // Updates a cost category by ID
  @Patch(':id')
  @RequirePermission(ORG_COST_CATEGORIES.edit)
  @ApiUpdateCostCategory()
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCostCategoryDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/cost-categories/${id}`);
    return this.service.update(id, dto);
  }

  // Deactivates a cost category by ID
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_COST_CATEGORIES.edit)
  @ApiDeactivateCostCategory()
  deactivate(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/org/cost-categories/${id}/deactivate`);
    return this.service.deactivate(id);
  }

  // Activates a cost category by ID
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_COST_CATEGORIES.edit)
  @ApiActivateCostCategory()
  activate(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/org/cost-categories/${id}/activate`);
    return this.service.activate(id);
  }

  // Returns a cost category by ID
  @Get(':id')
  @RequirePermission(ORG_COST_CATEGORIES.view)
  @ApiFindCostCategoryById()
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<CostCategoryResponseDto> {
    this.logger.log(`GET /commerce-api/org/cost-categories/${id}`);
    return this.service.findById(id);
  }

  // Returns paginated cost categories for the data table
  @Get('table')
  @RequirePermission(ORG_COST_CATEGORIES.view)
  @ApiFindForTableCostCategories()
  getTable(@UserId() userId: string): Promise<CostCategoryTableResponseDto> {
    this.logger.log('GET /commerce-api/org/cost-categories/table');
    return this.service.findForTable(userId);
  }

  // Deletes a cost category by ID
  @Delete(':id')
  @RequirePermission(ORG_COST_CATEGORIES.delete)
  @ApiDeleteCostCategory()
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/org/cost-categories/${id}`);
    return this.service.delete(id);
  }
}

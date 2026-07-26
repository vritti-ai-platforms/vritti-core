import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { SessionTypeValues } from '@/db/schema';
import { CreateCostCategoryDto } from '@commerce/cost-categories/dto/request/create-cost-category.dto';
import { UpdateCostCategoryDto } from '@commerce/cost-categories/dto/request/update-cost-category.dto';
import type { CostCategoryResponseDto } from '@commerce/cost-categories/dto/response/cost-category-response.dto';
import type { CostCategoryTableResponseDto } from '@commerce/cost-categories/dto/response/cost-category-table-response.dto';
import { CostCategoriesGatewayService } from './services/cost-categories-gateway.service';

@ApiTags('Commerce - Cost Categories')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('cost-categories')
export class CostCategoriesGatewayController {
  private readonly logger = new Logger(CostCategoriesGatewayController.name);

  constructor(private readonly service: CostCategoriesGatewayService) {}

  @Get('table')
  getTable(@UserId() userId: string): Promise<CostCategoryTableResponseDto> {
    this.logger.log('GET /commerce-api/cost-categories/table');
    return this.service.findForTable(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCostCategoryDto): Promise<CreateResponseDto<CostCategoryResponseDto>> {
    this.logger.log('POST /commerce-api/cost-categories');
    return this.service.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<CostCategoryResponseDto> {
    this.logger.log(`GET /commerce-api/cost-categories/${id}`);
    return this.service.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCostCategoryDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/cost-categories/${id}`);
    return this.service.update(id, dto);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/cost-categories/${id}/deactivate`);
    return this.service.deactivate(id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  activate(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/cost-categories/${id}/activate`);
    return this.service.activate(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/cost-categories/${id}`);
    return this.service.delete(id);
  }
}

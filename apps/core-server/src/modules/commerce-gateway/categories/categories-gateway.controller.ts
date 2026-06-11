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
import {
  type CreateResponseDto,
  RequireSession,
  SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  UserId,
} from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import {
  ApiCreateCategory,
  ApiDeleteCategory,
  ApiGetCategoriesSelect,
  ApiGetCategory,
  ApiGetCategoryItemsTable,
  ApiUpdateCategory,
} from './docs/categories-gateway.docs';
import { CreateCategoryDto } from './dto/request/create-category.dto';
import { ReorderCategoriesDto } from './dto/request/reorder-categories.dto';
import { UpdateCategoryDto } from './dto/request/update-category.dto';
import type { CategoryChildrenTableResponseDto } from './dto/response/category-children-table-response.dto';
import type { CategoryCountResponseDto } from './dto/response/category-count-response.dto';
import type { CategoryItemTableResponseDto } from './dto/response/category-item-table-response.dto';
import type { CategoryResponseDto } from './dto/response/category-response.dto';
import type { CategoryTreeResponseDto } from './dto/response/category-tree-response.dto';
import { CategoriesGatewayService } from './services/categories-gateway.service';

@ApiTags('Commerce - Categories')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('categories')
export class CategoriesGatewayController {
  private readonly logger = new Logger(CategoriesGatewayController.name);

  constructor(private readonly categoriesGatewayService: CategoriesGatewayService) {}

  // Returns total category count
  @Get('count')
  async count(): Promise<CategoryCountResponseDto> {
    this.logger.log('GET /commerce-api/categories/count');
    return this.categoriesGatewayService.count();
  }

  // Returns categories as a tree hierarchy for TreeView
  @Get('tree')
  async findTree(@Query('search') search?: string): Promise<CategoryTreeResponseDto[]> {
    this.logger.log('GET /commerce-api/categories/tree');
    return this.categoriesGatewayService.findTree(search);
  }

  // Returns paginated child categories for a given parent category
  @Get(':parentId/children/table')
  childrenTable(
    @Param('parentId', new ParseUUIDPipe()) parentId: string,
    @UserId() userId: string,
  ): Promise<CategoryChildrenTableResponseDto> {
    this.logger.log(`GET /commerce-api/categories/${parentId}/children/table`);
    return this.categoriesGatewayService.findChildrenForTable(userId, parentId);
  }

  // Returns paginated inventory items for a leaf category
  @Get(':id/items/table')
  @ApiGetCategoryItemsTable()
  itemsTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<CategoryItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/categories/${id}/items/table`);
    return this.categoriesGatewayService.findItemsForTable(userId, id);
  }

  // Returns paginated category options for the select component
  @Get('select')
  @ApiGetCategoriesSelect()
  async select(@Query() query: SelectOptionsQueryDto & { buId: string }): Promise<SelectQueryResult> {
    return this.categoriesGatewayService.select(query);
  }

  // Reorders siblings under a parent category
  @Post('reorder')
  reorder(@Body() dto: ReorderCategoriesDto): Promise<SuccessResponseDto> {
    this.logger.log('POST /commerce-api/categories/reorder');
    return this.categoriesGatewayService.reorder(dto);
  }

  // Creates a new category
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateCategory()
  async create(@Body() dto: CreateCategoryDto): Promise<CreateResponseDto<CategoryResponseDto>> {
    return this.categoriesGatewayService.create(dto);
  }

  // Returns a single category by ID
  @Get(':id')
  @ApiGetCategory()
  async findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<CategoryResponseDto> {
    return this.categoriesGatewayService.findById(id);
  }

  // Updates a category by ID
  @Patch(':id')
  @ApiUpdateCategory()
  async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoriesGatewayService.update(id, dto);
  }

  // Deletes a category by ID
  @Delete(':id')
  @ApiDeleteCategory()
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    return this.categoriesGatewayService.delete(id);
  }
}

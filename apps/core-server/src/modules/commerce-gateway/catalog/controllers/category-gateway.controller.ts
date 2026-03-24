import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { UserId } from '@vritti/api-sdk';
import { UserService } from '@domain/user/services/user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type Observable, firstValueFrom } from 'rxjs';
import { CreateCategoryDto } from '../dto/request/create-category.dto';
import { UpdateCategoryDto } from '../dto/request/update-category.dto';
import { CategoryGatewayService } from '../services/category-gateway.service';

@ApiTags('Commerce — Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoryGatewayController {
  private readonly logger = new Logger(CategoryGatewayController.name);

  constructor(private readonly categoryGatewayService: CategoryGatewayService,
    private readonly userService: UserService,
  ) {}

  // Lists all categories for an org+bu
  @Get()
  async findAll(
    @UserId() userId: string,
    @Query('businessUnitId') businessUnitId: string,
  ): Promise<unknown> {
    this.logger.log('GET /commerce-api/categories');
    const user = await this.userService.findByIdOrThrow(userId);
    return firstValueFrom(this.categoryGatewayService.findAll(user.organizationId, businessUnitId));
  }

  // Returns a single category by ID
  @Get(':id')
  findById(@Param('id') id: string): Observable<unknown> {
    this.logger.log(`GET /commerce-api/categories/${id}`);
    return this.categoryGatewayService.findById(id);
  }

  // Creates a new category
  @Post()
  async create(@UserId() userId: string, @Body() dto: CreateCategoryDto): Promise<unknown> {
    this.logger.log('POST /commerce-api/categories');
    const user = await this.userService.findByIdOrThrow(userId);
    return firstValueFrom(this.categoryGatewayService.create({ ...dto, organizationId: user.organizationId }));
  }

  // Updates an existing category
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Observable<unknown> {
    this.logger.log(`PATCH /commerce-api/categories/${id}`);
    return this.categoryGatewayService.update(id, dto);
  }

  // Deletes a category
  @Delete(':id')
  delete(@Param('id') id: string): Observable<unknown> {
    this.logger.log(`DELETE /commerce-api/categories/${id}`);
    return this.categoryGatewayService.delete(id);
  }
}

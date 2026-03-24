import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { UserId } from '@vritti/api-sdk';
import { UserService } from '@domain/user/services/user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type Observable, firstValueFrom } from 'rxjs';
import { CreateProductDto } from '../dto/request/create-product.dto';
import { UpdateProductDto } from '../dto/request/update-product.dto';
import { ProductGatewayService } from '../services/product-gateway.service';

@ApiTags('Commerce — Products')
@ApiBearerAuth()
@Controller('products')
export class ProductGatewayController {
  private readonly logger = new Logger(ProductGatewayController.name);

  constructor(private readonly productGatewayService: ProductGatewayService,
    private readonly userService: UserService,
  ) {}

  // Lists all products for an org+bu
  @Get()
  async findAll(
    @UserId() userId: string,
    @Query('businessUnitId') businessUnitId: string,
  ): Promise<unknown> {
    this.logger.log('GET /commerce-api/products');
    const user = await this.userService.findByIdOrThrow(userId);
    return firstValueFrom(this.productGatewayService.findAll(user.organizationId, businessUnitId));
  }

  // Returns a single product by ID
  @Get(':id')
  findById(@Param('id') id: string): Observable<unknown> {
    this.logger.log(`GET /commerce-api/products/${id}`);
    return this.productGatewayService.findById(id);
  }

  // Creates a new product
  @Post()
  async create(@UserId() userId: string, @Body() dto: CreateProductDto): Promise<unknown> {
    this.logger.log('POST /commerce-api/products');
    const user = await this.userService.findByIdOrThrow(userId);
    return firstValueFrom(this.productGatewayService.create({ ...dto, organizationId: user.organizationId }));
  }

  // Updates an existing product
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto): Observable<unknown> {
    this.logger.log(`PATCH /commerce-api/products/${id}`);
    return this.productGatewayService.update(id, dto);
  }

  // Deletes a product
  @Delete(':id')
  delete(@Param('id') id: string): Observable<unknown> {
    this.logger.log(`DELETE /commerce-api/products/${id}`);
    return this.productGatewayService.delete(id);
  }
}

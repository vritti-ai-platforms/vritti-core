import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';
import { UserService } from '@domain/user/services/user.service';
import { COMMERCE_SERVICE } from '../../commerce-client.module';
import type { CategoryResponseDto } from '../dto/category-response.dto';
import type { CreateCategoryDto } from '../dto/create-category.dto';
import type { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class CategoriesGatewayService {
  private readonly logger = new Logger(CategoriesGatewayService.name);

  constructor(
    @Inject(COMMERCE_SERVICE) private readonly client: ClientProxy,
    private readonly userService: UserService,
  ) {}

  // Returns paginated category options for the select component
  async select(userId: string, query: SelectOptionsQueryDto & { buId: string }): Promise<SelectQueryResult> {
    const user = await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<SelectQueryResult>(
        { cmd: 'categories.select' },
        { organizationId: user.organizationId, businessUnitId: query.buId, ...query },
      )
      .toPromise() as Promise<SelectQueryResult>;
  }

  // Returns all categories for the user's org + given BU
  async list(userId: string, buId: string): Promise<CategoryResponseDto[]> {
    const user = await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<CategoryResponseDto[]>({ cmd: 'categories.list' }, { organizationId: user.organizationId, businessUnitId: buId })
      .toPromise() as Promise<CategoryResponseDto[]>;
  }

  // Creates a new category, resolving organizationId from the authenticated user
  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const user = await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<CategoryResponseDto>({ cmd: 'categories.create' }, { organizationId: user.organizationId, ...dto })
      .toPromise() as Promise<CategoryResponseDto>;
  }

  // Finds a category by ID
  async findById(id: string): Promise<CategoryResponseDto> {
    return this.client
      .send<CategoryResponseDto>({ cmd: 'categories.findById' }, { id })
      .toPromise() as Promise<CategoryResponseDto>;
  }

  // Updates a category by ID, resolving organizationId from the authenticated user
  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<CategoryResponseDto>({ cmd: 'categories.update' }, { id, ...dto })
      .toPromise() as Promise<CategoryResponseDto>;
  }

  // Deletes a category by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return this.client
      .send<{ success: boolean; message: string }>({ cmd: 'categories.delete' }, { id })
      .toPromise() as Promise<{ success: boolean; message: string }>;
  }
}

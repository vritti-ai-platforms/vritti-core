import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_COST_CATEGORIES } from '@vritti/commerce-permissions/cost-categories';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { MutationResult } from '../../site-api/inventory-items/graphql/mutation-result.type';
import { CostCategory } from './graphql/cost-category.type';
import { CreateCostCategoryInput, UpdateCostCategoryInput } from './graphql/cost-category-mutation.input';
import { CostCategoriesGatewayService } from './services/cost-categories-gateway.service';

@Resolver()
@RequireFeature(ORG_COST_CATEGORIES.featureCode)
export class CostCategoriesResolver {
  private readonly logger = new Logger(CostCategoriesResolver.name);

  constructor(private readonly costCategoriesGatewayService: CostCategoriesGatewayService) {}

  // All cost categories (with canDelete) for the mobile list
  @Require(AuthType.Session, SessionTypeValues.MOBILE)
  @RequirePermission(ORG_COST_CATEGORIES.view)
  @Query(() => [CostCategory], { name: 'costCategories' })
  async costCategories(
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<CostCategory[]> {
    this.logger.log('QUERY costCategories');
    return this.costCategoriesGatewayService.list(search);
  }

  // Returns the created entity so the client inserts it into the cached list
  @Require(AuthType.Session, SessionTypeValues.MOBILE)
  @RequirePermission(ORG_COST_CATEGORIES.add)
  @Mutation(() => CostCategory, { name: 'createCostCategory' })
  async createCostCategory(@Args('input') input: CreateCostCategoryInput): Promise<CostCategory> {
    this.logger.log('MUTATION createCostCategory');
    const result = await this.costCategoriesGatewayService.create(input);
    return result.data;
  }

  // Re-reads and returns the entity so Apollo merges it by id
  @Require(AuthType.Session, SessionTypeValues.MOBILE)
  @RequirePermission(ORG_COST_CATEGORIES.edit)
  @Mutation(() => CostCategory, { name: 'updateCostCategory' })
  async updateCostCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCostCategoryInput,
  ): Promise<CostCategory> {
    this.logger.log('MUTATION updateCostCategory');
    await this.costCategoriesGatewayService.update(id, input);
    return this.costCategoriesGatewayService.findById(id);
  }

  // Deletes a cost category; the client evicts it from the cache by id
  @Require(AuthType.Session, SessionTypeValues.MOBILE)
  @RequirePermission(ORG_COST_CATEGORIES.delete)
  @Mutation(() => MutationResult, { name: 'deleteCostCategory' })
  async deleteCostCategory(@Args('id', { type: () => ID }) id: string): Promise<MutationResult> {
    this.logger.log('MUTATION deleteCostCategory');
    return this.costCategoriesGatewayService.delete(id);
  }
}

import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { MutationResult } from '../../site-api/inventory-items/graphql/mutation-result.type';
import { CostCategory } from './graphql/cost-category.type';
import { CreateCostCategoryInput, UpdateCostCategoryInput } from './graphql/cost-category-mutation.input';
import { CostCategoriesGatewayService } from './services/cost-categories-gateway.service';

// Cost categories for the mobile Cost Categories screen: plain list + CRUD. Thin forwards to the gateway
// service. Select-options (`costCategoriesOptions`) now live in the shared SelectApiModule. Activate/deactivate
// is folded into updateCostCategory(isActive).
@Resolver()
export class CostCategoriesResolver {
  private readonly logger = new Logger(CostCategoriesResolver.name);

  constructor(private readonly costCategoriesGatewayService: CostCategoriesGatewayService) {}

  // All cost categories (with canDelete) — the mobile list. Small/bounded, so a plain array.
  @RequireSession(SessionTypeValues.MOBILE)
  @Query(() => [CostCategory], { name: 'costCategories' })
  async costCategories(
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<CostCategory[]> {
    this.logger.log('QUERY costCategories');
    return this.costCategoriesGatewayService.list(search);
  }

  // Returns the created entity so the client inserts it into the cached list (no refetch).
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => CostCategory, { name: 'createCostCategory' })
  async createCostCategory(@Args('input') input: CreateCostCategoryInput): Promise<CostCategory> {
    this.logger.log('MUTATION createCostCategory');
    const result = await this.costCategoriesGatewayService.create(input);
    return result.data;
  }

  // Re-reads + returns the entity so Apollo auto-merges by id (the gateway update returns only success).
  // The overflow menu's activate/deactivate flows through here as `{ isActive }`.
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => CostCategory, { name: 'updateCostCategory' })
  async updateCostCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCostCategoryInput,
  ): Promise<CostCategory> {
    this.logger.log('MUTATION updateCostCategory');
    await this.costCategoriesGatewayService.update(id, input);
    return this.costCategoriesGatewayService.findById(id);
  }

  // Deletes a cost category; the client evicts it from the cache by the id it already holds.
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => MutationResult, { name: 'deleteCostCategory' })
  async deleteCostCategory(@Args('id', { type: () => ID }) id: string): Promise<MutationResult> {
    this.logger.log('MUTATION deleteCostCategory');
    return this.costCategoriesGatewayService.delete(id);
  }
}

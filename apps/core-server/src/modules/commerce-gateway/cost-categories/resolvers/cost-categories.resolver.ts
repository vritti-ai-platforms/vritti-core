import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequireSession, type SelectOptionsQueryDto } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import { MutationResult } from '../../inventory-items/graphql/mutation-result.type';
import { CostCategory } from '../graphql/cost-category.type';
import { CreateCostCategoryInput, UpdateCostCategoryInput } from '../graphql/cost-category-mutation.input';
import { CostCategoriesGatewayService } from '../services/cost-categories-gateway.service';

// Cost categories for the mobile Cost Categories screen. Thin GraphQL forwards to the existing gateway
// service (which NATS-forwards to commerce-service). The list is small/bounded (org-scoped taxonomy), so
// it's a plain array (no Relay connection). Activate/deactivate is folded into updateCostCategory(isActive).
@Resolver()
export class CostCategoriesResolver {
  private readonly logger = new Logger(CostCategoriesResolver.name);

  constructor(private readonly costCategoriesGatewayService: CostCategoriesGatewayService) {}

  // Options query for the Cost Category Select dropdown (thin forward to gateway `.select()`).
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'costCategoriesOptions' })
  async costCategoriesOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY costCategoriesOptions');
    return this.costCategoriesGatewayService.select((input ?? {}) as SelectOptionsQueryDto);
  }

  // All cost categories (with canDelete) — the mobile list. Small/bounded, so a plain array.
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Query(() => [CostCategory], { name: 'costCategories' })
  async costCategories(
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<CostCategory[]> {
    this.logger.log('QUERY costCategories');
    return this.costCategoriesGatewayService.list(search);
  }

  // Returns the created entity so the client inserts it into the cached list (no refetch).
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Mutation(() => CostCategory, { name: 'createCostCategory' })
  async createCostCategory(@Args('input') input: CreateCostCategoryInput): Promise<CostCategory> {
    this.logger.log('MUTATION createCostCategory');
    const result = await this.costCategoriesGatewayService.create(input);
    return result.data;
  }

  // Re-reads + returns the entity so Apollo auto-merges by id (the gateway update returns only success).
  // The overflow menu's activate/deactivate flows through here as `{ isActive }`.
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
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
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Mutation(() => MutationResult, { name: 'deleteCostCategory' })
  async deleteCostCategory(@Args('id', { type: () => ID }) id: string): Promise<MutationResult> {
    this.logger.log('MUTATION deleteCostCategory');
    return this.costCategoriesGatewayService.delete(id);
  }
}

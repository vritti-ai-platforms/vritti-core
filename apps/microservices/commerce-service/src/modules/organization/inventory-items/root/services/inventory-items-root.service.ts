import { CategoriesDomainService } from '@domain/categories/services/categories.service';
import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import type { UpdateInventoryItemDto } from '@domain/inventory-items/dto/request/update-inventory-item.dto';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { OfferingBomDomainService } from '@domain/offering-bom/services/offering-bom.service';
import { OfferingVariantsDomainService } from '@domain/offering-variants/services/offering-variants.service';
import { OfferingsDomainService } from '@domain/offerings/services/offerings.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { FulfilmentTypeValues } from '@/db/schema';
import type { CreateOrgInventoryItemDto } from '../dto/request/create-org-inventory-item.dto';

const OFFERING_CODE_MAX_LENGTH = 50;

// Top-level service for inventory item create/update paths that span domains: the assigned category must be a leaf, and
// a create can also put the item up for sale as a stock offering.
@Injectable()
export class OrgInventoryItemsService {
  private readonly logger = new Logger(OrgInventoryItemsService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly categoriesService: CategoriesDomainService,
    private readonly offeringsService: OfferingsDomainService,
    private readonly variantsService: OfferingVariantsDomainService,
    private readonly bomService: OfferingBomDomainService,
  ) {}

  async create(dto: CreateOrgInventoryItemDto): Promise<CreateResponseDto<InventoryItemDto>> {
    const { createOffering, ...itemData } = dto;
    this.logger.log(`create — name=${dto.name}, sku=${dto.sku}, createOffering=${createOffering}`);
    await this.categoriesService.assertIsLeaf(itemData.categoryId);
    if (!createOffering) return this.inventoryItemsService.create(itemData);

    if (itemData.sku.length > OFFERING_CODE_MAX_LENGTH) {
      throw new BadRequestException({
        label: 'SKU Too Long For An Offering',
        detail: `The offering takes the item's SKU as its code, which allows ${OFFERING_CODE_MAX_LENGTH} characters.`,
        errors: [{ field: 'sku', message: `At most ${OFFERING_CODE_MAX_LENGTH} characters to create an offering` }],
      });
    }

    // One transaction: the item, its stock offering, that offering's single variant and the variant's one BOM line
    // either all exist or none do.
    return this.database.runInTransaction(async () => {
      const created = await this.inventoryItemsService.create(itemData);
      const item = created.data;

      const offering = await this.offeringsService.create({
        code: item.sku,
        name: item.name,
        description: item.description,
        categoryId: item.categoryId,
        fulfilmentType: FulfilmentTypeValues.STOCK,
        taxClassId: item.taxClassId,
      });
      const variant = await this.variantsService.createStandalone(offering.data.id, item.uomId);
      await this.bomService.replace({
        variantId: variant.id,
        lines: [{ inventoryItemId: item.id, quantity: 1, uomId: item.uomId }],
      });

      return {
        ...created,
        message: `Inventory item "${item.name}" (${item.sku}) created, with stock offering "${offering.data.name}".`,
      };
    });
  }

  async update(id: string, dto: Omit<UpdateInventoryItemDto, 'id'>): Promise<SuccessResponseDto> {
    this.logger.log(`update — id=${id}${dto.categoryId ? `, categoryId=${dto.categoryId}` : ''}`);
    if (dto.categoryId !== undefined) {
      await this.categoriesService.assertIsLeaf(dto.categoryId);
    }
    return this.inventoryItemsService.update(id, dto);
  }
}

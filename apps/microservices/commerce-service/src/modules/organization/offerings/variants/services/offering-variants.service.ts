import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import type { OfferingVariantDto } from '@domain/offering-variants/dto/entity/offering-variant.dto';
import { OfferingVariantsDomainService } from '@domain/offering-variants/services/offering-variants.service';
import { OfferingsDomainService } from '@domain/offerings/services/offerings.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto } from '@vritti/api-sdk/database';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import { FulfilmentTypeValues } from '@/db/schema';
import type { CreateVariantInventoryItemDto } from '../dto/request/create-variant-inventory-item.dto';

// Orchestrates across two domains, which is why it lives in the API layer: a domain module never
// imports another. Offerings reaches DOWN into inventory-items here, and inventory-items knows
// nothing of offerings.
@Injectable()
export class OrgOfferingVariantsService {
  private readonly logger = new Logger(OrgOfferingVariantsService.name);

  constructor(
    private readonly variants: OfferingVariantsDomainService,
    private readonly offerings: OfferingsDomainService,
    private readonly inventoryItems: InventoryItemsDomainService,
  ) {}

  // Creates the inventory item a STOCK variant resolves to, taking its SKU from the variant, and links it
  // as that variant's single bill-of-materials line.
  async createInventoryItem(data: CreateVariantInventoryItemDto): Promise<CreateResponseDto<OfferingVariantDto>> {
    const variant = await this.variants.findById(data.variantId);

    if (variant.inventoryItem) {
      throw new ConflictException({
        label: 'Item Already Exists',
        detail: `An inventory item already carries the SKU "${variant.sku}". Add it to the bill of materials instead.`,
      });
    }

    const offering = await this.offerings.findById(variant.offeringId);
    if (offering.fulfilmentType !== FulfilmentTypeValues.STOCK) {
      throw new ConflictException({
        label: 'Not A Stock Variant',
        detail: `"${offering.name}" is ${offering.fulfilmentType.toLowerCase()}, so its variants resolve to components rather than to one stocked item. Add those components to the bill of materials instead.`,
      });
    }

    const created = await this.inventoryItems.create({
      name: data.name,
      sku: variant.sku,
      type: data.type,
      tracking: data.tracking,
      pickStrategy: data.pickStrategy,
      categoryId: data.categoryId,
      uomId: data.uomId,
      description: data.description ?? null,
      hsnCode: data.hsnCode ?? null,
    });

    await this.variants.upsertBom({
      variantId: variant.id,
      lines: [{ inventoryItemId: created.data.id, quantity: 1, uomId: data.uomId }],
    });

    this.logger.log(`Created inventory item ${variant.sku} for variant ${variant.id}`);
    return {
      success: true,
      message: `"${variant.sku}" created and linked as this variant's component.`,
      data: await this.variants.findById(variant.id),
    };
  }
}

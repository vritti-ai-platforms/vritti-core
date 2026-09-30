import { Injectable } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { BOM_RULES } from '@/db/schema';
import type { OfferingBomLineDto } from '../dto/entity/offering-bom-line.dto';
import { VariantBomDto } from '../dto/entity/variant-bom.dto';
import type { AddBomLineDto, UpdateBomLineDto } from '../dto/request/bom-line.dto';
import type { UpsertBomDto } from '../dto/request/upsert-bom.dto';
import { type BomVariantRef, OfferingBomDomainRepository } from '../repositories/offering-bom.repository';

@Injectable()
export class OfferingBomDomainService {
  constructor(private readonly repository: OfferingBomDomainRepository) {}

  // A variant's components plus the inventory item already carrying its SKU. Both only matter to the
  // bill-of-materials view, so neither rides on the variant read.
  async findByVariant(variantId: string): Promise<VariantBomDto> {
    const variant = await this.requireReachableVariant(variantId);
    const [lines, suggestion] = await Promise.all([
      this.repository.findLines([variantId]) as Promise<OfferingBomLineDto[]>,
      this.repository.findInventoryItemBySku(variant.sku),
    ]);
    return VariantBomDto.from(lines, suggestion ?? null);
  }

  // Whether an inventory item already carries this SKU. The create-item path asks before minting one,
  // because the SKU is the only thing linking a variant to its stocked counterpart.
  async findItemBySku(sku: string): Promise<{ id: string; name: string } | null> {
    const item = await this.repository.findInventoryItemBySku(sku);
    return item ? { id: item.id, name: item.name } : null;
  }

  // Adds one component, refusing once the variant's fulfilment type is already satisfied
  async addLine(data: AddBomLineDto): Promise<SuccessResponseDto> {
    const variant = await this.requireOwnedVariant(data.variantId);
    const rule = BOM_RULES[variant.fulfilmentType];

    if ((await this.repository.countLines(data.variantId)) >= rule.max) {
      throw new ConflictException({
        label: 'Too Many Components',
        detail: `"${variant.sku}" already holds ${pluralize('component', rule.max, true)}, which is all its fulfilment type allows. Edit or remove one instead.`,
      });
    }

    await this.insertLineOrConflict(data, variant.sku);
    return { success: true, message: `Component added to "${variant.sku}".` };
  }

  // Re-quantifies a line, or moves it to a different unit of the same item
  async updateLine(data: UpdateBomLineDto): Promise<SuccessResponseDto> {
    const { line, variant } = await this.requireOwnedLine(data.id);
    await this.repository.updateLine(line.id, { quantity: data.quantity, uomId: data.uomId });
    return { success: true, message: `Component updated on "${variant.sku}".` };
  }

  // Removes one component, deactivating the variant if that drops it below its type's minimum
  async deleteLine(lineId: string): Promise<SuccessResponseDto> {
    const { line, variant } = await this.requireOwnedLine(lineId);
    const rule = BOM_RULES[variant.fulfilmentType];
    const remaining = (await this.repository.countLines(variant.id)) - 1;
    const deactivate = await this.repository.isVariantActive(variant.id);
    const willDeactivate = deactivate && remaining < rule.min;

    await this.repository.transaction(async () => {
      await this.repository.deleteLine(line.id);
      if (willDeactivate) await this.repository.setVariantInactive(variant.id);
    });

    return {
      success: true,
      message: `Component removed from "${variant.sku}".${willDeactivate ? ' It was deactivated because it no longer has enough to sell.' : ''}`,
    };
  }

  // Replaces a variant's bill of materials, then reconciles whether it can still be sold
  async replace(data: UpsertBomDto): Promise<SuccessResponseDto> {
    const variant = await this.requireOwnedVariant(data.variantId);
    const rule = BOM_RULES[variant.fulfilmentType];

    if (data.lines.length > rule.max) {
      throw new BadRequestException({
        label: 'Too Many Components',
        detail: `A ${variant.fulfilmentType.toLowerCase()} variant takes ${rule.max === 1 ? 'exactly one component' : 'any number of components'}. Remove the extras, or change its fulfilment type.`,
      });
    }

    const deduped = new Map(data.lines.map((line) => [`${line.inventoryItemId}:${line.uomId}`, line]));
    const wasActive = await this.repository.isVariantActive(data.variantId);
    const deactivated = wasActive && deduped.size < rule.min;

    await this.repository.transaction(async () => {
      await this.repository.replaceLines(
        data.variantId,
        [...deduped.values()].map((line, index) => ({
          variantId: data.variantId,
          inventoryItemId: line.inventoryItemId,
          quantity: line.quantity,
          uomId: line.uomId,
          sortOrder: index,
        })),
      );
      // A variant that no longer meets its type's rule cannot stay sellable
      if (deactivated) await this.repository.setVariantInactive(data.variantId);
    });

    return {
      success: true,
      message: `"${variant.sku}" now has ${pluralize('component', deduped.size, true)}.${deactivated ? ' It was deactivated because it no longer has enough to sell.' : ''}`,
    };
  }

  // Links the inventory item already carrying this variant's SKU, at quantity 1 in that item's own
  // stocking unit. The suggestion is resolved server-side, so the caller names no item and cannot
  // pass this off as a way to link something arbitrary under a narrower grant.
  async addSuggested(variantId: string): Promise<SuccessResponseDto> {
    const variant = await this.requireOwnedVariant(variantId);

    const suggestion = await this.repository.findInventoryItemBySku(variant.sku);
    if (!suggestion) {
      throw new ConflictException({
        label: 'No Suggestion',
        detail: `No inventory item carries the SKU "${variant.sku}", so there is nothing to link.`,
      });
    }

    const lines = await this.repository.findLines([variantId]);
    if (lines.some((line) => line.inventoryItemId === suggestion.id)) {
      throw new ConflictException({
        label: 'Already Linked',
        detail: `"${suggestion.name}" is already a component of "${variant.sku}".`,
      });
    }

    return this.replace({
      variantId,
      lines: [
        ...lines.map((line) => ({
          inventoryItemId: line.inventoryItemId,
          quantity: line.quantity,
          uomId: line.uomId,
        })),
        { inventoryItemId: suggestion.id, quantity: 1, uomId: suggestion.uomId },
      ],
    });
  }

  // (item, uom) is unique per variant, so the same item may appear twice only in different units
  private async insertLineOrConflict(data: AddBomLineDto, sku: string): Promise<void> {
    try {
      await this.repository.insertLine({
        variantId: data.variantId,
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        uomId: data.uomId,
        sortOrder: await this.repository.nextSortOrder(data.variantId),
      });
    } catch (error) {
      const candidate = error as { code?: string };
      if (candidate?.code === '23505') {
        throw new ConflictException({
          label: 'Already A Component',
          detail: `"${sku}" already draws on that item in that unit. Edit the existing line instead.`,
        });
      }
      throw error;
    }
  }

  // A line is addressed by its own id, so the variant it belongs to is what ownership is checked on
  private async requireOwnedLine(lineId: string) {
    const line = await this.repository.findLine(lineId);
    if (!line) throw new NotFoundException('Component not found.');
    const variant = await this.requireOwnedVariant(line.variantId);
    return { line, variant };
  }

  // Reading a bill of materials only needs the variant to be in reach
  private async requireReachableVariant(variantId: string): Promise<BomVariantRef> {
    const variant = await this.repository.findVariant(variantId);
    if (!variant) throw new NotFoundException('Variant not found.');
    const offering = await this.repository.findOffering(variant.offeringId);
    if (!offering) throw new NotFoundException('Variant not found.');
    return variant;
  }

  // RLS already refuses a write to someone else's offering; this fails earlier with a clearer message
  private async requireOwnedVariant(variantId: string): Promise<BomVariantRef> {
    const variant = await this.requireReachableVariant(variantId);
    const offering = await this.repository.findOffering(variant.offeringId);
    if (!offering?.isOwned) {
      throw new ForbiddenException({
        label: 'Not Your Offering',
        detail: 'This offering belongs to a wider scope. Switch to the workspace that owns it to change its variants.',
      });
    }
    return variant;
  }
}

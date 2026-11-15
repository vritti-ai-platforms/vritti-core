import type Decimal from '@vritti/api-sdk/decimal';

export class UomFactorLookup {
  constructor(private readonly factors: Map<string, Decimal>) {}

  // Returns the primary units per one unit of the given UOM for the item, or undefined when no conversion exists
  get(inventoryItemId: string, uomId: string): Decimal | undefined {
    return this.factors.get(UomFactorLookup.key(inventoryItemId, uomId));
  }

  // Builds the lookup key of an (inventory item, UOM) pair
  static key(inventoryItemId: string, uomId: string): string {
    return `${inventoryItemId}:${uomId}`;
  }
}

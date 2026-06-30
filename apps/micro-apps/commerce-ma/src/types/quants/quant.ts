// A physical stock segment for an inventory item (mirrors the InventoryItemQuant GraphQL type).
export interface Quant {
  id: string;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  lotId: string | null;
  lotNumber: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  manufacturingDate: string | null;
  expiryDate: string | null;
  createdAt: string;
}

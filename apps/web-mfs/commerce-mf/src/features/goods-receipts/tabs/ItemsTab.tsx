import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import { GoodsReceiptStatus } from '@/schemas/goods-receipts';
import { GoodsReceiptAllocation } from '../components/GoodsReceiptAllocation';
import { GoodsReceiptItems } from '../components/GoodsReceiptItems';

export const ItemsTab = ({
  id,
  receipt,
  existingInventoryItemIds,
}: {
  id: string;
  receipt: GoodsReceiptData;
  existingInventoryItemIds: string[];
}) => {
  if (receipt.status === GoodsReceiptStatus.DRAFT)
    return <GoodsReceiptItems id={id} receipt={receipt} existingInventoryItemIds={existingInventoryItemIds} />;
  return <GoodsReceiptAllocation id={id} isDraft={receipt.status === GoodsReceiptStatus.ALLOCATION_PENDING} />;
};

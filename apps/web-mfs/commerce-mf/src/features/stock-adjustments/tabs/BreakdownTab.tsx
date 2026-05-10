import type React from 'react';
import { type StockAdjustmentData, InventoryTrackingValues, StockAdjustmentTypeValues } from '@/schemas/stock-adjustments';
import { ChangeContent } from '../components/change/ChangeContent';
import { ChangeItemContent } from '../components/change/ChangeItemContent';
import { OpeningItemContent } from '../components/opening/OpeningItemContent';
import { OpeningLotContent } from '../components/opening/OpeningLotContent';
import { OpeningNoneContent } from '../components/opening/OpeningNoneContent';
import { OpeningSerialContent } from '../components/opening/OpeningSerialContent';

interface BreakdownTabProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
}

export const BreakdownTab: React.FC<BreakdownTabProps> = ({ adjustment, isDraft }) => {
  const isOpeningStock = adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK;
  const tracking = adjustment.inventoryItemTracking;

  if (isOpeningStock) {
    if (tracking === InventoryTrackingValues.QUANTITY) {
      return <OpeningNoneContent adjustment={adjustment} isDraft={isDraft} />;
    }
    if (tracking === InventoryTrackingValues.LOT) {
      return <OpeningLotContent adjustment={adjustment} isDraft={isDraft} />;
    }
    if (tracking === InventoryTrackingValues.SERIAL) {
      return <OpeningSerialContent adjustment={adjustment} isDraft={isDraft} />;
    }
    return <OpeningItemContent adjustment={adjustment} isDraft={isDraft} />;
  }

  if (tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL) {
    return <ChangeItemContent adjustment={adjustment} isDraft={isDraft} />;
  }
  return <ChangeContent adjustment={adjustment} isDraft={isDraft} tracking={tracking} />;
};

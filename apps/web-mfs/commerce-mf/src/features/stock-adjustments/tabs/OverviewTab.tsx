import type React from 'react';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { StockAdjustmentOverviewCard } from '../components';

interface OverviewTabProps {
  adjustment: StockAdjustmentData;
  typeLabel: string;
  typeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ adjustment, typeLabel, typeVariant }) => (
  <StockAdjustmentOverviewCard adjustment={adjustment} typeLabel={typeLabel} typeVariant={typeVariant} />
);

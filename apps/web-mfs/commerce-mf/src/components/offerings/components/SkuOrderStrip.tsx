import type React from 'react';
import type { OfferingData, OfferingDimensionData } from '@/schemas/offerings';

interface SkuOrderStripProps {
  offering: OfferingData;
  // Whichever axes are in play — the whole offering on the dimensions tab, this batch's subset in the
  // generate wizard. The shape is the same either way: offering code then one segment per axis, in order.
  dimensions: OfferingDimensionData[];
}

export const SkuOrderStrip: React.FC<SkuOrderStripProps> = ({ offering, dimensions }) => {
  const preview = [offering.code, ...dimensions.map((dimension) => `{${dimension.code}}`)].join('-');

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
      <span className="text-muted-foreground text-xs">SKU order</span>
      <span className="font-mono">{preview}</span>
    </div>
  );
};

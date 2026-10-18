import type React from 'react';
import type { OfferingData, OfferingDimensionData } from '@/schemas/offerings';

interface CodeOrderStripProps {
  offering: OfferingData;
  dimensions: OfferingDimensionData[];
}

export const CodeOrderStrip: React.FC<CodeOrderStripProps> = ({ offering, dimensions }) => {
  const preview = [offering.code, ...dimensions.map((dimension) => `{${dimension.code}}`)].join('-');

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
      <span className="text-muted-foreground text-xs">Code order</span>
      <span className="font-mono">{preview}</span>
    </div>
  );
};

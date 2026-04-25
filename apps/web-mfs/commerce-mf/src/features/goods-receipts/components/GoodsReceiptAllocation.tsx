import { useState } from 'react';
import { GoodsReceiptAllocationContent } from './GoodsReceiptAllocationContent';
import { GoodsReceiptAllocationSidePanel } from './GoodsReceiptAllocationSidePanel';

export const GoodsReceiptAllocation = ({
  id,
  isDraft,
}: {
  id: string;
  isDraft: boolean;
}) => {
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  return (
    <div className="flex gap-6">
      <GoodsReceiptAllocationSidePanel id={id} selectedLineId={selectedLineId} onSelectLine={setSelectedLineId} />
      <div className="min-w-0 flex-1">
        <GoodsReceiptAllocationContent id={id} selectedLineId={selectedLineId} isDraft={isDraft} onSelectLine={setSelectedLineId} />
      </div>
    </div>
  );
};

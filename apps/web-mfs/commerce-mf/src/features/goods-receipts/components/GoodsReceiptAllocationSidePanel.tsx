import { Empty } from '@vritti/quantum-ui/Empty';
import { PageContentPanel, SidePanelListItem } from '@vritti/quantum-ui/PageContent';
import { ClipboardList } from 'lucide-react';
import { useEffect } from 'react';
import { useGoodsReceiptItems } from '@/hooks/goods-receipts/useGoodsReceiptLines';

export const GoodsReceiptAllocationSidePanel = ({
  id,
  selectedLineId,
  onSelectLine,
}: {
  id: string;
  selectedLineId: string | null;
  onSelectLine: (itemId: string | null) => void;
}) => {
  const { data: lines = [] } = useGoodsReceiptItems(id);

  useEffect(() => {
    if (!selectedLineId && lines.length > 0) onSelectLine(lines[0].id);
    if (selectedLineId && !lines.some((line) => line.id === selectedLineId)) onSelectLine(lines[0]?.id ?? null);
  }, [lines, selectedLineId, onSelectLine]);

  return (
    <PageContentPanel
      className="w-80"
      header={`Lines (${lines.length})`}
      contentClassName={lines.length === 0 ? 'flex items-center justify-center p-3' : undefined}
      content={
        lines.length === 0 ? (
          <Empty icon={<ClipboardList />} title="No lines" description="No lines in this receipt." />
        ) : (
          <div className="p-2 space-y-2">
            {lines.map((line) => (
              <SidePanelListItem
                key={line.id}
                active={selectedLineId === line.id}
                onClick={() => onSelectLine(line.id)}
              >
                <div className="text-sm font-medium truncate">{line.inventoryItemName ?? line.inventoryItemId}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Accepted: {line.acceptedQuantity} • Rejected: {line.rejectedQuantity}
                </div>
              </SidePanelListItem>
            ))}
          </div>
        )
      }
    />
  );
};

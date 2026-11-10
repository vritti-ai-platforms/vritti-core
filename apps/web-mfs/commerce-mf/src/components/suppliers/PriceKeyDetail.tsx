import { useFormatters } from '@vritti/quantum-ui/hooks';
import { CalendarClock } from 'lucide-react';
import type React from 'react';
import type { PriceWindow } from '@/schemas/suppliers';
import { priceTrend } from '@/utils/supplierPrice';
import { PriceTrendChip } from './PriceTrendChip';

interface PriceKeyDetailProps {
  price: { current: PriceWindow | null; previous: PriceWindow | null; next: PriceWindow | null };
}

// A price line's second line in a chart key: its last move, or that none is in force, and its next scheduled change
export const PriceKeyDetail: React.FC<PriceKeyDetailProps> = ({ price }) => {
  const fmt = useFormatters();
  const trend = priceTrend(price.current ?? undefined, price.previous ?? undefined);
  return (
    <>
      {trend && <PriceTrendChip trend={trend} />}
      {!price.current && <span>No price in force</span>}
      {price.next && (
        <span className="flex items-center gap-1">
          <CalendarClock className="size-3" aria-hidden />
          Next {fmt.currency(price.next.unitPrice).primary} from {fmt.date(price.next.validFrom).primary}
        </span>
      )}
    </>
  );
};

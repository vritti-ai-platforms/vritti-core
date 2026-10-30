import { DateRangePicker } from '@vritti/quantum-ui/DateRangePicker';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { PriceRange } from '@/utils/supplierPrice';

type Selection = { from: Date | undefined; to?: Date };

interface PriceRangePickerProps {
  value: PriceRange;
  onChange: (range: PriceRange) => void;
}

const toDate = (date: string) => new Date(`${date}T00:00:00`);
const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// The window a price chart shows; a range applies once both ends are picked
export const PriceRangePicker: React.FC<PriceRangePickerProps> = ({ value, onChange }) => {
  // The picker shows a half-picked range while the user chooses its end; the chart keeps the last complete one
  const [selection, setSelection] = useState<Selection>(() => ({ from: toDate(value.from), to: toDate(value.to) }));
  useEffect(() => setSelection({ from: toDate(value.from), to: toDate(value.to) }), [value]);

  return (
    <DateRangePicker
      className="w-64"
      value={selection}
      numberOfMonths={2}
      onValueChange={(range) => {
        setSelection({ from: range?.from, to: range?.to });
        if (range?.from && range.to) onChange({ from: toIso(range.from), to: toIso(range.to) });
      }}
    />
  );
};

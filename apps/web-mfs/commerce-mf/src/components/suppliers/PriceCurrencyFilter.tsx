import type React from 'react';
import { CurrencySelector } from '@/selectors/currency';

interface PriceCurrencyFilterProps {
  currencies: string[];
  value: string | undefined;
  onChange: (currency: string) => void;
}

// Narrows a price chart to one currency; a supplier can requote an item in another of its currencies. Hidden when the
// prices are all in one currency, since there is nothing to choose.
export const PriceCurrencyFilter: React.FC<PriceCurrencyFilterProps> = ({ currencies, value, onChange }) =>
  currencies.length < 2 ? null : (
    <div className="w-40">
      <CurrencySelector
        label={undefined}
        placeholder="Currency"
        includeCodes={currencies}
        clearable={false}
        value={value}
        onChange={(next: unknown) => {
          if (next) onChange(String(next));
        }}
      />
    </div>
  );

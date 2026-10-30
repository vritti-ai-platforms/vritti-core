import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';

interface ConversionPreviewProps {
  // The price as the supplier quotes it
  price: CurrencyValue | undefined;
  poCurrencyCode: string;
  // 1 unit of the price's currency in the PO currency
  rate: number | undefined;
}

// Read-only preview of a foreign-currency price in the PO currency; the stored amount is converted server-side
export const ConversionPreview = ({ price, poCurrencyCode, rate }: ConversionPreviewProps) => {
  const fmt = useFormatters();
  const amount = Number(price?.value);
  const display =
    price && rate && Number.isFinite(amount)
      ? `${fmt.currency({ currency: poCurrencyCode, value: String(amount * rate) }).primary} (1 ${price.currency} = ${fmt.number(rate).primary} ${poCurrencyCode})`
      : '—';
  return <TextField label={`Unit Price in ${poCurrencyCode}`} value={display} disabled readOnly />;
};

import { useFormatters } from '@vritti/quantum-ui/hooks';
import { minorToMajor } from '@vritti/quantum-ui/money';

interface OrderAmountProps {
  // The amount as the order stores it: a whole number of minor units (paise), as a string
  minor: string;
  // The order's currency
  currencyCode: string;
}

// One of an order's amounts in its currency. The order API sends minor units, so it is converted by the currency's
// own decimals here
export const OrderAmount = ({ minor, currencyCode }: OrderAmountProps) => {
  const fmt = useFormatters();
  return <>{fmt.currency({ currency: currencyCode, value: minorToMajor(minor, currencyCode) }).primary}</>;
};

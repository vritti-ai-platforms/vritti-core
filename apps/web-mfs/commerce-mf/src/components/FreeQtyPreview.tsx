import { useFormatters } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';

interface FreeQtyPreviewProps {
  value: number;
  uomSymbol?: string | null;
}

// Read-only preview of the scheme-derived free quantity; the persisted value is computed server-side.
export const FreeQtyPreview = ({ value, uomSymbol }: FreeQtyPreviewProps) => {
  const fmt = useFormatters();
  const display = `${fmt.number(value).primary}${uomSymbol ? ` ${uomSymbol}` : ''}`;
  return <TextField label="Free Quantity" value={display} disabled readOnly />;
};

import { useFormatters } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';

interface FreeQtyPreviewProps {
  value: number;
  uomSymbol?: string | null;
}

// Read-only preview of the free quantity derived from the scheme. The persisted free_qty is always
// computed server-side; this disabled field only mirrors it as the ordered qty / scheme inputs change.
export const FreeQtyPreview = ({ value, uomSymbol }: FreeQtyPreviewProps) => {
  const fmt = useFormatters();
  const display = `${fmt.number(value).primary}${uomSymbol ? ` ${uomSymbol}` : ''}`;
  return <TextField label="Free Quantity" value={display} disabled readOnly />;
};

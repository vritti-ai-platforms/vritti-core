import { Button } from '@vritti/quantum-ui/Button';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { CustomerSelector } from '@vritti/quantum-ui/selects/customer';
import { Typography } from '@vritti/quantum-ui/Typography';
import { CreditCard, Package, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { QuickCreateCustomerModal } from '@/features/customers/forms/QuickCreateCustomerModal';
import type { CustomerData } from '@/schemas/customers';
import { CartLine, type CartLineData } from './CartLine';

interface CartProps {
  lines: CartLineData[];
  subtotal: number;
  isPlacing: boolean;
  customerId: string | null;
  onCustomerChange: (customerId: string | null) => void;
  onUpdateQty: (itemVariantId: string, qty: number) => void;
  onRemove: (itemVariantId: string) => void;
  onClear: () => void;
  onPlaceOrder: () => void;
}

export const Cart = ({
  lines,
  subtotal,
  isPlacing,
  customerId,
  onCustomerChange,
  onUpdateQty,
  onRemove,
  onClear,
  onPlaceOrder,
}: CartProps) => {
  const confirm = useConfirm();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const itemCount = lines.reduce((acc, l) => acc + l.quantity, 0);
  const isEmpty = lines.length === 0;
  const total = subtotal;

  const handleClear = async () => {
    const ok = await confirm({
      title: 'Clear cart?',
      description: 'This will remove all items from the current sale.',
      confirmLabel: 'Clear',
      variant: 'destructive',
    });
    if (ok) onClear();
  };

  // CustomerSelector is single-select, so the value is always a primitive — narrow to a string id
  const handleCustomerSelect = (value: string | number | boolean) => {
    onCustomerChange(typeof value === 'string' && value ? value : null);
  };

  // Newly created customer auto-attaches to the current sale
  const handleCustomerCreated = (customer: CustomerData) => {
    onCustomerChange(customer.id);
    setQuickCreateOpen(false);
  };

  return (
    <aside className="w-96 shrink-0 border-l bg-background flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <div className="flex-1 min-w-0">
          <CustomerSelector
            value={customerId ?? undefined}
            onChange={handleCustomerSelect}
            placeholder="Walk-in — search customer"
            label={undefined}
            clearable
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setQuickCreateOpen(true)}
          aria-label="Add new customer"
          title="Add new customer"
        >
          <UserPlus className="size-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Typography variant="subtitle2">Cart</Typography>
          <Typography variant="caption">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Typography>
        </div>
        {!isEmpty && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive h-7"
            onClick={handleClear}
            startAdornment={<Trash2 className="size-3.5" />}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center">
              <Package className="size-7 text-muted-foreground" />
            </div>
            <Typography variant="subtitle2">Cart is empty</Typography>
            <Typography variant="caption">Tap items on the left to add them.</Typography>
          </div>
        ) : (
          <div className="divide-y">
            {lines.map((line) => (
              <CartLine key={line.itemVariantId} line={line} onUpdateQty={onUpdateQty} onRemove={onRemove} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t bg-background p-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Typography variant="body2" intent="muted">
              Subtotal
            </Typography>
            <Typography variant="body2">₹{subtotal.toLocaleString()}</Typography>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <Typography variant="subtitle1">Total</Typography>
            <Typography variant="subtitle1">₹{total.toLocaleString()}</Typography>
          </div>
        </div>

        <Button
          className="w-full h-11 text-base"
          onClick={onPlaceOrder}
          disabled={isEmpty || isPlacing}
          isLoading={isPlacing}
          startAdornment={<CreditCard className="size-4" />}
        >
          Place Order
        </Button>
      </div>

      <QuickCreateCustomerModal
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={handleCustomerCreated}
      />
    </aside>
  );
};

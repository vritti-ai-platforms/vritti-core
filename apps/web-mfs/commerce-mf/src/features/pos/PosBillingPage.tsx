import { cn } from '@vritti/quantum-ui';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { majorToMinor, minorToMajor } from '@vritti/quantum-ui/money';
import { SearchBar } from '@vritti/quantum-ui/SearchBar';
import { toast } from '@vritti/quantum-ui/Sonner';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { CustomerSelector } from '@vritti/quantum-ui/selects/customer';
import { Typography } from '@vritti/quantum-ui/Typography';
import { ArrowLeft, LayoutGrid, Monitor, Tag, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuickCreateCustomerModal } from '@/features/customers/forms/QuickCreateCustomerModal';
import { useCreateOrder } from '@/hooks/orders';
import { usePosTerminal } from '@/hooks/pos-terminals/usePosTerminal';
import type { CustomerData } from '@/schemas/customers';
import type { CurrencyAmount } from '@/schemas/offerings';
import { getErrorMessage } from '@/utils/error';
import { Cart } from './components/Cart';
import type { CartLineData } from './components/CartLine';
import { ItemSelectionSheet } from './components/ItemSelectionSheet';
import { ItemsGrid } from './components/ItemsGrid';
import { type PosSellableItem, useTerminalSellables } from './hooks/useTerminalSellables';

const ALL_CATEGORY = 'all';

interface SheetOffering {
  id: string;
  name: string;
  currencyCode: string;
}

// Stable cart-line identity: variant id + the sorted set of selected modifier-option ids
function lineKey(offeringVariantId: string, modifiers: { modifierOptionId: string }[]): string {
  const ids = modifiers
    .map((m) => m.modifierOptionId)
    .sort()
    .join(',');
  return `${offeringVariantId}|${ids}`;
}

export const PosBillingPage = () => {
  const navigate = useNavigate();
  const { id: terminalId } = useSlugParams('terminalSlug');

  const { data: terminal, isLoading: terminalLoading, error: terminalError } = usePosTerminal(terminalId ?? null);
  const {
    items: sellableItems,
    catalogId,
    catalogMissing,
    isLoading: itemsLoading,
    error: itemsError,
  } = useTerminalSellables(terminal);

  const [cart, setCart] = useState<CartLineData[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [sheetOffering, setSheetOffering] = useState<SheetOffering | null>(null);

  const createOrderMutation = useCreateOrder({
    onSuccess: () => {
      toast.success('Order placed');
      setCart([]);
      setCustomerId(null);
    },
  });

  // Merges a new line into the cart, incrementing qty when an identical variant+modifier combo exists
  const addLine = (line: Omit<CartLineData, 'lineId'>) => {
    const key = lineKey(line.offeringVariantId, line.modifiers);
    setCart((prev) => {
      const existing = prev.find((l) => l.lineId === key);
      if (existing) {
        return prev.map((l) => (l.lineId === key ? { ...l, quantity: l.quantity + line.quantity } : l));
      }
      return [...prev, { ...line, lineId: key }];
    });
  };

  // Tile tap: instant-add the lone variant when there are no options or modifiers; otherwise open the sheet
  const handleSelect = (item: PosSellableItem) => {
    if (item.variantCount <= 1 && item.modifierGroupCount === 0 && item.singleVariant) {
      addLine({
        offeringVariantId: item.singleVariant.id,
        offeringName: item.name,
        offeringVariantName: item.singleVariant.name,
        unitPrice: item.singleVariant.price,
        modifiers: [],
        quantity: 1,
      });
      return;
    }
    setSheetOffering({ id: item.offeringId, name: item.name, currencyCode: item.currencyCode });
  };

  const updateQty = (lineId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.lineId !== lineId));
      return;
    }
    setCart((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, quantity: qty } : l)));
  };

  const removeLine = (lineId: string) => setCart((prev) => prev.filter((l) => l.lineId !== lineId));

  const clearCart = () => setCart([]);

  const subtotal = useMemo<CurrencyAmount | null>(() => {
    if (cart.length === 0) return null;
    const currency = cart[0].unitPrice.currency;
    const totalMinor = cart.reduce((acc, line) => {
      let unit = BigInt(majorToMinor(line.unitPrice.value, line.unitPrice.currency));
      for (const modifier of line.modifiers) unit += BigInt(modifier.additionalPrice);
      return acc + unit * BigInt(line.quantity);
    }, 0n);
    return { currency, value: minorToMajor(totalMinor.toString(), currency) };
  }, [cart]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of sellableItems) {
      if (item.categoryName) counts[item.categoryName] = (counts[item.categoryName] ?? 0) + 1;
    }
    return counts;
  }, [sellableItems]);

  const categories = useMemo(() => {
    return [ALL_CATEGORY, ...Object.keys(categoryCounts).sort()];
  }, [categoryCounts]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sellableItems.filter((item) => {
      if (activeCategory !== ALL_CATEGORY && item.categoryName !== activeCategory) return false;
      if (!query) return true;
      return item.name.toLowerCase().includes(query);
    });
  }, [sellableItems, activeCategory, search]);

  const handleCustomerSelect = (value: string | number | boolean) => {
    setCustomerId(typeof value === 'string' && value ? value : null);
  };

  const handleCustomerCreated = (customer: CustomerData) => {
    setCustomerId(customer.id);
    setQuickCreateOpen(false);
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0 || !terminal) return;
    createOrderMutation.mutate({
      type: 'TAKEAWAY',
      channel: 'WALK_IN',
      customerId: customerId ?? undefined,
      items: cart.map((line) => ({
        offeringVariantId: line.offeringVariantId,
        quantity: line.quantity,
        // Server re-derives each modifier's authoritative price from the catalog — client sends identity only
        modifiers: line.modifiers.map((modifier) => ({
          modifierGroupId: modifier.modifierGroupId,
          modifierOptionId: modifier.modifierOptionId,
          name: modifier.name,
        })),
      })),
    });
  };

  if (terminalLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (terminalError) {
    return <Alert variant="destructive" title="Failed to load" description={getErrorMessage(terminalError)} />;
  }

  if (!terminal) {
    return <Empty icon={<Monitor />} title="Register not found" description="This POS terminal no longer exists." />;
  }

  return (
    <div
      className="pos-enter flex flex-col overflow-hidden rounded-xl border bg-background shadow-sm"
      style={{ height: 'calc(100vh - 120px)' }}
    >
      <div className="flex items-center gap-3 border-b border-border bg-card/60 px-4 py-3 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => navigate('..')}
          aria-label="Back to terminals"
          title="Back to terminals"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Monitor className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Typography variant="subtitle1" className="truncate tracking-tight">
                {terminal.name}
              </Typography>
              <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-500">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Open
              </span>
            </div>
            <Typography variant="caption" intent="muted" className="leading-none">
              Point of sale
            </Typography>
          </div>
        </div>
        <div className="flex-1" />
        <div className="w-72 max-w-[40%]">
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

      <div className="flex min-h-0 flex-1">
        <nav className="flex w-52 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-card/40 p-3">
          <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </div>
          {categories.map((category) => {
            const isActive = activeCategory === category;
            const isAll = category === ALL_CATEGORY;
            const count = isAll ? sellableItems.length : (categoryCounts[category] ?? 0);
            const Icon = isAll ? LayoutGrid : Tag;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'group flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-all',
                  isActive
                    ? 'bg-primary/10 font-medium text-primary shadow-[inset_2px_0_0] shadow-primary'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground',
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Icon
                    className={cn(
                      'size-4 shrink-0',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  />
                  <span className="truncate capitalize">{isAll ? 'All items' : category}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                    isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border bg-card/40 px-4 py-3">
            <div className="flex-1">
              <SearchBar placeholder="Search items…" value={search} onChange={setSearch} />
            </div>
            <Typography variant="caption" intent="muted" className="hidden shrink-0 tabular-nums sm:block">
              {filteredItems.length} items
            </Typography>
          </div>

          <div className="pos-stage flex-1 overflow-y-auto px-4 py-4">
            {itemsError ? (
              <Alert variant="destructive" title="Failed to load" description={getErrorMessage(itemsError)} />
            ) : catalogMissing ? (
              <Alert
                variant="warning"
                title="No catalog for this terminal"
                description="This terminal's business unit and channel have no catalog yet. Create one to start billing."
              />
            ) : (
              <ItemsGrid items={filteredItems} isLoading={itemsLoading} onSelect={handleSelect} />
            )}
          </div>
        </div>

        <Cart
          lines={cart}
          subtotal={subtotal}
          isPlacing={createOrderMutation.isPending}
          onUpdateQty={updateQty}
          onRemove={removeLine}
          onClear={clearCart}
          onPlaceOrder={handlePlaceOrder}
        />
      </div>

      {catalogId ? (
        <ItemSelectionSheet
          catalogId={catalogId}
          offering={sheetOffering}
          open={sheetOffering != null}
          onClose={() => setSheetOffering(null)}
          onAdd={addLine}
        />
      ) : null}

      <QuickCreateCustomerModal
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={handleCustomerCreated}
      />
    </div>
  );
};

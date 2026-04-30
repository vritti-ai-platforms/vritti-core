import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { useLayoutMode } from '@vritti/quantum-ui/context';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SearchBar } from '@vritti/quantum-ui/SearchBar';
import { toast } from '@vritti/quantum-ui/Sonner';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Monitor } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTerminalSellableItems } from '@/hooks/price-lists';
import { usePosTerminal } from '@/hooks/pos-terminals/usePosTerminal';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import type { PosTerminalSellableItemData } from '@/schemas/price-lists';
import { getErrorMessage } from '@/utils/error';
import { Cart } from './components/Cart';
import type { CartLineData } from './components/CartLine';
import { ItemsGrid } from './components/ItemsGrid';

const ALL_CATEGORY = 'all';

export const PosBillingPage = () => {
  const { setMode } = useLayoutMode();
  const { id: terminalId } = useSlugParams('terminalSlug');

  // Take over the full viewport while billing — restore padded layout on unmount
  useEffect(() => {
    setMode('full');
    return () => setMode('padded');
  }, [setMode]);

  const { data: terminal, isLoading: terminalLoading, error: terminalError } = usePosTerminal(terminalId ?? null);
  const {
    data: sellableItems = [],
    isLoading: itemsLoading,
    error: itemsError,
  } = useTerminalSellableItems(terminalId ?? null);
  const [cart, setCart] = useState<CartLineData[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);

  const createOrderMutation = useCreateOrder({
    onSuccess: () => {
      toast.success('Order placed');
      setCart([]);
      setCustomerId(null);
    },
  });

  // Adds an item to the cart or increments its quantity if already present
  const addToCart = (item: PosTerminalSellableItemData) => {
    const unitPrice = item.priceOverride ?? item.basePrice;
    if (unitPrice == null) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.itemVariantId === item.itemVariantId);
      if (existing) {
        return prev.map((l) => (l.itemVariantId === item.itemVariantId ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          itemVariantId: item.itemVariantId,
          itemName: item.itemName,
          itemVariantName: item.itemVariantName,
          unitPrice,
          quantity: 1,
        },
      ];
    });
  };

  // Sets the quantity for a cart line, removing the line when quantity drops to zero
  const updateQty = (itemVariantId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.itemVariantId !== itemVariantId));
      return;
    }
    setCart((prev) => prev.map((l) => (l.itemVariantId === itemVariantId ? { ...l, quantity: qty } : l)));
  };

  const removeLine = (itemVariantId: string) =>
    setCart((prev) => prev.filter((l) => l.itemVariantId !== itemVariantId));

  const clearCart = () => setCart([]);

  const subtotal = useMemo(() => cart.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0), [cart]);

  // Map of variantId -> quantity for quick lookup in ItemCard badges
  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of cart) map[line.itemVariantId] = line.quantity;
    return map;
  }, [cart]);

  // Unique categories from the price list data
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of sellableItems) {
      if (item.categoryName) set.add(item.categoryName);
    }
    return [ALL_CATEGORY, ...Array.from(set).sort()];
  }, [sellableItems]);

  // Filter items by active category and search query
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sellableItems.filter((item) => {
      if (activeCategory !== ALL_CATEGORY && item.categoryName !== activeCategory) return false;
      if (!query) return true;
      return (
        item.itemName.toLowerCase().includes(query) ||
        item.itemVariantName.toLowerCase().includes(query) ||
        item.itemVariantSku.toLowerCase().includes(query)
      );
    });
  }, [sellableItems, activeCategory, search]);

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    createOrderMutation.mutate({
      type: 'TAKEAWAY',
      channel: 'WALK_IN',
      customerId: customerId ?? undefined,
      items: cart.map((line) => ({
        variantId: line.itemVariantId,
        quantity: line.quantity,
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
    <div className="flex flex-1 min-h-0 pt-8">
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="px-6 space-y-4">
          <PageHeader title={terminal.name} description="Search items, add to cart, and checkout quickly" />
          <SearchBar placeholder="Search items…" value={search} onChange={setSearch} />

          {categories.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <Button
                    key={category}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-full capitalize"
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </Button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {itemsError ? (
            <Alert variant="destructive" title="Failed to load" description={getErrorMessage(itemsError)} />
          ) : (
            <ItemsGrid
              items={filteredItems}
              cartQuantities={cartQuantities}
              isLoading={itemsLoading}
              onAdd={addToCart}
            />
          )}
        </div>
      </div>

      <Cart
        lines={cart}
        subtotal={subtotal}
        isPlacing={createOrderMutation.isPending}
        customerId={customerId}
        onCustomerChange={setCustomerId}
        onUpdateQty={updateQty}
        onRemove={removeLine}
        onClear={clearCart}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
};
